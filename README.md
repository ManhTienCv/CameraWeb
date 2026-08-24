# 📷 CameraHub - Nền Tảng Thương Mại Điện Tử Máy Ảnh & Thiết Bị Nhiếp Ảnh

> **CameraHub** là nền tảng thương mại điện tử Full-Stack hiện đại dành cho thiết bị máy ảnh, ống kính và flycam cao cấp. Dự án được phát triển với kiến trúc **React 18 + Node.js (Express) + TypeScript + Prisma ORM + PostgreSQL**, tích hợp hệ thống thanh toán thông minh **VietQR**, bảo mật **Email OTP qua Google SMTP** và trang quản trị **Admin Dashboard** toàn diện.

---

## 🌟 Tính Năng Nổi Bật

### 🛒 1. Trải Nghiệm Khách Hàng (Storefront E-Commerce)
- **Trang chủ & Khám phá**: Hero Banner sống động, Danh mục nổi bật, Bộ sưu tập sản phẩm Flash Sale, Hàng mới về và Sản phẩm bán chạy.
- **Danh mục & Bộ lọc đa năng (Catalog)**: Lọc sản phẩm theo Danh mục, Thương hiệu (Sony, Canon, Nikon, Fujifilm, DJI...), lọc theo khoảng giá, phân trang chuẩn 10 sản phẩm/trang.
- **Chi tiết sản phẩm (Product Detail)**: Album ảnh Gallery đa góc chụp, Thông số kỹ thuật (Specs), Tính năng nổi bật (Features), chọn số lượng và sản phẩm tương tự liên quan.
- **Đánh giá & Bình luận (Reviews)**: Hệ thống chấm sao (1-5★), phản hồi kèm hình ảnh thực tế và gắn nhãn *Đã mua hàng chính hãng*.
- **Giỏ hàng & Quản lý phiên (Cart & Session)**: Tự động lưu giỏ hàng theo Session, hỗ trợ cập nhật số lượng và tính toán phí vận chuyển realtime.

---

### 💳 2. Thanh Toán Thông Minh VietQR & Đếm Ngược 15 Phút
- **Thanh toán VietQR động**: Tự động sinh mã QR ngân hàng Vietcombank (STK: `88888888`, Chủ TK: *Nguyễn Mạnh Tiến*) kèm nút sao chép 1 chạm.
- **Đồng hồ đếm ngược 15 phút**: Phiên thanh toán được bảo lưu trong 15 phút, nếu quá hạn hệ thống tự động đưa về giỏ hàng an toàn; nếu rời trang mua thêm sản phẩm thời gian sẽ tự động làm mới lại từ đầu.
- **Tự động duyệt đơn hàng online (Shopee Flow)**: Bấm xác nhận chuyển khoản thành công sẽ tự động chuyển đơn sang trạng thái `Đang vận chuyển (shipping)`.

---

### 🔐 3. Bảo Mật & Email Tự Động (Google SMTP Service)
- **Xác thực OTP khi đăng ký**: Hệ thống gửi mã OTP 6 số bảo mật về Gmail của khách hàng với giao diện 6 ô nhập tự nhảy và bộ đếm 60s.
- **Xác thực OTP khi đổi Email**: Khách hàng muốn đổi địa chỉ email trong trang Cá nhân cần xác thực quyền sở hữu hòm thư mới qua mã OTP 6 số.
- **Email thông báo hành trình vận chuyển**: Tự động gửi email thông báo khi đơn hàng được duyệt giao (`shipping`) kèm mã vận đơn GHN Express, và email chúc mừng khi giao thành công (`delivered`).

---

### 👤 4. Trang Cá Nhân & Sổ Địa Chỉ (Profile & Address Book)
- Quản lý thông tin tài khoản, cập nhật Họ tên, SĐT, Mật khẩu và Email (qua OTP).
- Sổ địa chỉ đa năng: Thêm, sửa, xóa nhiều địa chỉ nhận hàng, chọn địa chỉ mặc định.

---

### 🛡️ 5. Bảng Điều Khiển Quản Trị (Admin Dashboard)
- **Tổng quan KPI**: Báo cáo doanh thu thực tế, số lượng đơn hàng, biểu đồ tăng trưởng.
- **Quản lý Đơn hàng (Orders)**: Theo dõi phương thức thanh toán (VietQR / COD), trạng thái thanh toán, cập nhật trạng thái đơn (Chờ xử lý, Đang giao, Hoàn tất, Đã hủy) và xem modal chi tiết đầy đủ từng sản phẩm khách mua.
- **Quản lý Sản phẩm (Products)**: Thêm/sửa/xóa sản phẩm, upload ảnh đại diện và gallery nhiều ảnh, quản lý thông số kỹ thuật động và cập nhật tồn kho.
- **Quản lý Danh mục (Categories)**: Thêm, sửa, xóa và thống kê số lượng sản phẩm theo từng nhóm phân loại.
- **Cài đặt cửa hàng (Settings)**: Quản lý thông tin liên hệ, hotline, địa chỉ showroom chính, phí vận chuyển và chính sách đổi trả.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Phân hệ | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Nodemailer (Google SMTP) |
| **Database** | PostgreSQL / SQLite |
| **Thanh toán & Mail** | VietQR API, Google SMTP Gmail TLS/STARTTLS |

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
Camera/
├── client/                     # Mã nguồn Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Header, Footer, StarRating, ProductCard, Modals
│   │   │   └── admin/          # Tabs & Modals quản trị Admin (Orders, Products, Dashboard...)
│   │   ├── context/            # CartContext, AuthContext
│   │   ├── lib/                # API client, formatters, settings
│   │   ├── pages/              # Home, Catalog, Detail, Cart, Checkout, OrderSuccess, Orders, Profile, Admin
│   │   ├── types.ts            # Khai báo TypeScript types & interfaces
│   │   └── App.tsx & main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Mã nguồn Backend REST API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (User, Product, Category, Order, Cart, Address...)
│   │   └── seed.ts             # Bộ dữ liệu mẫu khởi tạo (26 sản phẩm camera & phụ kiện)
│   ├── src/
│   │   ├── controllers/        # auth, product, category, cart, order controllers
│   │   ├── lib/                # prisma client, email service (SMTP), vietqr
│   │   ├── routes/             # RESTful API endpoints (/api/v1/...)
│   │   └── server.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                # Root monorepo scripts
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án

### 1. Cài đặt các gói thư viện:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Khởi chạy toàn bộ hệ thống (Client + Server):
Tại thư mục gốc:
```bash
npm run dev
```

- **Website Khách hàng**: [http://localhost:3000](http://localhost:3000)
- **Trang Quản trị Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Backend REST API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 📝 License & Tác Giả
- **Dự án**: CameraHub E-Commerce Platform
- **Tác giả**: Nguyễn Mạnh Tiến
- **Bản quyền**: © 2026 CameraHub Vietnam. All rights reserved.
