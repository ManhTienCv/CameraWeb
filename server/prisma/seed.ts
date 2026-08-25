import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu CameraHub (Seeding database)...');

  // Clean existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.productFeature.deleteMany({});
  await prisma.productSpecification.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Categories
  const categoriesData = [
    {
      name: 'Máy ảnh Mirrorless',
      slug: 'may-anh-mirrorless',
      description: 'Máy ảnh không gương lật nhỏ gọn, hiệu năng đỉnh cao với cảm biến Full-frame và APS-C tân tiến.',
      icon: 'Camera',
      displayOrder: 1,
    },
    {
      name: 'Máy ảnh DSLR',
      slug: 'may-anh-dslr',
      description: 'Dòng máy ảnh phản xạ ống kính đơn kỹ thuật số truyền thống bền bỉ và pin thời lượng cao.',
      icon: 'Camera',
      displayOrder: 2,
    },
    {
      name: 'Ống kính (Lens)',
      slug: 'ong-kinh-lens',
      description: 'Ống kính góc rộng, tele, portrait khẩu lớn chính hãng cho Sony, Canon, Nikon, Fujifilm.',
      icon: 'Disc',
      displayOrder: 3,
    },
    {
      name: 'Máy ảnh Compact & Vlog',
      slug: 'may-anh-compact-vlog',
      description: 'Máy ảnh bỏ túi nhỏ gọn, cảm biến 1 inch & APS-C chuyên dụng cho quay Vlog, du lịch và chụp ảnh đường phố.',
      icon: 'Camera',
      displayOrder: 4,
    },
    {
      name: 'Phụ kiện Camera',
      slug: 'phu-kien-camera',
      description: 'Chân máy Tripod, Thẻ nhớ tốc độ cao SanDisk, Túi chống sốc Peak Design, Pin sạc.',
      icon: 'Briefcase',
      displayOrder: 5,
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }

  // 2. Brands
  const brandsData = [
    { name: 'Sony', slug: 'sony', description: 'Thương hiệu máy ảnh mirrorless hàng đầu thế giới với hệ thống lấy nét AF nhận diện AI.' },
    { name: 'Canon', slug: 'canon', description: 'Hệ sinh thái máy ảnh EOS R & Ống kính RF cao cấp với màu sắc chân thực.' },
    { name: 'Nikon', slug: 'nikon', description: 'Hệ thống Nikon Z-mount sắc nét vượt trội cho nhiếp ảnh gia phong cảnh và thể thao.' },
    { name: 'Fujifilm', slug: 'fujifilm', description: 'Máy ảnh phong cách Retro tích hợp bộ giả lập màu phim độc quyền huyền thoại.' },
    { name: 'Ricoh', slug: 'ricoh', description: 'Huyền thoại máy ảnh snapshot đường phố Ricoh GR cảm biến APS-C bỏ túi sắc nét.' },
    { name: 'Sigma', slug: 'sigma', description: 'Dòng ống kính Sigma Art sắc nét đỉnh cao với khẩu độ siêu lớn f/1.4.' },
    { name: 'Tamron', slug: 'tamron', description: 'Ống kính zoom nhỏ gọn, sắc nét vượt trội cho máy ảnh Sony & Nikon.' },
    { name: 'GoPro', slug: 'gopro', description: 'Camera hành động chống nước và chống rung HyperSmooth bá chủ.' },
    { name: 'Panasonic', slug: 'panasonic', description: 'Dòng máy ảnh quay phim chuyên nghiệp Lumix S & GH Series.' },
    { name: 'Leica', slug: 'leica', description: 'Thương hiệu máy ảnh xa xỉ đẳng cấp từ Đức.' },
    { name: 'SanDisk', slug: 'sandisk', description: 'Thẻ nhớ tốc độ cao uy tín cho quay video 4K & 8K RAW.' },
    { name: 'Peak Design', slug: 'peak-design', description: 'Túi máy ảnh và dây đeo thao tác nhanh cao cấp từ Mỹ.' },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of brandsData) {
    const created = await prisma.brand.create({ data: b });
    brandMap[b.slug] = created.id;
  }

  // 3. Products
  const products = [
    {
      name: 'Sony Alpha A7 Mark IV (Body)',
      slug: 'sony-alpha-a7-mark-iv-body',
      brand: 'Sony',
      brandSlug: 'sony',
      categorySlug: 'may-anh-mirrorless',
      sku: 'SONY-A7M4',
      description: 'Sony Alpha A7 IV là chiếc máy ảnh Full-frame hybrid hoàn hảo kết hợp khả năng chụp ảnh 33MP sắc nét và quay video 4K 60p 10-bit 4:2:2 đỉnh cao. Hỗ trợ hệ thống lấy nét tự động AI Real-time Eye AF mới nhất.',
      price: 54990000,
      originalPrice: 59990000,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      stock: 15,
      rating: 4.9,
      reviewCount: 128,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Full-frame Exmor R CMOS 33MP',
        'Bộ xử lý': 'BIONZ XR tiên tiến',
        'Quay video': '4K 60p 10-bit 4:2:2, S-Cinetone',
        'Chống rung': 'SteadyShot 5 trục 5.5 stops',
        'Lấy nét': '759 điểm AF, Eye AF nhận diện Người/Động vật/Chim',
      },
      features: [
        'Cảm biến Full-frame chiếu sáng sau 33.0 Megapixel',
        'Bộ xử lý BIONZ XR nhanh gấp 8 lần thế hệ trước',
        'Chế độ xem trực tiếp không chớp nháy (No Blackout)',
      ],
    },
    {
      name: 'Canon EOS R6 Mark II (Body)',
      slug: 'canon-eos-r6-mark-ii-body',
      brand: 'Canon',
      brandSlug: 'canon',
      categorySlug: 'may-anh-mirrorless',
      sku: 'CANON-R6M2',
      description: 'Canon EOS R6 II trang bị cảm biến 24.2MP cùng khả năng chụp liên tiếp tốc độ đỉnh cao 40fps màn trập điện tử. Quay video 4K 60p không bị crop toàn cảm biến với màu sắc Canon Log 3 đỉnh cao.',
      price: 58900000,
      originalPrice: 63500000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 0,
      rating: 4.8,
      reviewCount: 95,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Full-frame CMOS 24.2 MP',
        'Tốc độ chụp': '40 fps màn trập điện tử',
        'Quay video': '4K 60p không crop 6K oversampling',
        'Chống rung': 'IBIS kết hợp Lens chống rung tới 8 stops',
      },
      features: [
        'Lấy nét Dual Pixel CMOS AF II bắt nét theo dõi phương tiện',
        'Tự động bù trừ quang học Focus Breathing Compensation',
      ],
    },
    {
      name: 'Fujifilm X-T5 (Body) - Bạc',
      slug: 'fujifilm-x-t5-body-silver',
      brand: 'Fujifilm',
      brandSlug: 'fujifilm',
      categorySlug: 'may-anh-mirrorless',
      sku: 'FUJI-XT5-SILVER',
      description: 'Fujifilm X-T5 mang thiết kế quay số cổ điển nguyên bản với cảm biến APS-C X-Trans CMOS 5 HR độ phân giải siêu cao 40.2 MP. Tích hợp 19 chế độ giả lập màu phim độc quyền của Fujifilm.',
      price: 43900000,
      originalPrice: 46900000,
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      stock: 8,
      rating: 5.0,
      reviewCount: 84,
      isFeatured: true,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'APS-C X-Trans CMOS 5 HR 40.2 MP',
        'Bộ xử lý': 'X-Processor 5',
        'Chống rung': 'IBIS trong thân máy 7.0 stops',
        'Giả lập phim': '19 chế độ (Classic Chrome, Nostalgic Neg...)',
      },
      features: [
        'Độ phân giải 40.2MP cao nhất dòng máy APS-C',
        'Bánh xe chỉnh ISO, Tốc độ shutter quay cơ học trực quan',
      ],
    },
    {
      name: 'Nikon Z6 III (Body)',
      slug: 'nikon-z6-iii-body',
      brand: 'Nikon',
      brandSlug: 'nikon',
      categorySlug: 'may-anh-mirrorless',
      sku: 'NIKON-Z6M3',
      description: 'Nikon Z6 III ứng dụng cảm biến Partially-stacked Full-frame đầu tiên thế giới giúp tốc độ đọc dữ liệu cực nhanh. Quay phim 6K N-RAW và EVF siêu sáng 4000 nits.',
      price: 62500000,
      originalPrice: 66000000,
      imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      stock: 5,
      rating: 4.9,
      reviewCount: 42,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Partially-stacked Full-frame CMOS 24.5 MP',
        'Bộ xử lý': 'EXPEED 7',
        'Quay video': '6K 60p N-RAW internal, 4K 120p',
      },
      features: [
        'Cảm biến bán xếp chồng (Partially stacked) cho tốc độ vượt trội',
        'Kính ngắm EVF hiển thị màu dải DCI-P3 chân thực',
      ],
    },
    {
      name: 'Sony Alpha A7R Mark V (Body)',
      slug: 'sony-alpha-a7r-v-body',
      brand: 'Sony',
      brandSlug: 'sony',
      categorySlug: 'may-anh-mirrorless',
      sku: 'SONY-A7R5',
      description: 'Quái vật độ phân giải 61.0 Megapixel kết hợp chíp vi xử lý AI AF chuyên biệt. Khả năng quay video 8K 24p và chống rung cảm biến 8 stops vô địch.',
      price: 84900000,
      originalPrice: 89900000,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      stock: 6,
      rating: 5.0,
      reviewCount: 64,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Full-frame BSI Exmor R 61.0 MP',
        'Quay video': '8K 24p, 4K 60p 10-bit 4:2:2',
        'Chip AI': 'AI Processing Unit nhận diện hình thể người & động vật',
      },
      features: [
        'Màn hình 4 trục lật đa góc linh hoạt nhất thế giới',
        'Chụp hình chụp ghép Pixel Shift 240 Megapixel',
      ],
    },
    {
      name: 'Canon EOS R5 Mark II (Body)',
      slug: 'canon-eos-r5-mark-ii-body',
      brand: 'Canon',
      brandSlug: 'canon',
      categorySlug: 'may-anh-mirrorless',
      sku: 'CANON-R5M2',
      description: 'Siêu phẩm Full-frame Back-illuminated Stacked CMOS 45MP, quay phim 8K 60p RAW nội bộ và tính năng Eye Control AF điều khiển điểm lấy nét bằng mắt nhìn.',
      price: 102000000,
      originalPrice: 108000000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 4,
      rating: 5.0,
      reviewCount: 31,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Stacked Full-frame CMOS 45.0 MP',
        'Tốc độ chụp': '30 fps màn trập điện tử',
        'Quay video': '8K 60p RAW, 4K 120p S-RAW',
      },
      features: [
        'Công nghệ Eye Control AF điều chỉnh góc nhìn mắt người dùng',
        'Tính năng Upscaling 179MP bằng Deep Learning ngay trên máy',
      ],
    },
    {
      name: 'Fujifilm X100VI (Bạc / Đen)',
      slug: 'fujifilm-x100vi-silver',
      brand: 'Fujifilm',
      brandSlug: 'fujifilm',
      categorySlug: 'may-anh-mirrorless',
      sku: 'FUJI-X100VI',
      description: 'Chiếc máy ảnh Compact huyền thoại cháy hàng toàn cầu với cảm biến 40.2MP, ống kính cố định 23mm f/2.0 II và chống rung IBIS 6 stops.',
      price: 47900000,
      originalPrice: 52000000,
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      stock: 3,
      rating: 5.0,
      reviewCount: 150,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'APS-C X-Trans CMOS 5 HR 40.2 MP',
        'Ống kính': 'Fujinon 23mm f/2.0 II (tương đương 35mm)',
        'Giả lập phim': '20 chế độ giả lập bao gồm Reala Ace',
      },
      features: [
        'Kính ngắm Hybrid OVF / EVF độc đáo chuyển đổi 1 chạm',
        'Kính lọc ND 4-stop tích hợp sẵn trong lens',
      ],
    },
    {
      name: 'Panasonic Lumix S5 II (Body)',
      slug: 'panasonic-lumix-s5-ii-body',
      brand: 'Panasonic',
      brandSlug: 'panasonic',
      categorySlug: 'may-anh-mirrorless',
      sku: 'PANA-S5M2',
      description: 'Máy ảnh Full-frame đầu tiên của Panasonic sở hữu công nghệ lấy nét Phase Hybrid AF cực nhanh và quạt tản nhiệt quay video 4K/6K không giới hạn thời gian.',
      price: 42900000,
      originalPrice: 46500000,
      imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      stock: 7,
      rating: 4.8,
      reviewCount: 38,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Full-frame CMOS 24.2 MP',
        'Quay video': '6K 30p 10-bit, 4K 60p 10-bit V-Log',
        'Lấy nét': '779 điểm Phase Detection AF',
      },
      features: [
        'Tích hợp quạt tản nhiệt giúp quay video liên tục không quá nhiệt',
        'Công nghệ chống rung Active I.S. vô địch khi đi bộ',
      ],
    },
    {
      name: 'Leica Q3 (Body) - Đen',
      slug: 'leica-q3-black',
      brand: 'Leica',
      brandSlug: 'leica',
      categorySlug: 'may-anh-mirrorless',
      sku: 'LEICA-Q3',
      description: 'Đỉnh cao máy ảnh xa xỉ từ Đức với cảm biến Full-frame 60MP BSI, ống kính đỉnh cao Leica Summilux 28mm f/1.7 ASPH và sạc không dây Qi.',
      price: 165000000,
      originalPrice: 175000000,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      stock: 2,
      rating: 5.0,
      reviewCount: 18,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'Full-frame BSI CMOS 60 MP',
        'Ống kính': 'Summilux 28mm f/1.7 ASPH',
        'Quay video': '8K 30p 10-bit, C4K 60p',
      },
      features: [
        'Vỏ máy làm bằng hợp kim Magie gia công thủ công tại Wetzlar, Đức',
        'Khả năng Zoom kỹ thuật số 35mm, 50mm, 75mm và 90mm',
      ],
    },
    {
      name: 'Canon EOS 90D Kit EF-S 18-135mm USM',
      slug: 'canon-eos-90d-kit-18-135mm',
      brand: 'Canon',
      brandSlug: 'canon',
      categorySlug: 'may-anh-dslr',
      sku: 'CANON-90D-KIT',
      description: 'Chiếc DSLR bán chuyên mạnh mẽ nhất với cảm biến APS-C 32.5 MP, chụp liên tiếp 10fps và kính ngắm quang học 100% tầm nhìn.',
      price: 33500000,
      originalPrice: 36500000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 9,
      rating: 4.7,
      reviewCount: 54,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'APS-C CMOS 32.5 MP',
        'Quay video': '4K 30p không crop, Full HD 120p',
        'Thời lượng pin': '1300 tấm ảnh mỗi lần sạc',
      },
      features: [
        'Lấy nét Dual Pixel CMOS AF 45 điểm Cross-type',
        'Kháng bụi và nước cho môi trường khắc nghiệt',
      ],
    },
    {
      name: 'Nikon D850 (Body) FX Full-Frame',
      slug: 'nikon-d850-body-fx',
      brand: 'Nikon',
      brandSlug: 'nikon',
      categorySlug: 'may-anh-dslr',
      sku: 'NIKON-D850',
      description: 'Huyền thoại DSLR Full-frame 45.7MP tốt nhất lịch sử nhiếp ảnh. ISO 64 nguyên bản cho chất lượng hình ảnh sắc nét tối thượng.',
      price: 56000000,
      originalPrice: 61000000,
      imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      stock: 5,
      rating: 5.0,
      reviewCount: 88,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': 'FX Full-Frame BSI CMOS 45.7 MP',
        'Hệ thống AF': '153 điểm lấy nét từ Nikon D5',
        'Tốc độ chụp': '7 fps (9 fps với grip pin MB-D18)',
      },
      features: [
        'ISO nguyên bản cực thấp ISO 64 tăng chi tiết vùng tối',
        'Màn hình cảm ứng lật 3.2 inch sắc nét',
      ],
    },
    {
      name: 'Ống kính Sigma 24-70mm f/2.8 DG DN Art (Ngàm Sony E)',
      slug: 'sigma-24-70mm-f2-8-dg-dn-art-sony-e',
      brand: 'Sigma',
      brandSlug: 'sigma',
      categorySlug: 'ong-kinh-lens',
      sku: 'SIGMA-2470-E',
      description: 'Ống kính Zoom đa dụng cao cấp dải tiêu cự vàng 24-70mm với khẩu độ cố định f/2.8 sắc nét hoàn hảo từ tâm ra rìa cho máy ảnh Full-frame Sony E.',
      price: 24500000,
      originalPrice: 26900000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 20,
      rating: 4.8,
      reviewCount: 76,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tiêu cự': '24-70mm',
        'Khẩu độ': 'f/2.8 - f/22',
        'Ngàm': 'Sony E-mount (Full-frame)',
      },
      features: [
        'Thấu kính FLD & SLD triệt tiêu hiện tượng quang sai',
        'Lớp phủ Super Multi-Layer Coating chống lóa',
      ],
    },
    {
      name: 'Ống kính Canon RF 24-70mm f/2.8L IS USM',
      slug: 'canon-rf-24-70mm-f2-8l-is-usm',
      brand: 'Canon',
      brandSlug: 'canon',
      categorySlug: 'ong-kinh-lens',
      sku: 'CANON-RF-2470',
      description: 'Ống kính Zoom tiêu chuẩn dòng L cao cấp nhất của Canon cho máy ảnh ngàm RF. Tích hợp chống rung quang học IS 5 stops và mô-tơ lấy nét siêu tốc Nano USM.',
      price: 54900000,
      originalPrice: 58500000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 11,
      rating: 4.9,
      reviewCount: 62,
      isFeatured: true,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tiêu cự': '24-70mm',
        'Khẩu độ': 'f/2.8 cố định',
        'Chống rung': 'IS 5 stops',
        'Ngàm': 'Canon RF (Full-frame)',
      },
      features: [
        'Vòng xoay Control Ring tùy chỉnh gán khẩu độ / ISO',
        'Lớp phủ Fluorine chống bám vân tay và hạt nước',
      ],
    },
    {
      name: 'Ống kính Sony FE 70-200mm f/2.8 GM OSS II',
      slug: 'sony-fe-70-200mm-f2-8-gm-oss-ii',
      brand: 'Sony',
      brandSlug: 'sony',
      categorySlug: 'ong-kinh-lens',
      sku: 'SONY-70200-GM2',
      description: 'Ống kính Tele Zoom hàng đầu thế giới nhẹ hơn 29% so với thế hệ 1. Sở hữu 4 mô-tơ XD Linear cực mạnh bắt nét chim bay và thể thao.',
      price: 64900000,
      originalPrice: 69000000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 7,
      rating: 5.0,
      reviewCount: 45,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tiêu cự': '70-200mm',
        'Khẩu độ': 'f/2.8 cố định',
        'Trọng lượng': 'Chỉ 1045g (nhẹ nhất phân khúc)',
        'Ngàm': 'Sony FE (Full-frame)',
      },
      features: [
        '4 mô-tơ XD Linear cho khả năng AF nhanh gấp 4 lần',
        'Vòng chỉnh khẩu cơ học với công tắc De-click cho quay phim',
      ],
    },
    {
      name: 'Ống kính Fujifilm XF 33mm f/1.4 R LM WR',
      slug: 'fujifilm-xf-33mm-f1-4-r-lm-wr',
      brand: 'Fujifilm',
      brandSlug: 'fujifilm',
      categorySlug: 'ong-kinh-lens',
      sku: 'FUJI-XF33',
      description: 'Ống kính Fix tiêu chuẩn góc nhìn 50mm tương đương chuẩn nhiếp ảnh đời thường. Khẩu độ f/1.4 siêu lớn cho hiệu ứng xóa phông dịu mắt.',
      price: 19500000,
      originalPrice: 21500000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 14,
      rating: 4.9,
      reviewCount: 50,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tiêu cự': '33mm (tương đương 50mm Full-frame)',
        'Khẩu độ': 'f/1.4 - f/16',
        'Ngàm': 'Fujifilm X-mount',
      },
      features: [
        'Mô-tơ tuyến tính LM bắt nét êm ái thích hợp quay vlog',
        'Chống chịu thời tiết WR hoạt động ở -10°C',
      ],
    },
    {
      name: 'Ống kính Tamron 28-75mm f/2.8 Di III VXD G2 (Sony E)',
      slug: 'tamron-28-75mm-f2-8-g2-sony-e',
      brand: 'Tamron',
      brandSlug: 'tamron',
      categorySlug: 'ong-kinh-lens',
      sku: 'TAMRON-2875-G2',
      description: 'Ống kính Zoom bán chạy nhất phân khúc với độ sắc nét cải tiến đột phá ở phiên bản G2. Thấu kính nhỏ gọn hoàn hảo cho du lịch.',
      price: 21500000,
      originalPrice: 23900000,
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      stock: 18,
      rating: 4.8,
      reviewCount: 92,
      isFeatured: true,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tiêu cự': '28-75mm',
        'Khẩu độ': 'f/2.8 cố định',
        'Mô-tơ AF': 'VXD tuyến tính siêu êm',
      },
      features: [
        'Khoảng cách lấy nét tối thiểu chỉ 18cm',
        'Cổng USB-C kết nối trực tiếp phần mềm Tamron Lens Utility',
      ],
    },
    {
      name: 'Canon PowerShot G7 X Mark III (Vlog & LiveStream)',
      slug: 'canon-powershot-g7-x-mark-iii',
      brand: 'Canon',
      brandSlug: 'canon',
      categorySlug: 'may-anh-compact-vlog',
      sku: 'CANON-G7XM3',
      description: 'Máy ảnh compact cao cấp với cảm biến 1.0-inch Stacked CMOS 20.1MP, ống kính zoom quang học 4.2x f/1.8-2.8, hỗ trợ quay phim 4K không crop và tính năng phát trực tiếp LiveStream YouTube trực tiếp.',
      price: 19990000,
      originalPrice: 21500000,
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      stock: 9,
      rating: 4.8,
      reviewCount: 78,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': '1.0-inch Stacked CMOS 20.1 MP',
        'Ống kính': '24-100mm f/1.8 - 2.8 Zoom quang 4.2x',
        'Quay video': '4K 30p không crop, Full HD 120p',
      },
      features: [
        'Màn hình cảm ứng lật 180 độ chụp selfie và quay vlog tiện lợi',
        'Cổng microphone 3.5mm thu âm thanh chất lượng phòng thu',
      ],
    },
    {
      name: 'Sony ZV-E10 Mark II (Kit E PZ 16-50mm F3.5-5.6 OSS II)',
      slug: 'sony-zv-e10-mark-ii-kit',
      brand: 'Sony',
      brandSlug: 'sony',
      categorySlug: 'may-anh-compact-vlog',
      sku: 'SONY-ZVE10M2-KIT',
      description: 'Sony ZV-E10 II được thiết kế chuyên biệt cho nhà sáng tạo nội dung và vlogger với cảm biến 26MP BSI CMOS, quay video 4K 60p 10-bit 4:2:2, micro định hướng 3 capsule và giao diện quay video dọc thông minh.',
      price: 24990000,
      originalPrice: 26900000,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      stock: 14,
      rating: 4.9,
      reviewCount: 92,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': '26.0MP Exmor R APS-C BSI CMOS',
        'Quay video': '4K 60p (Over-sampled 5.6K) 10-bit 4:2:2',
        'Lấy nét': '759 điểm AF nhận diện chủ thể AI',
        'Pin': 'NP-FZ100 dung lượng cao quay chụp cả ngày',
      },
      features: [
        'Tính năng Cinematic Vlog Setting tạo màu sắc điện ảnh một chạm',
        'Tự động xoay giao diện khi quay video dọc phục vụ TikTok & Shorts',
      ],
    },
    {
      name: 'Ricoh GR IIIx Urban Edition (Ống kính 40mm F2.8)',
      slug: 'ricoh-gr-iiix-urban-edition',
      brand: 'Ricoh',
      brandSlug: 'ricoh',
      categorySlug: 'may-anh-compact-vlog',
      sku: 'RICOH-GR3X-URBAN',
      description: 'Vua máy ảnh đường phố bỏ túi với ống kính tiêu cự 40mm F2.8 sắc nét hoàn hảo cho ảnh đời thường, cảm biến APS-C 24.2MP cùng hệ thống chống rung SR 3 trục.',
      price: 28500000,
      originalPrice: 29900000,
      imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      stock: 5,
      rating: 4.9,
      reviewCount: 48,
      isFeatured: true,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': '24.2MP APS-C CMOS không bộ lọc khử răng cưa',
        'Ống kính': '26.1mm F2.8 (tương đương 40mm full-frame)',
        'Chống rung': 'Shake Reduction (SR) 3 trục 4 stops',
      },
      features: [
        'Thân máy siêu nhỏ gọn đút vừa túi quần thao tác chụp 1 tay siêu nhanh',
        'Chế độ màu High-Contrast B&W và Negative Film độc quyền',
      ],
    },
    {
      name: 'GoPro Hero 12 Black Special Bundle',
      slug: 'gopro-hero-12-black-bundle',
      brand: 'GoPro',
      brandSlug: 'gopro',
      categorySlug: 'phu-kien-camera',
      sku: 'GOPRO-HERO12-BD',
      description: 'Camera hành động mạnh nhất với khả năng chống rung HyperSmooth 6.0, quay video 5.3K 60fps, màu 10-bit GP-Log và thời lượng pin gấp đôi nhờ pin Enduro.',
      price: 11990000,
      originalPrice: 13500000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 25,
      rating: 4.8,
      reviewCount: 140,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Quay video': '5.3K 60fps, 4K 120fps, 2.7K 240fps',
        'Chống nước': 'Trực tiếp 10m không cần vỏ bảo vệ',
        'Chống rung': 'HyperSmooth 6.0 AutoBoost',
      },
      features: [
        'Kết nối tai nghe Bluetooth AirPods âm thanh không dây',
        'Khả năng quay video tỷ lệ 8:7 khổ dọc linh hoạt',
      ],
    },
    {
      name: 'Camera bỏ túi DJI Osmo Pocket 3 Creator Combo',
      slug: 'dji-osmo-pocket-3-creator-combo',
      brand: 'DJI',
      brandSlug: 'dji',
      categorySlug: 'phu-kien-camera',
      sku: 'DJI-POCKET3-COMBO',
      description: 'Camera gimbal bỏ túi hot nhất năm với cảm biến 1-inch CMOS 4K 120fps, màn hình cảm ứng xoay 2-inch cực nhạy và micro không dây DJI Mic 2 đi kèm.',
      price: 15890000,
      originalPrice: 16900000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 15,
      rating: 5.0,
      reviewCount: 180,
      isFeatured: true,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Cảm biến': '1-inch CMOS 4K 120fps',
        'Màn hình': 'OLED 2.0 inch xoay ngang/dọc',
        'Chống rung': 'Gimbal cơ học 3 trục',
      },
      features: [
        'Lấy nét toàn điểm Fast Full-Pixel Focus',
        'Đi kèm Micro không dây DJI Mic 2 thu âm lọc gió chuyên nghiệp',
      ],
    },
    {
      name: 'Gimbal chống rung DJI RS 4 Pro (Combos)',
      slug: 'dji-rs-4-pro-combo',
      brand: 'DJI',
      brandSlug: 'dji',
      categorySlug: 'phu-kien-camera',
      sku: 'DJI-RS4-PRO',
      description: 'Gimbal chống rung chuyên nghiệp làm bằng sợi Carbon chịu tải đến 4.5kg. Tích hợp động cơ lấy nét LiDAR lấy nét tự động cho ống kính cơ.',
      price: 22990000,
      originalPrice: 24500000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 8,
      rating: 4.9,
      reviewCount: 35,
      isFeatured: false,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Tải trọng': 'Tối đa 4.5 kg (Chịu được Cinema Camera)',
        'Chất liệu': 'Tay cắm bằng sợi Carbon cao cấp',
        'Khóa trục': 'Khóa tự động Auto-lock thế hệ 2',
      },
      features: [
        'Thuật toán chống rung RS Stabilization Algorithm thế hệ 4',
        'Màn hình cảm ứng OLED hiển thị thông số trực quan',
      ],
    },
    {
      name: 'Thẻ nhớ SanDisk Extreme Pro 128GB SDXC UHS-I 200MB/s',
      slug: 'sandisk-extreme-pro-128gb-sdxc',
      brand: 'SanDisk',
      brandSlug: 'sandisk',
      categorySlug: 'phu-kien-camera',
      sku: 'SANDISK-128GB',
      description: 'Thẻ nhớ SD tốc độ đọc lên đến 200MB/s và ghi 140MB/s chuyên dụng cho chụp ảnh liên tiếp RAW và quay video 4K UHD mượt mà.',
      price: 790000,
      originalPrice: 950000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 50,
      rating: 4.9,
      reviewCount: 310,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Dung lượng': '128 GB',
        'Tốc độ đọc': 'Tối đa 200 MB/s',
        'Chuẩn tốc độ': 'U3, V30, C10, UHS-I',
      },
      features: [
        'Kháng nước, chống sốc, chống tia X-ray và nhiệt độ khắc nghiệt',
        'Tặng kèm phần mềm khôi phục dữ liệu RescuePRO Deluxe 2 năm',
      ],
    },
    {
      name: 'Thẻ nhớ SanDisk Extreme Pro CFexpress Type B 512GB',
      slug: 'sandisk-cfexpress-type-b-512gb',
      brand: 'SanDisk',
      brandSlug: 'sandisk',
      categorySlug: 'phu-kien-camera',
      sku: 'SANDISK-CFE-512',
      description: 'Thẻ nhớ chuẩn CFexpress Type B siêu tốc độ đọc 1700MB/s chuyên dành cho máy ảnh Full-frame cao cấp quay phim 8K RAW & 4K 120p.',
      price: 6500000,
      originalPrice: 7200000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 12,
      rating: 5.0,
      reviewCount: 42,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Dung lượng': '512 GB',
        'Tốc độ đọc': '1700 MB/s',
        'Tốc độ ghi': '1400 MB/s',
      },
      features: [
        'Đạt hiệu năng tối ưu ghi video RAW không bị rớt khung hình (Dropped Frames)',
      ],
    },
    {
      name: 'Túi máy ảnh Peak Design Everyday Backpack 20L V2',
      slug: 'peak-design-everyday-backpack-20l-v2',
      brand: 'Peak Design',
      brandSlug: 'peak-design',
      categorySlug: 'phu-kien-camera',
      sku: 'PEAK-BP-20L',
      description: 'Balo máy ảnh cao cấp thông minh với vách ngăn FlexFold linh hoạt, khóa MagLatch thao tác mở cực nhanh và vải nylon 400D chống nước 100%.',
      price: 7490000,
      originalPrice: 8200000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 10,
      rating: 4.9,
      reviewCount: 78,
      isFeatured: false,
      isNew: false,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Dung tích': '20 Lít (Mở rộng 23L)',
        'Khả năng chứa': '2 Body Mirrorless + 4 Ống kính + Laptop 15 inch',
        'Chất liệu': 'Vải Canvas Nylon 400D tái chế 100%',
      },
      features: [
        'Vách chia thông minh FlexFold có thể gập linh hoạt 3 tầng',
        'Truy cập nhanh 2 bên hông không cần tháo balo',
      ],
    },
    {
      name: 'Chân máy ảnh Carbon Peak Design Travel Tripod',
      slug: 'peak-design-travel-tripod-carbon',
      brand: 'Peak Design',
      brandSlug: 'peak-design',
      categorySlug: 'phu-kien-camera',
      sku: 'PEAK-TRIPOD-CB',
      description: 'Chân máy ảnh du lịch bằng sợi Carbon siêu nhẹ và gấp gọn tối ưu nhất thế giới. Tải trọng 9.1kg và tích hợp sẵn ngàm kẹp điện thoại thông minh.',
      price: 16900000,
      originalPrice: 18500000,
      imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      stock: 8,
      rating: 5.0,
      reviewCount: 52,
      isFeatured: false,
      isNew: true,
      gallery: [
        'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=1000',
      ],
      specs: {
        'Chất liệu': 'Sợi Carbon 8 lớp cao cấp',
        'Chiều cao tối đa': '152.4 cm',
        'Chiều dài gấp gọn': 'Chỉ 39.1 cm (đường kính chỉ 7.9cm)',
        'Tải trọng': '9.1 kg',
      },
      features: [
        'Thiết kế không lãng phí không gian (Zero Dead-space Design)',
        'Đầu Ballhead thao tác 1 vòng xoay mượt mà chuẩn xác',
      ],
    },
  ];

  for (const prod of products) {
    const categoryId = categoryMap[prod.categorySlug];
    const brandId = brandMap[prod.brandSlug];

    if (!categoryId) continue;

    const createdProduct = await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        brand: prod.brand,
        brandId: brandId || null,
        categoryId: categoryId,
        sku: prod.sku,
        description: prod.description,
        price: prod.price,
        originalPrice: prod.originalPrice,
        imageUrl: prod.imageUrl,
        stock: prod.stock,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        isFeatured: prod.isFeatured,
        isNew: prod.isNew,
        status: 'active',
        images: {
          create: prod.gallery.map((url, idx) => ({
            imageUrl: url,
            isPrimary: idx === 0,
            displayOrder: idx,
          })),
        },
        specs: {
          create: Object.entries(prod.specs).map(([key, val]) => ({
            specKey: key,
            specValue: val,
          })),
        },
        features: {
          create: prod.features.map((feat, idx) => ({
            featureText: feat,
            displayOrder: idx,
          })),
        },
      },
    });

    console.log(` ✅ Đã tạo sản phẩm: ${createdProduct.name}`);
  }

  // 4. Seed Demo Customer
  const passwordHash = await bcrypt.hash('123456', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'customer@demopick.vn',
      fullName: 'Nguyễn Văn Phục',
      phone: '0909123456',
      passwordHash,
      role: 'customer',
      addresses: {
        create: [
          {
            label: 'Nhà riêng',
            recipientName: 'Nguyễn Văn Phục',
            phone: '0987654321',
            address: 'Số 10 Đường Cầu Giấy, Phường Dịch Vọng',
            city: 'Hà Nội',
            isDefault: true,
          },
          {
            label: 'Văn phòng Công ty',
            recipientName: 'Nguyễn Văn Phục (Công ty)',
            phone: '0987654321',
            address: 'Tầng 18, Toà nhà Keangnam Landmark 72, Phạm Hùng',
            city: 'Hà Nội',
            isDefault: false,
          },
          {
            label: 'Sân Pickleball',
            recipientName: 'Nguyễn Văn Phục (Sân Q7)',
            phone: '0987654321',
            address: 'Cụm Sân DemoPick Pickleball, 123 Đường Tân Phong',
            city: 'TP. Hồ Chí Minh',
            isDefault: false,
          },
        ],
      },
    },
  });

  console.log(` 👤 Đã tạo tài khoản demo: ${demoUser.email} (Mật khẩu: 123456)`);

  console.log('🎉 Hoàn thành gieo mầm dữ liệu (Seeding completed successfully)!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
