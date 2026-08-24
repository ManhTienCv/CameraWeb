export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  tagline: string;
  baseFee: number;
  estimatedTime: string;
  isExpress?: boolean;
  logoColor: string;
  badgeText?: string;
}

export const AVAILABLE_CARRIERS: ShippingCarrier[] = [
  {
    id: 'ghn',
    name: 'Giao Hàng Nhanh (GHN)',
    code: 'GHN',
    tagline: 'Giao toàn quốc 1-2 ngày, mạng lưới bưu cục rộng khắp',
    baseFee: 30000,
    estimatedTime: '1 - 2 ngày',
    logoColor: 'from-orange-500 to-amber-600',
    badgeText: 'Phổ biến nhất',
  },
  {
    id: 'ghtk',
    name: 'Giao Hàng Tiết Kiệm (GHTK)',
    code: 'GHTK',
    tagline: 'Tối ưu chi phí, thích hợp mọi đơn hàng máy ảnh & phụ kiện',
    baseFee: 25000,
    estimatedTime: '2 - 3 ngày',
    logoColor: 'from-emerald-600 to-teal-700',
    badgeText: 'Tiết kiệm nhất',
  },
  {
    id: 'viettel_post',
    name: 'Viettel Post Chuyên Nghiệp',
    code: 'VIETTEL',
    tagline: 'Bảo hiểm trọn gói, an toàn tuyệt đối cho thiết bị đắt tiền',
    baseFee: 28000,
    estimatedTime: '1 - 3 ngày',
    logoColor: 'from-red-600 to-rose-700',
    badgeText: 'An toàn cao cấp',
  },
  {
    id: 'grab_express',
    name: 'GrabExpress Hỏa Tốc',
    code: 'GRAB',
    tagline: 'Giao tức thì trong 2 giờ nội thành (Hà Nội & TP.HCM)',
    baseFee: 45000,
    estimatedTime: 'Trong 2 giờ',
    isExpress: true,
    logoColor: 'from-green-600 to-emerald-700',
    badgeText: 'Hỏa tốc 2H',
  },
];

export const FREE_SHIPPING_THRESHOLD = 1000000; // 1,000,000 VND

export interface ShippingCalculationParams {
  carrierId: string;
  subtotal: number;
  province?: string;
  weightGram?: number;
}

export function calculateShippingFee(params: ShippingCalculationParams): {
  fee: number;
  originalFee: number;
  isFree: boolean;
  carrier: ShippingCarrier;
} {
  const carrier =
    AVAILABLE_CARRIERS.find((c) => c.id === params.carrierId) || AVAILABLE_CARRIERS[0];
  const originalFee = carrier.baseFee;

  // Freeship for orders >= 1M, except GrabExpress Hỏa Tốc
  const isEligibleForFree = params.subtotal >= FREE_SHIPPING_THRESHOLD && !carrier.isExpress;
  const fee = isEligibleForFree ? 0 : originalFee;

  return {
    fee,
    originalFee,
    isFree: isEligibleForFree,
    carrier,
  };
}

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  completed: boolean;
  current?: boolean;
}

export function getMockTrackingTimeline(orderId: string, carrierCode: string): TrackingStep[] {
  return [
    {
      title: 'Đã nhận đơn hàng',
      description: 'Hệ thống CameraHub đã ghi nhận thông tin đặt hàng thành công.',
      time: '10:30 Hôm nay',
      completed: true,
    },
    {
      title: 'Đã xác nhận & Đóng gói',
      description: 'Thiết bị camera đã được kiểm định serial và bọc chống sốc 3 lớp.',
      time: '11:15 Hôm nay',
      completed: true,
    },
    {
      title: `Bàn giao cho ${carrierCode}`,
      description: `Đơn vị vận chuyển ${carrierCode} đã nhận kiện hàng tại kho trung tâm.`,
      time: '14:00 Hôm nay',
      completed: true,
      current: true,
    },
    {
      title: 'Đang vận chuyển đến bạn',
      description: 'Shipper đang trên lộ trình giao hàng đến địa chỉ người nhận.',
      time: 'Dự kiến ngày mai',
      completed: false,
    },
    {
      title: 'Giao hàng thành công',
      description: 'Khách hàng đồng kiểm tra thiết bị và ký nhận hoàn tất.',
      time: 'Dự kiến 1-2 ngày',
      completed: false,
    },
  ];
}
