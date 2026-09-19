import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { emailService } from '../lib/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'camerahub-super-secret-key-2026';


function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '****';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [name, domain] = email.split('@');
  const visible = name.substring(0, Math.min(2, name.length));
  return `${visible}***@${domain}`;
}

function maskName(name: string): string {
  if (!name) return '***';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 1) + '***';
  }
  return parts[0] + ' *** ' + parts[parts.length - 1];
}

export function formatOrder(order: any, isOwner: boolean | unknown = true) {
  const isActualOwner = typeof isOwner === 'boolean' ? isOwner : true;
  return {
    id: order.id,
    order_code: order.orderCode,
    user_id: order.userId,
    session_id: isActualOwner ? order.sessionId : null,
    customer_name: isActualOwner ? order.customerName : maskName(order.customerName),
    customer_email: isActualOwner ? order.customerEmail : maskEmail(order.customerEmail),
    customer_phone: isActualOwner ? order.customerPhone : maskPhone(order.customerPhone),
    shipping_address: isActualOwner ? order.shippingAddress : (order.city ? `***, ${order.city}` : '***'),
    city: order.city,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    shipping_fee: order.shippingFee || 0,
    discount_amount: order.discountAmount || 0,
    shipping_partner: order.shippingPartner || 'GHN Express',
    tracking_code: order.trackingCode,
    ghn_order_code: order.ghnOrderCode,
    expected_delivery_time: order.expectedDeliveryTime,
    cancel_reason: order.cancelReason,
    refund_bank_name: isActualOwner ? order.refundBankName : null,
    refund_account_number: isActualOwner ? order.refundAccountNumber : null,
    refund_account_holder: isActualOwner ? order.refundAccountHolder : null,
    refund_transaction_code: isActualOwner ? order.refundTransactionCode : null,
    refund_note: isActualOwner ? order.refundNote : null,
    refunded_at: order.refundedAt ? order.refundedAt.toISOString() : null,
    status: order.orderStatus,
    order_status: order.orderStatus,
    notes: isActualOwner ? order.notes : null,
    created_at: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    items: (order.items || []).map((i: any) => ({
      product_id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.imageUrl || '',
    })),
  };
}

