Bạn là một Senior Fullstack Engineer chuyên sâu về Node.js (Express.js / TypeScript hoặc ES6) cho Backend và React (Vite / TypeScript / Tailwind CSS) cho Frontend.

Tôi đang xây dựng một ứng dụng web thương mại điện tử thuần React + Node.js và cần bạn thiết kế, viết code hoàn chỉnh 5 tính năng cốt lõi sau. Toàn bộ tính năng phải đạt chuẩn production, có xử lý ngoại lệ chặt chẽ và tích hợp sẵn cơ chế dữ liệu tĩnh dự phòng (Mock Fallback) để luôn sẵn sàng demo/nghiệm thu không lo lỗi dữ liệu rỗng.

---

### 1. MÔ-ĐUN 1: CỔNG THANH TOÁN MOMO (NODE.JS CRYPTO & IPN WEBHOOK)
* **Backend (Node.js / Express):**
  - Sử dụng thư viện gốc `crypto` của Node.js để băm chữ ký:
    `crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')`.
  - Endpoint `POST /api/v1/payment/momo/create`:
    + Nhận thông tin đơn hàng, tạo `orderId`, `requestId`.
    + Ghép chuỗi rawSignature theo chuẩn MoMo v2 (`accessKey=...&amount=...&extraData=...&ipnUrl=...&orderId=...&orderInfo=...&partnerCode=...&redirectUrl=...&requestId=...&requestType=captureWallet`).
    + Gọi `axios.post` tới MoMo Sandbox (`https://test-payment.momo.vn/v2/gateway/api/create`).
    + Trả về `payUrl` cho Frontend.
  - Endpoint `GET /api/v1/payment/momo/callback`:
    + Nhận chuyển hướng từ MoMo khi khách thanh toán xong, kiểm tra `resultCode === '0'`, cập nhật trạng thái đơn hàng sang `paid`, chuyển hướng người dùng về trang thành công.
  - Endpoint `POST /api/v1/payment/momo/ipn`:
    + Webhook nhận thông báo từ server MoMo, kiểm tra tính hợp lệ của chữ ký phản hồi, cập nhật database và phản hồi lại `{ resultCode: 0, message: "Success" }`.
* **Frontend (React):**
  - Nút thanh toán kích hoạt API và chuyển hướng mượt mà: `window.location.href = res.data.payUrl`.

---

### 2. MÔ-ĐUN 2: LIVE CHAT 2 CHIỀU (SOCKET.IO HOẶC REST POLLING)
* **Backend (Node.js):**
  - Mô hình dữ liệu tin nhắn: `id`, `userId`, `senderRole` ('user' | 'admin'), `message`, `isRead`, `createdAt`.
  - Hỗ trợ Socket.io (sự kiện `join_chat`, `send_message`, `receive_message`) HOẶC bộ API REST Polling:
    + `POST /api/v1/chat/send`: Gửi tin nhắn.
    + `GET /api/v1/chat/messages/:userId`: Lấy lịch sử hội thoại.
    + `GET /api/v1/admin/chat/conversations`: Danh sách các user đang chat.
* **Frontend (React):**
  - **Khách hàng (Floating Chat Widget):** Nút chat tròn nổi góc dưới phải màn hình. Khi bấm mở rộng khung chat, tin nhắn chào tự động, cuộn xuống tin mới nhất, tự động nhận tin nhắn phản hồi từ Admin sau mỗi 3 giây (nếu dùng Polling) hoặc tức thì (nếu dùng Socket.io).
  - **Quản trị viên (Admin Chat Console):** Giao diện 2 cột phong cách Messenger: Cột trái danh sách khách hàng đang chờ/đang chat (kèm badge tin chưa đọc, thời gian); Cột phải khung chat chi tiết để Admin phản hồi tức thì.

---

### 3. MÔ-ĐUN 3: QUẢN LÝ ĐƠN HÀNG & QUY TẮC KHÓA HỦY ĐƠN
* **Frontend (Admin Orders Tab):**
  - Thanh 8 Tab trạng thái kèm huy hiệu đếm số lượng:
    `Tất cả`, `Chờ xử lý (pending)`, `Đã xác nhận (ready)`, `Đang lấy hàng (picking)`, `Đang giao hàng (delivering)`, `Giao thành công (delivered)`, `Hoàn hàng (return)`, `Đã hủy (cancelled)`.
  - Ô tìm kiếm theo mã đơn hàng, tên khách hàng, số điện thoại.
