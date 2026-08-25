import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { emailService } from '../lib/email.service';

function formatOrder(order: any) {
  return {
    id: order.id,
    order_code: order.orderCode,
    session_id: order.sessionId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    shipping_address: order.shippingAddress,
    city: order.city,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    status: order.orderStatus,
    notes: order.notes,
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

      const order = await prisma.order.create({
        data: {
          orderCode,
          sessionId,
          customerName: customer_name,
          customerEmail: customer_email,
          customerPhone: customer_phone,
          shippingAddress: shipping_address,
          city,
          paymentMethod: payment_method || 'cod',
          paymentStatus: 'pending',
          totalAmount,
          shippingFee: 0,
          discountAmount: 0,
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

      // Clear cart for this session
      const cart = await prisma.cart.findUnique({ where: { sessionId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Trừ số lượng tồn kho
      for (const update of stockUpdates) {
        await prisma.product.update({
          where: { id: update.id },
          data: { stock: { decrement: update.qty } },
        });
      }

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
          totalAmount,
          items: orderItemsToCreate,
        })
        .catch((err) => {
          console.error('[EmailService Background Error]:', err);
        });

      return res.status(201).json(formatOrder(order));
    } catch (error) {
      console.error('Error creating order:', error);
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

      return res.json(formatOrder(order));
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

      return res.json(orders.map(formatOrder));
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
};