export const OrderController = {
  async store(req: Request, res: Response) {
    try {
      const {
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        city,
        payment_method,
        notes,
        items,
      } = req.body;

      if (!customer_name || !customer_email || !customer_phone || !shipping_address || !city) {
        return res.status(422).json({ message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(422).json({ message: 'Đơn hàng không có sản phẩm' });
      }

      const sessionId =
        req.header('X-Session-ID') || (req.body.session_id as string) || 'guest_session';
      const orderCode = `CAM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Lấy tất cả sản phẩm trong 1 query (Chống N+1)
      const productIds = items.map((i: any) => i.product_id).filter(Boolean);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = 0;
      const orderItemsToCreate: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        imageUrl: string;
      }> = [];

      const stockUpdates: Array<{ id: string; qty: number }> = [];

      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) continue;

        const qty = Math.max(1, parseInt(item.quantity || 1, 10));

        // Kiểm tra tồn kho
        if (product.stock < qty) {
          return res.status(400).json({ 
            message: `Sản phẩm "${product.name}" không đủ số lượng. Kho chỉ còn ${product.stock} sản phẩm.` 
          });
        }

        const price = product.price;
        totalAmount += price * qty;

        orderItemsToCreate.push({
          productId: product.id,
          name: product.name,
          price,
          quantity: qty,
          imageUrl: product.imageUrl || '',
        });

        stockUpdates.push({ id: product.id, qty });
      }

      if (orderItemsToCreate.length === 0) {
        return res.status(400).json({ message: 'Không có sản phẩm hợp lệ trong đơn hàng' });
      }

      // Xác định userId từ token Bearer hoặc tìm user theo email
      let userId: string | null = null;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
          userId = decoded.userId || null;
        } catch (_) {}
      }
      if (!userId && customer_email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: customer_email.toLowerCase().trim() },
        });
        if (existingUser) {
          userId = existingUser.id;
        }
      }

      const shippingFee = Math.max(0, Number(req.body.shipping_fee) || 0);
      const discountAmount = Math.max(0, Number(req.body.discount_amount) || 0);
      const finalTotalAmount = Math.max(0, totalAmount + shippingFee - discountAmount);

      // Tạo đơn hàng, trừ tồn kho và xóa giỏ hàng trong 1 Transaction nguyên tử
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderCode,
            sessionId,
            userId,
            customerName: customer_name.trim(),
            customerEmail: customer_email.toLowerCase().trim(),
            customerPhone: customer_phone.trim(),
            shippingAddress: shipping_address.trim(),
            city: city.trim(),
            paymentMethod: payment_method || 'cod',
            paymentStatus: 'pending',
            totalAmount: finalTotalAmount,
            shippingFee,
            discountAmount,
            shippingPartner: req.body.shipping_partner || 'GHN Express',
            orderStatus: 'pending',
            notes: notes || '',
            items: {
              create: orderItemsToCreate,
            },
          },
          include: {
            items: true,
          },
        });

        // Trừ số lượng tồn kho từng sản phẩm (Atomic Conditional Update chống Race Condition & Bán âm kho)
        for (const update of stockUpdates) {
          const updateResult = await tx.product.updateMany({
            where: {
              id: update.id,
              stock: { gte: update.qty },
            },
            data: {
              stock: { decrement: update.qty },
            },
          });

          if (updateResult.count === 0) {
            throw new Error(`Sản phẩm trong giỏ hàng đã hết hoặc không đủ tồn kho. Vui lòng kiểm tra lại!`);
          }
        }

        // Clear giỏ hàng theo session
        const cart = await tx.cart.findUnique({ where: { sessionId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }

        return newOrder;
      });


      // Asynchronously send confirmation email in background (non-blocking)
      emailService
        .sendOrderConfirmation({
          orderCode,
          customerName: customer_name,
          customerEmail: customer_email,
          customerPhone: customer_phone,
          shippingAddress: shipping_address,
          city,
          paymentMethod: payment_method || 'cod',
          totalAmount: finalTotalAmount,
          items: orderItemsToCreate,
        })
        .catch((err) => {
          console.error('[EmailService Background Error]:', err);
        });

      return res.status(201).json(formatOrder(order, true));
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error?.message && error.message.includes('không đủ tồn kho')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderCode: id }],
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Xác thực quyền sở hữu đơn hàng (Ownership Check chống IDOR rò rỉ dữ liệu)
      let isOwner = false;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
          if (
            decoded.role === 'admin' ||
            (decoded.userId && decoded.userId === order.userId) ||
            (decoded.email && decoded.email.toLowerCase() === order.customerEmail.toLowerCase())
          ) {
            isOwner = true;
          }
        } catch (_) {}
      }

      const clientSessionId = req.header('X-Session-ID');
      if (!isOwner && clientSessionId && order.sessionId && clientSessionId === order.sessionId) {
        isOwner = true;
      }

      return res.json(formatOrder(order, isOwner));
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async index(_req: Request, res: Response) {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return res.json(orders.map((order) => formatOrder(order, true)));
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(422).json({ message: 'Status is required' });
      }

      const order = await prisma.order.update({
        where: { id },
        data: { orderStatus: status },
      });

      // Send shipping notification email asynchronously
      if (status === 'shipping' || status === 'delivered') {
        emailService
          .sendShippingNotification({
            orderCode: order.orderCode,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            carrierName: 'Giao Hàng Nhanh (GHN Express)',
            trackingCode: `GHN-${order.orderCode}`,
            shippingAddress: order.shippingAddress,
            city: order.city,
            status: status as 'shipping' | 'delivered',
            statusTitle:
              status === 'shipping'
                ? 'Đơn hàng đang trên đường giao tới bạn'
                : 'Giao hàng thành công',
            statusDesc:
              status === 'shipping'
                ? 'Đơn vị vận chuyển GHN Express đã tiếp nhận kiện hàng máy ảnh và đang giao đến địa chỉ của bạn.'
                : 'Đơn hàng máy ảnh của bạn đã được Shipper bàn giao thành công. Cảm ơn bạn đã tin tưởng CameraHub!',
          })
          .catch((err) => console.error('[Shipping Notification Email Error]:', err));
      }

      return res.json({
        message: 'Cập nhật trạng thái đơn hàng thành công!',
        order,
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  async confirmPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingOrder = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderCode: id }],
        },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          paymentStatus: 'completed',
          orderStatus: 'shipping', // Auto-approved & dispatched like Shopee
        },
        include: {
          items: true,
        },
      });

      // Send online auto-approval & shipping email
      emailService
        .sendShippingNotification({
          orderCode: updatedOrder.orderCode,
          customerName: updatedOrder.customerName,
          customerEmail: updatedOrder.customerEmail,
          carrierName: 'Giao Hàng Nhanh (GHN Express)',
          trackingCode: `GHN-${updatedOrder.orderCode}`,
          shippingAddress: updatedOrder.shippingAddress,
          city: updatedOrder.city,
          status: 'shipping',
          statusTitle: 'Đơn hàng trực tuyến đã được duyệt & Đang chuẩn bị giao',
          statusDesc:
            'Hệ thống đã nhận được chuyển khoản thanh toán VietQR thành công. Kiện hàng máy ảnh của bạn đã được chuyển cho bộ phận kho đóng gói và bàn giao Shipper.',
        })
        .catch((err) => console.error('[Shipping Notification Email Error]:', err));

      return res.json({
        message: 'Xác nhận thanh toán thành công! Đơn hàng đã được tự động duyệt.',
        order: formatOrder(updatedOrder),
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  /**
   * Hủy đơn hàng và tự động hoàn trả số lượng tồn kho (Inventory Restock)
   * Quy định: Chỉ được phép hủy khi đơn hàng ở trạng thái 'pending'
   */
  /**
   * Hủy đơn hàng và xử lý luồng tiền tệ:
   * - Nếu đơn COD / Chưa trả tiền: Hủy ngay sang 'cancelled' và hoàn kho.
   * - Nếu đơn Online đã trả tiền (MoMo/VietQR): Hoàn kho ngay và chuyển sang 'refund_pending' (Chờ hoàn tiền).
   */
  async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        reason,
        refundBankName,
        refundAccountNumber,
        refundAccountHolder,
      } = req.body;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderCode: id }],
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng cần hủy' });
      }

      // Kiểm tra quyền hủy đơn (Ownership check / Authorization)
      let isAuthorized = false;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
          if (
            decoded.role === 'admin' ||
            (decoded.userId && decoded.userId === order.userId) ||
            (decoded.email && decoded.email.toLowerCase() === order.customerEmail.toLowerCase())
          ) {
            isAuthorized = true;
          }
        } catch (_) {}
      }

      const clientSessionId = req.header('X-Session-ID');
      if (!isAuthorized && clientSessionId && order.sessionId && clientSessionId === order.sessionId) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
      }

      // 1. Chỉ cho phép hủy khi đơn hàng ở trạng thái 'pending'
      if (order.orderStatus !== 'pending') {
        return res.status(400).json({
          message: `Không thể hủy đơn hàng này vì đơn đang ở trạng thái "${order.orderStatus}". Chỉ được hủy đơn khi đang Chờ xử lý (pending).`,
        });
      }

      const cancelReason = reason || 'Khách hàng yêu cầu hủy đơn';
      const isPaidOnline = order.paymentStatus === 'completed';

      // Nếu đơn online đã thanh toán, bắt buộc phải có thông tin tài khoản hoàn tiền
      if (isPaidOnline) {
        if (!refundBankName || !refundAccountNumber || !refundAccountHolder) {
          return res.status(400).json({
            message:
              'Đơn hàng này đã thanh toán trực tuyến. Vui lòng cung cấp đầy đủ Tên Ngân hàng / Ví, Số tài khoản và Tên chủ tài khoản để Shop tiến hành hoàn tiền.',
          });
        }
      }

      // 2. Chạy Transaction hoàn kho và cập nhật đơn
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Tự động hoàn lại số lượng tồn kho cho từng sản phẩm
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        if (isPaidOnline) {
          // Đơn Online -> Chuyển sang refund_pending
          return await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'refund_pending',
              paymentStatus: 'refund_pending',
              cancelReason,
              refundBankName: String(refundBankName).trim(),
              refundAccountNumber: String(refundAccountNumber).trim(),
              refundAccountHolder: String(refundAccountHolder).trim().toUpperCase(),
              notes: `${order.notes || ''} [Yêu cầu hoàn tiền: ${refundBankName} - ${refundAccountNumber} - ${refundAccountHolder}]`.trim(),
            },
            include: {
              items: true,
            },
          });
        } else {
          // Đơn COD -> Chuyển thẳng sang cancelled
          return await tx.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'cancelled',
              cancelReason,
              notes: `${order.notes || ''} [Hủy đơn: ${cancelReason}]`.trim(),
            },
            include: {
              items: true,
            },
          });
        }
      });

      if (isPaidOnline) {
        console.log(`🔄 [Refund Pending] Đơn ${order.orderCode} đã chuyển sang chờ hoàn tiền và hoàn kho.`);
        // Gửi email thông báo tiếp nhận hoàn tiền cho khách
        if (order.customerEmail) {
          emailService
            .sendRefundRequestNotification({
              orderCode: order.orderCode,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              totalAmount: Number(order.totalAmount),
              refundBankName: String(refundBankName).trim(),
              refundAccountNumber: String(refundAccountNumber).trim(),
              refundAccountHolder: String(refundAccountHolder).trim().toUpperCase(),
              reason: cancelReason,
            })
            .catch((err) => console.error('[Refund Request Email Error]:', err));
        }

        return res.json({
          message: 'Yêu cầu hủy đơn và hoàn tiền đã được ghi nhận. Quản trị viên CameraHub sẽ chuyển khoản hoàn tiền cho bạn trong vòng 24h - 48h!',
          order: formatOrder(updatedOrder),
        });
      } else {
        console.log(`✅ [Restock Success] Đã hủy đơn COD ${order.orderCode} và hoàn kho ${order.items.length} sản phẩm.`);
        return res.json({
          message: 'Đã hủy đơn hàng và hoàn lại số lượng tồn kho thành công!',
          order: formatOrder(updatedOrder),
        });
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  },

  /**
   * Admin xác nhận đã chuyển khoản hoàn tiền thành công cho khách
   * POST /api/v1/admin/orders/:id/confirm-refund
   */
  async confirmRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { refundTransactionCode, refundNote } = req.body;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderCode: id }],
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng cần hoàn tiền' });
      }

      if (order.orderStatus !== 'refund_pending' && order.paymentStatus !== 'refund_pending') {
        return res.status(400).json({
          message: `Đơn hàng này không ở trạng thái chờ hoàn tiền (trạng thái hiện tại: ${order.orderStatus}).`,
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'cancelled',
          paymentStatus: 'refunded',
          refundTransactionCode: refundTransactionCode?.trim() || null,
          refundNote: refundNote?.trim() || 'Đã chuyển khoản hoàn tiền thành công',
          refundedAt: new Date(),
          notes: `${order.notes || ''} [Đã hoàn tiền: ${refundTransactionCode || 'Thành công'}]`.trim(),
        },
        include: {
          items: true,
        },
      });

      // Bắn email thông báo hoàn tiền thành công cho khách
      if (order.customerEmail) {
        emailService
          .sendRefundCompletedNotification({
            orderCode: order.orderCode,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            totalAmount: Number(order.totalAmount),
            refundBankName: order.refundBankName || 'Tài khoản thanh toán',
            refundAccountNumber: order.refundAccountNumber || 'Theo yêu cầu',
            refundAccountHolder: order.refundAccountHolder || order.customerName,
            refundTransactionCode: refundTransactionCode?.trim() || undefined,
            refundNote: refundNote?.trim() || undefined,
          })
          .catch((err) => console.error('[Refund Completed Email Error]:', err));
      }

      console.log(`✅ [Refund Completed] Đơn ${order.orderCode} đã được Admin xác nhận hoàn tiền thành công.`);

      return res.json({
        message: 'Xác nhận hoàn tiền thành công! Đơn hàng đã chuyển sang Đã hủy và gửi email biên lai cho khách.',
        order: formatOrder(updatedOrder),
      });
    } catch (error: any) {
      console.error('Error confirming refund:', error);
      return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  },
};