* **Quy tắc Nghiệp vụ Khóa Hủy Đơn (Cancellation Lock):**
  - Tuyệt đối cấm hủy các đơn hàng đang trên đường giao (`shipping` / `delivering`).
  - Giao diện: Nút "Hủy đơn" bị mờ (disabled), kèm biểu tượng ổ khóa 🔒 và tooltip cảnh báo.
  - Backend: Route `PUT /api/v1/orders/:id/cancel` kiểm tra trạng thái đơn. Nếu đang ở trạng thái `delivering` hoặc đã bàn giao hãng vận chuyển, trả về HTTP 400/422 `{ error: "Đơn hàng đang giao không thể hủy!" }`.

---

### 4. MÔ-ĐUN 4: BÁO CÁO DOANH THU & BIỂU ĐỒ TRỰC QUAN (REPORTS TAB)
* **KPI Cards:** Thẻ thống kê: Doanh thu tổng (VND), Tổng số đơn hàng, Khách hàng mua sắm, Tỷ lệ thanh toán thành công.
* **5 Biểu đồ phân tích (dùng Recharts hoặc Chart.js):**
  - Doanh thu 30 ngày gần nhất (Area Chart).
  - Doanh thu 12 tháng theo năm (Bar Chart).
  - Phân bổ danh mục sản phẩm bán chạy (Donut / Pie Chart).
  - Tỷ lệ phương thức thanh toán (MoMo, VietQR, COD).
  - Cơ cấu trạng thái đơn hàng.
* **Cơ chế Dữ liệu Tĩnh (Static Mock Fallback):**
  - Cả trong Controller của Node.js lẫn Component React đều có sẵn bộ số liệu mock đầy đủ, chân thực. Nếu database chưa có dữ liệu giao dịch thực tế, hệ thống tự động trả về bộ số liệu này để báo cáo luôn đẹp mắt, không bao giờ bị trắng trang hay gãy biểu đồ.

---

### 5. MÔ-ĐUN 5: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (ADMIN USERS TAB)
* **Bảng danh sách người dùng:**
  - Cột: ID, Avatar chữ cái đầu, Họ và tên, Email, SĐT, Phân quyền (Admin / Customer), Ngày tham gia, Nút thao tác (Xem, Sửa, Xóa).
  - Bộ lọc theo Vai trò (Tất cả, Admin, Khách hàng) và Ô tìm kiếm tức thì.
  - 3 Thẻ thống kê nhanh trên đầu: Tổng người dùng, Khách hàng, Quản trị viên.
* **Modal thao tác CRUD:**
  - *Xem chi tiết:* Hiển thị thông tin cá nhân và lịch sử 2 đơn hàng gần nhất.
  - *Thêm mới / Chỉnh sửa:* Form validate đẹp mắt với toast thông báo.
  - *Xóa:* Xác nhận an toàn, không cho xóa Admin gốc.
* **Cơ chế Dữ liệu Tĩnh (Static Mock Users):**
  - Khởi tạo trực tiếp danh sách 12-15 người dùng mẫu thực tế, thông tin chuẩn chỉnh (không chứa dữ liệu rác hay email sinh viên test). Bảng luôn có dữ liệu hiển thị ngay lập tức khi mở tab.

---

### YÊU CẦU CẤU TRÚC VÀ MÃ NGUỒN:
1. **Node.js (Backend):**
   - Viết bằng Express.js theo mô hình Controller - Route rõ ràng.
   - Cung cấp file cấu hình `.env` mẫu cho cổng MoMo và Cổng Server.
   - Xử lý CORS (`cors`), body-parser (`express.json()`), và middleware xử lý lỗi tập trung.
2. **React (Frontend):**
   - Sử dụng React 18, Tailwind CSS, Lucide React cho icon, Recharts (hoặc Chart.js) cho biểu đồ.
   - State management rõ ràng (hoặc custom hook API), thông báo hành động bằng Toast.
   - Giao diện hiện đại, chuẩn bo góc mềm mại (`rounded-2xl`, `rounded-3xl`), font chữ sắc nét, hoàn toàn responsive.

Hãy cung cấp chi tiết từng file mã nguồn (Backend & Frontend) cùng hướng dẫn cài đặt các package cần thiết để chạy dự án!



