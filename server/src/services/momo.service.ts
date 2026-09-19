import crypto from 'crypto';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';
dotenv.config();

export interface MomoCreatePaymentParams {
  orderId: string; // Order UUID or orderCode
  amount: number;
  orderInfo?: string;
  extraData?: string;
  redirectUrl?: string;
}

export interface MomoCreatePaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  applink?: string;
}

export interface MomoIpnBody {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number | string;
  orderInfo: string;
  orderType: string;
  transId: number | string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

class MomoService {
  private get partnerCode(): string {
    return process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529';
  }

  private get accessKey(): string {
    return process.env.MOMO_ACCESS_KEY || 'klm05TvNBzhg7h7j';
  }

  private get secretKey(): string {
    return process.env.MOMO_SECRET_KEY || 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa';
  }

  private get endpoint(): string {
    return process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
  }

  private get redirectUrl(): string {
    return process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/order-success';
  }

  private get ipnUrl(): string {
    return process.env.MOMO_IPN_URL || 'http://127.0.0.1:5000/api/v1/payment/momo/ipn';
  }

  private get requestType(): string {
    return process.env.MOMO_REQUEST_TYPE || 'payWithMethod';
  }

  /**
   * Tạo chữ ký số HMAC-SHA256
   */
  private generateHmacSha256(rawString: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(rawString).digest('hex');
  }

