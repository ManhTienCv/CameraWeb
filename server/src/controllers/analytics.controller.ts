import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const AnalyticsController = {
  // 1. Overview KPIs
  getOverviewStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const current30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const prev30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Fetch all orders
      const allOrders = await prisma.order.findMany({
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
      });

      // Filter valid orders (completed or active shipping, excluding cancelled)
      const validOrders = allOrders.filter(
        (o) => o.orderStatus !== 'cancelled' && (o.paymentStatus === 'completed' || o.orderStatus === 'completed')
      );

      // Total revenue from all-time valid orders
      const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      // Revenue in last 30 days vs 30 days prior for growth rate
      const recent30Orders = validOrders.filter((o) => o.createdAt >= current30Start);
      const prev30Orders = validOrders.filter(
        (o) => o.createdAt >= prev30Start && o.createdAt < current30Start
      );

      const recent30Revenue = recent30Orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const prev30Revenue = prev30Orders.reduce((sum, o) => sum + o.totalAmount, 0);

      const revenueGrowth = prev30Revenue > 0
        ? Number((((recent30Revenue - prev30Revenue) / prev30Revenue) * 100).toFixed(1))
        : recent30Revenue > 0 ? 100 : 0;

      // Order counts
      const totalOrdersCount = allOrders.filter((o) => o.orderStatus !== 'cancelled').length;
      const completedOrdersCount = allOrders.filter((o) => o.orderStatus === 'completed').length;
      const pendingOrdersCount = allOrders.filter((o) => o.orderStatus === 'pending').length;
      const shippingOrdersCount = allOrders.filter((o) => o.orderStatus === 'shipping').length;
      const cancelledOrdersCount = allOrders.filter((o) => o.orderStatus === 'cancelled').length;

      const completionRate = allOrders.length > 0
        ? Number(((completedOrdersCount / allOrders.length) * 100).toFixed(1))
        : 0;

      // Order growth
      const recentOrdersCount = recent30Orders.length;
      const prevOrdersCount = prev30Orders.length;
      const orderGrowth = prevOrdersCount > 0
        ? Number((((recentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1))
        : recentOrdersCount > 0 ? 100 : 0;

      // Customer count
      const totalCustomers = await prisma.user.count({
        where: { role: 'customer' },
      });

      // Average Order Value (AOV)
      const aov = completedOrdersCount > 0
        ? Math.round(totalRevenue / completedOrdersCount)
        : 0;

      // Total products
      const totalProducts = await prisma.product.count({
        where: { status: 'active' },
      });

      res.json({
        totalRevenue,
        recent30Revenue,
        revenueGrowth,
        totalOrders: totalOrdersCount,
        recentOrdersCount,
        orderGrowth,
        completedOrdersCount,
        pendingOrdersCount,
        shippingOrdersCount,
        cancelledOrdersCount,
        completionRate,
        totalCustomers,
        averageOrderValue: aov,
        totalProducts,
      });
    } catch (error) {
      console.error('Analytics getOverviewStats error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu tổng quan thống kê.' });
    }
  },

  // 2. 30-Day Daily Revenue Trend (Zero-filled)
  getRevenueTrend: async (req: Request, res: Response): Promise<void> => {
    try {
      const days = 30;
      const now = new Date();
      const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          orderStatus: { not: 'cancelled' },
          OR: [
            { paymentStatus: 'completed' },
            { orderStatus: 'completed' },
          ],
        },
        select: {
          totalAmount: true,
          createdAt: true,
          orderStatus: true,
        },
      });

      // Build daily map with zero filling
      const trendMap: Record<string, { revenue: number; orderCount: number; date: string; label: string }> = {};

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        const label = `${dd}/${mm}`;

        trendMap[key] = {
          date: key,
          label,
          revenue: 0,
          orderCount: 0,
        };
      }

      // Aggregate orders into daily buckets
      for (const order of orders) {
        const d = new Date(order.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        if (trendMap[key]) {
          trendMap[key].revenue += order.totalAmount;
          trendMap[key].orderCount += 1;
        }
      }

      const data = Object.values(trendMap);

      res.json({ data });
    } catch (error) {
      console.error('Analytics getRevenueTrend error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy xu hướng doanh thu.' });
    }
  },

  // 3. 12-Month Revenue Comparison
  getMonthlyRevenue: async (req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      // Generate 12 month keys
      const monthsList: { key: string; label: string; start: Date; end: Date }[] = [];
      for (let i = 11; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const nextMonthDate = new Date(yyyy, targetDate.getMonth() + 1, 1);

        monthsList.push({
          key: `${yyyy}-${mm}`,
          label: `T${targetDate.getMonth() + 1}/${String(yyyy).slice(2)}`,
          start: targetDate,
          end: nextMonthDate,
        });
      }

      const earliestDate = monthsList[0].start;

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: earliestDate },
          orderStatus: { not: 'cancelled' },
          OR: [
            { paymentStatus: 'completed' },
            { orderStatus: 'completed' },
          ],
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      });

      const data = monthsList.map((m) => {
        const monthOrders = orders.filter(
          (o) => o.createdAt >= m.start && o.createdAt < m.end
        );
        const revenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        return {
          month: m.key,
          label: m.label,
          revenue,
          orderCount: monthOrders.length,
        };
      });

      res.json({ data });
    } catch (error) {
      console.error('Analytics getMonthlyRevenue error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy doanh thu hàng tháng.' });
    }
  },

  // 4. Category Revenue Distribution
  getCategoryDistribution: async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: {
            select: {
              id: true,
            },
          },
        },
      });

      // Get order items from valid orders
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            orderStatus: { not: 'cancelled' },
            OR: [
              { paymentStatus: 'completed' },
              { orderStatus: 'completed' },
            ],
          },
        },
        select: {
          productId: true,
          price: true,
          quantity: true,
        },
      });

      // Map product to category
      const productCategoryMap = new Map<string, string>();
      for (const cat of categories) {
        for (const prod of cat.products) {
          productCategoryMap.set(prod.id, cat.id);
        }
      }

      // Aggregate revenue per category
      const catRevenueMap: Record<string, { name: string; revenue: number; itemCount: number }> = {};
      for (const cat of categories) {
        catRevenueMap[cat.id] = {
          name: cat.name,
          revenue: 0,
          itemCount: 0,
        };
      }

      let grandTotal = 0;
      for (const item of orderItems) {
        const catId = productCategoryMap.get(item.productId);
        if (catId && catRevenueMap[catId]) {
          const itemRevenue = item.price * item.quantity;
          catRevenueMap[catId].revenue += itemRevenue;
          catRevenueMap[catId].itemCount += item.quantity;
          grandTotal += itemRevenue;
        }
      }

      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];

      const data = Object.entries(catRevenueMap)
        .map(([id, cat], idx) => ({
          id,
          name: cat.name,
          revenue: cat.revenue,
          itemCount: cat.itemCount,
          percentage: grandTotal > 0 ? Number(((cat.revenue / grandTotal) * 100).toFixed(1)) : 0,
          color: colors[idx % colors.length],
        }))
        .sort((a, b) => b.revenue - a.revenue);

      res.json({ data, grandTotal });
    } catch (error) {
      console.error('Analytics getCategoryDistribution error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy phân bổ danh mục.' });
    }
  },

  // 5. Payment Method Breakdown
  getPaymentMethodStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          orderStatus: { not: 'cancelled' },
        },
        select: {
          paymentMethod: true,
          totalAmount: true,
        },
      });

      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      const methodNames: Record<string, string> = {
        momo: 'Ví điện tử MoMo',
        vietqr: 'Chuyển khoản VietQR',
        cod: 'Thanh toán COD',
      };

      const methodColors: Record<string, string> = {
        momo: '#a50064',
        vietqr: '#2563eb',
        cod: '#f59e0b',
      };

      const map: Record<string, { count: number; totalAmount: number }> = {
        momo: { count: 0, totalAmount: 0 },
        vietqr: { count: 0, totalAmount: 0 },
        cod: { count: 0, totalAmount: 0 },
      };

      for (const o of orders) {
        const method = o.paymentMethod.toLowerCase();
        if (map[method]) {
          map[method].count += 1;
          map[method].totalAmount += o.totalAmount;
        }
      }

      const data = Object.entries(map).map(([method, val]) => ({
        method,
        label: methodNames[method] || method,
        count: val.count,
        totalAmount: val.totalAmount,
        percentage: totalOrders > 0 ? Number(((val.count / totalOrders) * 100).toFixed(1)) : 0,
        amountPercentage: totalAmount > 0 ? Number(((val.totalAmount / totalAmount) * 100).toFixed(1)) : 0,
        color: methodColors[method] || '#64748b',
      }));

      res.json({ data, totalOrders, totalAmount });
    } catch (error) {
      console.error('Analytics getPaymentMethodStats error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê phương thức thanh toán.' });
    }
  },

  // 6. Order Status Breakdown
  getOrderStatusStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
        select: {
          orderStatus: true,
          totalAmount: true,
        },
      });

      const statusLabels: Record<string, string> = {
        pending: 'Chờ xử lý',
        shipping: 'Đang giao hàng',
        completed: 'Giao thành công',
        cancelled: 'Đã hủy',
      };

      const statusColors: Record<string, string> = {
        completed: '#10b981',
        shipping: '#3b82f6',
        pending: '#f59e0b',
        cancelled: '#ef4444',
      };

      const map: Record<string, { count: number; totalAmount: number }> = {
        completed: { count: 0, totalAmount: 0 },
        shipping: { count: 0, totalAmount: 0 },
        pending: { count: 0, totalAmount: 0 },
        cancelled: { count: 0, totalAmount: 0 },
      };

      for (const o of orders) {
        const s = o.orderStatus.toLowerCase();
        if (map[s]) {
          map[s].count += 1;
          map[s].totalAmount += o.totalAmount;
        }
      }

      const total = orders.length;
      const data = Object.entries(map).map(([status, val]) => ({
        status,
        label: statusLabels[status] || status,
        count: val.count,
        totalAmount: val.totalAmount,
        percentage: total > 0 ? Number(((val.count / total) * 100).toFixed(1)) : 0,
        color: statusColors[status] || '#94a3b8',
      }));

      res.json({ data, total });
    } catch (error) {
      console.error('Analytics getOrderStatusStats error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy thống kê trạng thái đơn hàng.' });
    }
  },

  // 7. Top Selling Products
  getTopProducts: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            orderStatus: { not: 'cancelled' },
            OR: [
              { paymentStatus: 'completed' },
              { orderStatus: 'completed' },
            ],
          },
        },
        include: {
          product: {
            include: {
              category: true,
              brandModel: true,
            },
          },
        },
      });

      const productMap: Record<
        string,
        {
          id: string;
          name: string;
          price: number;
          imageUrl: string | null;
          categoryName: string;
          brandName: string;
          totalSold: number;
          totalRevenue: number;
        }
      > = {};

      for (const item of orderItems) {
        const pId = item.productId;
        if (!productMap[pId]) {
          productMap[pId] = {
            id: pId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl || item.product.imageUrl || null,
            categoryName: item.product.category?.name || 'Khác',
            brandName: item.product.brandModel?.name || 'CameraHub',
            totalSold: 0,
            totalRevenue: 0,
          };
        }

        productMap[pId].totalSold += item.quantity;
        productMap[pId].totalRevenue += item.price * item.quantity;
      }

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      res.json({ data: topProducts });
    } catch (error) {
      console.error('Analytics getTopProducts error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách sản phẩm bán chạy.' });
    }
  },
};
