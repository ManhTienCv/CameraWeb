import nodemailer from 'nodemailer';

export interface OrderEmailData {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: string;
  totalAmount: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
}

export interface OtpEmailData {
  toEmail: string;
  otpCode: string;
  purpose: 'register' | 'change_email';
  recipientName?: string;
}

export interface ShippingNotificationData {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  carrierName: string;
  trackingCode: string;
  shippingAddress: string;
  city: string;
  status: 'shipping' | 'delivered';
  statusTitle: string;
  statusDesc: string;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.isConfigured = true;
      console.log('✅ [EmailService] SMTP Transporter configured for:', user);
    } else {
      console.log('ℹ️ [EmailService] SMTP credentials not fully provided in .env. Running in preview/log mode.');
    }
  }

  /**
   * 1. Gửi Email Mã Xác Thực OTP (Đăng ký tài khoản / Đổi Email)
   */
  public async sendOtpEmail(data: OtpEmailData): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM || 'CameraHub Store <nvmtein@gmail.com>';
    const title =
      data.purpose === 'register'
        ? 'Mã Xác Thực OTP Đăng Ký Tài Khoản CameraHub'
        : 'Mã Xác Thực OTP Đổi Địa Chỉ Email CameraHub';

    const actionText =
      data.purpose === 'register'
        ? 'hoàn tất quá trình tạo tài khoản thành viên mới'
        : 'xác nhận thay đổi địa chỉ email tài khoản';

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 580px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 32px 28px; }
    .otp-card { text-align: center; background: #fff7ed; border: 2px dashed #ea580c; border-radius: 16px; padding: 24px; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ea580c; margin: 8px 0; display: inline-block; }
    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; font-size: 12px; color: #991b1b; line-height: 1.6; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📷 CAMERAHUB VIỆT NAM</h1>
      <p>Hệ Thống Thiết Bị Nhiếp Ảnh Chính Hãng</p>
    </div>

    <div class="content">
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">${title}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Xin chào <strong>${data.recipientName || data.toEmail}</strong>,<br>
        Bạn vừa gửi yêu cầu ${actionText} tại hệ thống CameraHub. Dưới đây là mã xác thực OTP của bạn:
      </p>

      <div class="otp-card">
        <div style="font-size: 12px; font-weight: 700; color: #9a3412; text-transform: uppercase;">MÃ XÁC THỰC OTP (HẾT HẠN TRONG 5 PHÚT)</div>
        <div class="otp-code">${data.otpCode}</div>
        <div style="font-size: 12px; color: #64748b;">Vui lòng nhập mã gồm 6 chữ số này vào trang web để tiếp tục.</div>
      </div>

      <div class="warning-box">
        <strong>⚠️ Lưu ý bảo mật:</strong> Tuyệt đối KHÔNG chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên CameraHub. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ ngay hotline 1900 6868.
      </div>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} CameraHub Store. All rights reserved.<br>
      Email tự động được gửi từ hệ thống bảo mật CameraHub.
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (this.transporter && this.isConfigured) {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: data.toEmail,
          subject: `📷 [CameraHub] ${data.otpCode} là mã xác thực OTP của bạn`,
          html: htmlContent,
        });
        console.log(`✉️ [EmailService] OTP email sent to ${data.toEmail}. Message ID: ${info.messageId}`);
        return true;
      } else {
        console.log(`✉️ [EmailService Mock] Simulated OTP ${data.otpCode} sent to ${data.toEmail}`);
        return true;
      }
    } catch (err) {
      console.error('❌ [EmailService] Failed to send OTP email:', err);
      return false;
    }
  }

  /**
   * 2. Gửi Email Thông Báo Đơn Hàng Vận Chuyển (Shipping Journey Updates)
   */
  public async sendShippingNotification(data: ShippingNotificationData): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM || 'CameraHub Store <nvmtein@gmail.com>';
    const isDelivered = data.status === 'delivered';

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 30px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .content { padding: 28px; }
    .status-badge { display: inline-block; padding: 6px 16px; background: ${isDelivered ? '#10b981' : '#2563eb'}; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0; font-size: 13px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📷 CAMERAHUB VIỆT NAM</h1>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Thông Báo Cập Nhật Trạng Thái Giao Hàng</p>
    </div>

    <div class="content">
      <div style="margin-bottom: 16px;">
        <span class="status-badge">${isDelivered ? '✅ GIAO HÀNG THÀNH CÔNG' : '🚚 ĐANG VẬN CHUYỂN'}</span>
      </div>

      <h2 style="font-size: 20px; color: #0f172a; margin: 0 0 8px;">${data.statusTitle}</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Xin chào <strong>${data.customerName}</strong>,<br>
        ${data.statusDesc}
      </p>

      <div class="info-card">
        <strong>Mã đơn hàng:</strong> <span style="color: #ea580c; font-weight: 800;">#${data.orderCode}</span><br>
        <strong>Đối tác vận chuyển:</strong> ${data.carrierName}<br>
        <strong>Mã vận đơn:</strong> <span style="font-family: monospace; font-weight: 700;">${data.trackingCode}</span><br>
        <strong>Địa chỉ nhận hàng:</strong> ${data.shippingAddress}, ${data.city}
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #64748b;">Khách hàng có quyền đồng kiểm tra gói hàng máy ảnh trước khi nhận từ Shipper.</p>
      </div>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} CameraHub Store • Hotline: 1900 6868
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (this.transporter && this.isConfigured) {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: data.customerEmail,
          subject: `🚚 [CameraHub] Cập nhật đơn hàng #${data.orderCode} - ${data.statusTitle}`,
          html: htmlContent,
        });
        console.log(`✉️ [EmailService] Shipping notification email sent to ${data.customerEmail}. Message ID: ${info.messageId}`);
        return true;
      }
      return true;
    } catch (err) {
      console.error('❌ [EmailService] Failed to send shipping email:', err);
      return false;
    }
  }

  /**
   * 3. Gửi Email Xác Nhận Hóa Đơn Đơn Hàng (Kèm VietQR)
   */
  public async sendOrderConfirmation(orderData: OrderEmailData): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM || 'CameraHub Store <nvmtein@gmail.com>';
    const isVietQR = orderData.paymentMethod === 'vietqr' || orderData.paymentMethod === 'bank_transfer';
    const qrImageUrl = `https://img.vietqr.io/image/vietcombank-88888888-compact2.png?amount=${orderData.totalAmount}&addInfo=${orderData.orderCode}&accountName=NGUYEN%20MANH%20TIEN`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 30px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
    .badge { display: inline-block; padding: 6px 14px; background: #ea580c; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 12px; }
    .content { padding: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { text-align: left; font-size: 12px; color: #64748b; padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
    .table td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
    .total-box { text-align: right; padding: 16px; background: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5; margin-bottom: 20px; }
    .total-box .total-label { font-size: 13px; color: #9a3412; font-weight: 600; }
    .total-box .total-amount { font-size: 22px; color: #ea580c; font-weight: 800; }
    .qr-card { text-align: center; background: #ffffff; border: 2px dashed #ea580c; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
    .qr-card img { max-width: 220px; border-radius: 10px; margin: 10px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📷 CAMERAHUB VIỆT NAM</h1>
      <p>Hệ Thống Thiết Bị Nhiếp Ảnh & Máy Ảnh Chính Hãng</p>
      <div class="badge">ĐƠN HÀNG: #${orderData.orderCode}</div>
    </div>

    <div class="content">
      <p style="font-size: 14px; line-height: 1.5;">Xin chào <strong>${orderData.customerName}</strong>,</p>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Cảm ơn bạn đã đặt mua thiết bị tại CameraHub. Đơn hàng của bạn đã được tiếp nhận thành công vào hệ thống.
      </p>

      <div class="section-title">Thông tin giao hàng</div>
      <div class="info-box">
        <strong>Người nhận:</strong> ${orderData.customerName} - ${orderData.customerPhone}<br>
        <strong>Email:</strong> ${orderData.customerEmail}<br>
        <strong>Địa chỉ giao:</strong> ${orderData.shippingAddress}, ${orderData.city}<br>
        <strong>Hình thức thanh toán:</strong> ${isVietQR ? 'Chuyển khoản VietQR (Napas 24/7)' : 'Thanh toán khi nhận hàng (COD)'}
      </div>

      <div class="section-title">Chi tiết sản phẩm</div>
      <table class="table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th style="text-align: center;">SL</th>
            <th style="text-align: right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items
            .map(
              (item) => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatVND(item.price * item.quantity)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-label">TỔNG CỘNG THANH TOÁN:</div>
        <div class="total-amount">${formatVND(orderData.totalAmount)}</div>
      </div>

      ${
        isVietQR
          ? `
        <div class="qr-card">
          <h3 style="margin: 0 0 6px; color: #0f172a; font-size: 15px;">MÃ THANH TOÁN VIETQR (VIETCOMBANK)</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Mở App ngân hàng bất kỳ để quét mã chuyển tiền nhanh 24/7</p>
          <img src="${qrImageUrl}" alt="VietQR Vietcombank" />
          <div style="font-size: 12px; color: #1e293b; line-height: 1.6; text-align: left; background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 8px;">
            • <strong>Ngân hàng:</strong> Vietcombank (Ngân hàng TMCP Ngoại Thương Việt Nam)<br>
            • <strong>Số tài khoản:</strong> <span style="color: #ea580c; font-weight: 800; font-size: 14px;">88888888</span><br>
            • <strong>Chủ tài khoản:</strong> <strong>NGUYEN MANH TIEN</strong><br>
            • <strong>Số tiền:</strong> <strong>${formatVND(orderData.totalAmount)}</strong><br>
            • <strong>Nội dung CK:</strong> <span style="color: #ea580c; font-weight: 800;">${orderData.orderCode}</span>
          </div>
        </div>
      `
          : ''
      }

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #64748b;">Mọi thắc mắc xin vui lòng liên hệ hotline hỗ trợ: <strong>1900 6868</strong> (8:30 - 21:30)</p>
      </div>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} CameraHub Store. All rights reserved.<br>
      Website: https://camerahub.vn • Email: support@camerahub.vn
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (this.transporter && this.isConfigured) {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: orderData.customerEmail,
          subject: `📷 [CameraHub] Xác nhận đơn hàng #${orderData.orderCode} - ${formatVND(orderData.totalAmount)}`,
          html: htmlContent,
        });
        console.log(`✉️ [EmailService] Order confirmation email sent to ${orderData.customerEmail}. Message ID: ${info.messageId}`);
        return true;
      }
      return true;
    } catch (err) {
      console.error('❌ [EmailService] Failed to send order email:', err);
      return false;
    }
  }
}

export const emailService = new EmailService();
