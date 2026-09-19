import { Request, Response } from 'express';
import { ghnService } from '../services/ghn.service';
import { prisma } from '../lib/prisma';
import { emailService } from '../lib/email.service';

export const ShippingController = {
  /**
   * Lấy danh sách Tỉnh/Thành từ GHN
   */
  async getProvinces(_req: Request, res: Response) {
    try {
      const provinces = await ghnService.getProvinces();
      return res.json({ success: true, data: provinces });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Lấy danh sách Quận/Huyện từ GHN
   */
  async getDistricts(req: Request, res: Response) {
    try {
      const provinceId = parseInt(req.params.provinceId, 10);
      if (isNaN(provinceId)) {
        return res.status(400).json({ success: false, message: 'provinceId không hợp lệ' });
      }
      const districts = await ghnService.getDistricts(provinceId);
      return res.json({ success: true, data: districts });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Lấy danh sách Phường/Xã từ GHN
   */
  async getWards(req: Request, res: Response) {
    try {
      const districtId = parseInt(req.params.districtId, 10);
      if (isNaN(districtId)) {
        return res.status(400).json({ success: false, message: 'districtId không hợp lệ' });
      }
      const wards = await ghnService.getWards(districtId);
      return res.json({ success: true, data: wards });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Tính toán phí giao hàng từ GHN
   */
  async calculateFee(req: Request, res: Response) {
    try {
      const { toDistrictId, toWardCode, weightGram, insuranceValue } = req.body;
      if (!toDistrictId || !toWardCode) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu toDistrictId hoặc toWardCode',
        });
      }

      const feeResult = await ghnService.calculateFee({
        toDistrictId: Number(toDistrictId),
        toWardCode: String(toWardCode),
        weightGram: weightGram ? Number(weightGram) : 1200,
        insuranceValue: insuranceValue ? Number(insuranceValue) : 0,
      });

      return res.json({ success: true, data: feeResult });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Admin tạo vận đơn GHN Express cho một đơn hàng
   */
  async createGhnOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      // Default to district 1485 (Hà Nội / Cầu Giấy) or provided
      const toDistrictId = req.body.toDistrictId || 1485;
      const toWardCode = req.body.toWardCode || '1A0607';

      const ghnRes = await ghnService.createShippingOrder({
        toName: order.customerName,
        toPhone: order.customerPhone,
        toAddress: order.shippingAddress,
        toDistrictId: Number(toDistrictId),
        toWardCode: String(toWardCode),
        codAmount: (order.paymentStatus === 'completed' || order.paymentStatus === 'paid') ? 0 : Number(order.totalAmount),
        items: order.items.map((i) => ({

          name: i.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        note: `Đơn CameraHub: ${order.orderCode} - Cho khách kiểm tra máy`,
      });

      if (ghnRes.success && ghnRes.order_code) {
        // Cập nhật trạng thái đơn hàng sang shipping và lưu mã vận đơn GHN chính thức
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'shipping',
            trackingCode: ghnRes.order_code,
            ghnOrderCode: ghnRes.order_code,
            shippingPartner: 'GHN Express',
            expectedDeliveryTime: ghnRes.expected_delivery_time || '1 - 2 ngày tới',
            notes: `${order.notes || ''} [Mã vận đơn GHN: ${ghnRes.order_code}]`.trim(),
          },
          include: { items: true },
        });

        // Gửi email thông báo giao hàng kèm mã tracking GHN
        if (order.customerEmail) {
          try {
            await emailService.sendShippingNotification({
              customerEmail: order.customerEmail,
              customerName: order.customerName,
              orderCode: order.orderCode,
              carrierName: 'Giao Hàng Nhanh (GHN Express)',
              trackingCode: ghnRes.order_code,
              shippingAddress: order.shippingAddress,
              city: order.city || 'Việt Nam',
              status: 'shipping',
              statusTitle: 'Đơn hàng đang trên đường giao (GHN Express)',
              statusDesc: `Kiện hàng máy ảnh #${order.orderCode} đã được bàn giao cho đơn vị GHN Express và đang trên lộ trình vận chuyển tới địa chỉ của bạn.`,
            });
          } catch (mailErr) {
            console.warn('Gửi email thông báo GHN thất bại:', mailErr);
          }
        }

        return res.json({
          success: true,
          tracking_code: ghnRes.order_code,
          expected_delivery_time: ghnRes.expected_delivery_time,
          total_fee: ghnRes.total_fee,
          order: updatedOrder,
        });
      }

      return res.status(400).json({
        success: false,
        message: ghnRes.message || 'Không thể tạo vận đơn trên GHN Express',
      });
    } catch (error: any) {
      console.error('Lỗi tạo vận đơn GHN:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