  /**
   * Khởi tạo phiên thanh toán MoMo V2 All-In-One (payWithMethod)
   * Tự động điều chỉnh hạn mức Sandbox (1.000đ - 50.000.000đ)
   */
  async createPayment(params: MomoCreatePaymentParams): Promise<MomoCreatePaymentResponse> {
    // 1. Tìm đơn hàng
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.orderId }, { orderCode: params.orderId }],
      },
    });

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng với mã: ${params.orderId}`);
    }

    // 2. Safeguard số tiền giao dịch cho môi trường Sandbox
    let safeAmount = Math.round(params.amount || Number(order.totalAmount));
    if (safeAmount < 1000) {
      safeAmount = 1000;
    } else if (safeAmount > 50000000) {
      // MoMo Sandbox giới hạn tối đa 50 triệu / giao dịch
      console.warn(`[MoMo Sandbox Safeguard] Cắt số tiền ${safeAmount}đ xuống 50.000.000đ để tránh lỗi resultCode: 22`);
      safeAmount = 50000000;
    }

    // 3. Tạo mã giao dịch duy nhất
    const timestamp = Date.now();
    const gatewayOrderId = `${order.orderCode}_${timestamp}`;
    const requestId = `${this.partnerCode}_${timestamp}`;
    const orderInfo = params.orderInfo || `Thanh toan don hang ${order.orderCode} tai CameraHub`;
    const redirectUrl = params.redirectUrl || this.redirectUrl;
    const ipnUrl = this.ipnUrl;
    const extraData = params.extraData || '';
    const requestType = this.requestType; // 'payWithMethod' cho All-In-One

    // 4. Lưu bản ghi PaymentTransaction vào Database
    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: 'momo',
        gatewayOrderId,
        amount: safeAmount,
        status: 'initiated',
        requestPayload: JSON.stringify({
          gatewayOrderId,
          requestId,
          safeAmount,
          originalAmount: order.totalAmount,
          requestType,
        }),
      },
    });

    // 5. Tính toán chữ ký số theo đúng thứ tự Alphabet bắt buộc của MoMo
    const rawSignature = `accessKey=${this.accessKey}&amount=${safeAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${gatewayOrderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = this.generateHmacSha256(rawSignature);

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'CameraHub Store',
      storeId: 'CameraHubMainStore',
      requestId,
      amount: safeAmount,
      orderId: gatewayOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    };

    try {
      // 6. Gọi MoMo Endpoint với Timeout 8 giây
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = (await response.json()) as MomoCreatePaymentResponse;

      // 7. Cập nhật bản ghi giao dịch
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          resultCode: responseData.resultCode,
          message: responseData.message,
          responsePayload: JSON.stringify(responseData),
          status: responseData.resultCode === 0 ? 'initiated' : 'failed',
        },
      });

      return responseData;
    } catch (error: any) {
      console.error('Lỗi khi gọi API MoMo Gateway:', error);
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          message: error.message || 'Lỗi kết nối / Timeout tới MoMo Gateway',
        },
      });
      throw new Error(`Không thể kết nối đến cổng MoMo Gateway: ${error.message}`);
    }
  }

  /**
   * So sánh an toàn thời gian chống Timing Attack (Side-channel vulnerability)
   */
  private safeCompareSignatures(a: string, b: string): boolean {
    try {
      if (!a || !b) return false;
      const bufA = Buffer.from(a, 'utf8');
      const bufB = Buffer.from(b, 'utf8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Xác thực chữ ký IPN Webhook từ MoMo
   */
  verifyIpnSignature(body: MomoIpnBody): boolean {
    try {
      const rawSignature = `accessKey=${this.accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
      const generatedSignature = this.generateHmacSha256(rawSignature);
      return this.safeCompareSignatures(generatedSignature, body.signature);
    } catch (error) {
      console.error('Lỗi kiểm tra chữ ký IPN MoMo:', error);
      return false;
    }
  }

  /**
   * Xác thực chữ ký Return Query từ MoMo khi khách quay về Website
   */
  verifyReturnSignature(query: Record<string, any>): boolean {
    try {
      const rawSignature = `accessKey=${this.accessKey}&amount=${query.amount}&extraData=${query.extraData || ''}&message=${query.message}&orderId=${query.orderId}&orderInfo=${query.orderInfo}&orderType=${query.orderType}&partnerCode=${query.partnerCode}&payType=${query.payType}&requestId=${query.requestId}&responseTime=${query.responseTime}&resultCode=${query.resultCode}&transId=${query.transId}`;
      const generatedSignature = this.generateHmacSha256(rawSignature);
      return this.safeCompareSignatures(generatedSignature, query.signature);
    } catch (error) {
      console.error('Lỗi kiểm tra chữ ký Return MoMo:', error);
      return false;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng và transaction thành Đã thanh toán (completed)
   * Có cơ chế đối soát số tiền chống gian lận (Amount Tampering Protection) & Idempotency
   */
  async markPaid(gatewayOrderId: string, transId: string | number, responsePayload?: any) {
    // gatewayOrderId dạng: CAM-XXXXXX_1720000000
    const rawOrderCode = gatewayOrderId.split('_')[0];

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderCode: rawOrderCode }, { id: rawOrderCode }],
      },
      include: { items: true },
    });

    if (!order) return null;

    // 1. Kiểm tra đối soát số tiền (Amount Tampering Check)
    if (responsePayload) {
      const paidAmount = Number(responsePayload.amount);
      const expectedAmount = Number(order.totalAmount);

      if (responsePayload.amount === undefined || isNaN(paidAmount) || paidAmount !== expectedAmount) {
        console.error(
          `🚨 [MoMo Security Alert] Phát hiện sai lệch số tiền! Expected: ${expectedAmount}đ, Thực nhận: ${responsePayload.amount} cho đơn ${order.orderCode}`
        );

        // Ghi lại giao dịch bất thường để Admin xử lý
        await prisma.paymentTransaction.updateMany({
          where: {
            OR: [{ gatewayOrderId }, { orderId: order.id }],
          },
          data: {
            status: 'tampered',
            transactionId: String(transId),
            resultCode: 999,
            message: `Cảnh báo gian lận số tiền: Thực trả ${responsePayload.amount}đ vs Đơn hàng ${expectedAmount}đ`,
            responsePayload: JSON.stringify(responsePayload),
          },
        });

        throw new Error(
          `Sai lệch số tiền thanh toán: MoMo ghi nhận ${responsePayload.amount}đ trong khi đơn hàng là ${expectedAmount}đ!`
        );
      }
    }

    // 2. Idempotency check: Nếu đơn đã thanh toán trước đó, không thực hiện cập nhật lại
    if (order.paymentStatus === 'completed') {
      return order;
    }

    // 3. Cập nhật transaction
    await prisma.paymentTransaction.updateMany({
      where: {
        OR: [{ gatewayOrderId }, { orderId: order.id }],
      },
      data: {
        status: 'paid',
        transactionId: String(transId),
        resultCode: 0,
        paidAt: new Date(),
        responsePayload: responsePayload ? JSON.stringify(responsePayload) : undefined,
      },
    });

    // 4. Cập nhật order: paymentStatus = 'completed', orderStatus = 'shipping'
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'completed',
        orderStatus: order.orderStatus === 'pending' ? 'shipping' : order.orderStatus,
        notes: `${order.notes || ''} [MoMo TransId: ${transId}]`.trim(),
      },
      include: { items: true },
    });

    return updatedOrder;
  }
}

export const momoService = new MomoService();
