import { Request, Response } from 'express';
import { momoService } from '../services/momo.service';
import { prisma } from '../lib/prisma';
import { emailService } from '../lib/email.service';

export const PaymentController = {
  /**
   * 1. Khởi tạo giao dịch thanh toán MoMo V2 All-In-One (payWithMethod)
   */
  async createMomoPayment(req: Request, res: Response) {
    try {
      const { orderId, redirectUrl } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Thiếu orderId' });
      }

      // Tìm đơn hàng theo ID hoặc OrderCode
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderId }, { orderCode: orderId }],
        },
        include: { items: true },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      const amount = Number(order.totalAmount);
      const callbackRedirect = redirectUrl || `${req.protocol}://${req.get('host')}/api/v1/payment/momo/callback`;

      const momoResult = await momoService.createPayment({
        orderId: order.id,
        amount,
        orderInfo: `Thanh toan don hang ${order.orderCode} tai CameraHub`,
        redirectUrl: callbackRedirect,
      });

      if (momoResult.resultCode === 0 && momoResult.payUrl) {
        return res.json({
          success: true,
          payUrl: momoResult.payUrl,
          qrCodeUrl: momoResult.qrCodeUrl,
          deeplink: momoResult.deeplink,
          orderCode: order.orderCode,
          amount,
        });
      }

      return res.status(400).json({
        success: false,
        message: momoResult.message || 'Không thể tạo giao dịch MoMo',
        momoResult,
      });
    } catch (error: any) {
      console.error('Lỗi khởi tạo thanh toán MoMo:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 2. Chức năng Thanh toán lại MoMo (Pay Again)
   */
  async payAgain(req: Request, res: Response) {
    try {
      const { orderId, redirectUrl } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Thiếu orderId' });
      }

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderId }, { orderCode: orderId }],
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      if (order.orderStatus === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy, không thể thanh toán lại' });
      }

      if (order.paymentStatus === 'completed') {
        return res.status(400).json({ success: false, message: 'Đơn hàng này đã được thanh toán thành công trước đó' });
      }

      const callbackRedirect = redirectUrl || `${req.protocol}://${req.get('host')}/api/v1/payment/momo/callback`;

      const momoResult = await momoService.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        orderInfo: `Thanh toan lai don hang ${order.orderCode} tai CameraHub`,
        redirectUrl: callbackRedirect,
      });

      if (momoResult.resultCode === 0 && momoResult.payUrl) {
        return res.json({
          success: true,
          payUrl: momoResult.payUrl,
          qrCodeUrl: momoResult.qrCodeUrl,
          deeplink: momoResult.deeplink,
          orderCode: order.orderCode,
        });
      }

      return res.status(400).json({
        success: false,
        message: momoResult.message || 'Không thể khởi tạo thanh toán lại qua MoMo',
      });
    } catch (error: any) {
      console.error('Lỗi thanh toán lại MoMo:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * 3. User Return Callback (GET /payment/momo/callback)
   */
  async handleMomoCallback(req: Request, res: Response) {
    try {
      const query = req.query as Record<string, any>;
      console.log('↩️ [MoMo Return Callback Query]:', query);

      const isValid = momoService.verifyReturnSignature(query);
      const { orderId, resultCode, transId } = query;
      const rawOrderCode = (orderId || '').split('_')[0];

      // Tìm đơn hàng
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ orderCode: rawOrderCode }, { id: rawOrderCode }],
        },
      });

      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';

      if (!isValid) {
        console.warn('⚠️ Chữ ký Return Callback từ MoMo không hợp lệ!');
        return res.redirect(`${frontendUrl}/orders?status=failed&error=invalid_signature`);
      }

      if (Number(resultCode) === 0 && transId) {
        // Thanh toán thành công từ phía MoMo -> Tiến hành đối soát và cập nhật
        try {
          await momoService.markPaid(orderId, transId, query);

          if (order && order.customerEmail) {
            try {
              await emailService.sendOrderConfirmation({
                customerEmail: order.customerEmail,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                orderCode: order.orderCode,
                totalAmount: Number(order.totalAmount),
                paymentMethod: 'Ví MoMo (Đã thanh toán thành công)',
                shippingAddress: order.shippingAddress,
                city: order.city || 'Việt Nam',
                items: [],
              });
            } catch (mErr) {
              console.warn('Lỗi gửi email callback:', mErr);
            }
          }

          return res.redirect(`${frontendUrl}/order-success?orderId=${order?.id || rawOrderCode}&status=success&momo=1`);
        } catch (markErr: any) {
          console.error('Lỗi khi cập nhật trạng thái đơn hàng tại callback:', markErr);
          return res.redirect(
            `${frontendUrl}/order-success?orderId=${order?.id || rawOrderCode}&status=failed&message=${encodeURIComponent(
              markErr.message || 'Lỗi đối soát thanh toán'
            )}`
          );
        }
      } else {
        return res.redirect(
          `${frontendUrl}/order-success?orderId=${order?.id || rawOrderCode}&status=failed&message=${encodeURIComponent(
            query.message || 'Giao dịch MoMo không thành công'
          )}`
        );
      }
    } catch (error: any) {
      console.error('Lỗi xử lý MoMo Callback:', error);
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/orders?status=error`);
    }
  },

  /**
   * 4. Server-to-Server IPN Webhook (POST /payment/momo/ipn)
   */
  async handleMomoIpn(req: Request, res: Response) {
    try {
      const body = req.body;
      console.log('🔔 [MoMo IPN Webhook Body]:', body);

      const isValidSignature = momoService.verifyIpnSignature(body);
      if (!isValidSignature) {
        console.warn('⚠️ MoMo IPN Signature verification failed!');
        return res.status(400).json({ message: 'Invalid Signature' });
      }

      const { orderId, resultCode, transId } = body;

      if (Number(resultCode) === 0 && transId) {
        const updatedOrder = await momoService.markPaid(orderId, transId, body);

        if (updatedOrder && updatedOrder.customerEmail) {
          try {
            await emailService.sendOrderConfirmation({
              customerEmail: updatedOrder.customerEmail,
              customerName: updatedOrder.customerName,
              customerPhone: updatedOrder.customerPhone,
              orderCode: updatedOrder.orderCode,
              totalAmount: Number(updatedOrder.totalAmount),
              paymentMethod: 'Ví MoMo (Đã thanh toán)',
              shippingAddress: updatedOrder.shippingAddress,
              city: updatedOrder.city || 'Việt Nam',
              items: updatedOrder.items.map((i) => ({
                name: i.name,
                price: Number(i.price),
                quantity: i.quantity,
                imageUrl: i.imageUrl || undefined,
              })),
            });
          } catch (mailErr) {
            console.warn('Gửi email MoMo IPN thất bại:', mailErr);
          }
        }

        console.log(`✅ [MoMo IPN] Đã cập nhật đơn hàng ${orderId} sang COMPLETED sau khi đối soát hợp lệ!`);
      }

      return res.status(200).json({ message: 'IPN Received' });

    } catch (error: any) {
      console.error('Lỗi xử lý MoMo IPN:', error);
      return res.status(400).json({ message: error.message || 'Lỗi xử lý Webhook IPN' });
    }
  },
};
