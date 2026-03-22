
# 🚀 ĐẶC TẢ ỨNG DỤNG: INNOVATION HUB
## Nền tảng Đổi mới Sáng tạo Nội bộ (Web App)

---

## 1. TỔNG QUAN SẢN PHẨM

**Innovation Hub** là ứng dụng web nội bộ cho phép bộ phận:
- **Thu thập vấn đề** một cách có cấu trúc (thay vì chat lung tung)
- **Thảo luận tập trung** với threading comment
- **Brainstorming giải pháp** trong không gian riêng biệt nhưng liên kết chặt chẽ với vấn đề

**Mục tiêu OKR:** Trực tiếp phục vụ KR3 năm (*50 ý tưởng, 70% tương tác, 20% thành dự án thử nghiệm*) bằng cách số hóa quy trình "Đăng → Bàn → Làm".

---

## 2. KIẾN TRÚC NGƯỜI DÙNG

| Vai trò | Quyền hạn |
|:--------|:----------|
| **Thành viên Bộ phận** | Đăng vấn đề, Comment, Tạo ý tưởng Brainstorm, Vote, Xem Dashboard |
| **Admin (Trưởng nhóm)** | Quản lý tài khoản, Ghim/Đóng bài, Chuyển trạng thái ý tưởng, Export báo cáo |

---

## 3. MODULE CHỨC NĂNG CHI TIẾT

### 🔐 Module 1: Xác thực & Tài khoản (Đơn giản như yêu cầu)

| Chức năng | Mô tả |
|:----------|:------|
| **Đăng nhập** | Username/Password cơ bản (có thể tích hợp SSO công ty sau này) |
| **Quản lý Profile** | Đổi mật khẩu, Upload avatar, Chọn Ban/Team |
| **Phân quyền** | Phân biệt User thường và Admin ngay từ đầu |

---

### 📝 Module 2: Trung tâm Vấn đề (Problem Feed)

**Đây là "Newsfeed" của những điểm nghẽn/thách thức trong bộ phận:**

| Tính năng | Chi tiết |
|:----------|:---------|
| **Tạo Post Vấn đề** | - Tiêu đề rõ ràng<br>- Mô tả chi tiết (hỗ trợ nhiều loại Typing như Markdown hay Quill,...)<br>- Tag/Category: *Quy trình, Kỹ thuật, Con người, Công cụ, Patent...*<br>|
| **Trạng thái Vấn đề** | *Mở → Đang thảo luận → Chuyển sang Brainstorming → Đã có giải pháp → Đóng*<br>**Tự động chuyển:** Mở→Đang thảo luận (khi có comment từ người khác), Mở/Đang thảo luận→Brainstorming (khi tạo phòng brainstorm).<br>**Thủ công:** Đã có giải pháp, Đóng (do tác giả hoặc Admin chuyển). |
| **Tương tác Cơ bản** | - **Comment** threaded (trả lời lồng nhau)<br>- **Reaction** đơn giản: 👍 👎 💡 (Ý hay)<br>- **@mention** để tag đồng nghiệp vào thảo luận |
| **Tìm kiếm/Lọc** | Tìm theo từ khóa, Lọc theo Category, Sắp xếp theo: Mới nhất / Nhiều bình luận nhất / Reaction |

---

### 💡 Module 3: Phòng Brainstorming (Idea Lab) - **Liên kết chặt chẽ**

**Đây là "không gian sáng tạo" riêng biệt nhưng không tách rời:**

#### Cơ chế Liên kết (Core Logic):
```
[Vấn đề trong Feed] --(1 click)--> [Tạo Brainstorm Room] 
                                      ↓
                              [Không gian Ý tưởng riêng]
                                      ↓
                              [Liên kết ngược về Vấn đề gốc]
```

| Tính năng | Chi tiết |
|:----------|:---------|
| **Chuyển đổi từ Vấn đề** | Từ bài Post Vấn đề, bấm nút **"Brainstorm Giải pháp"** → Tự động tạo Room mới với link reference ngược lại |
| **Cấu trúc Ý tưởng** | Mỗi ý tưởng trong Room gồm:<br>- Tiêu đề<br>- Tóm tắt ngắn (Summary, tùy chọn — hiển thị khi listing)<br>- Mô tả chi tiết giải pháp<br>|
| **Thảo luận chuyên sâu** | - Comment riêng cho từng ý tưởng<br>- **Vote** bằng sao (1-5 sao) để đánh giá mức độ khả thi<br>- Ghim ý tưởng hay nhất lên đầu |
| **Trạng thái Ý tưởng** | *Draft → Đang hoàn thiện (Refining) → Đang xem xét (Reviewing) → Đã nộp (Submitted) / Đóng (Closed)*<br>Board view cho phép kéo thả tự do giữa Draft/Refining/Reviewing. Submitted và Closed là trạng thái kết thúc. |

#### Hai chế độ xem (View):
1. **Board View:** Kanban board kéo thả ý tưởng theo trạng thái (như Trello)
2. **List View:** Danh sách có filter theo người đề xuất, số vote, trạng thái

---

### 📊 Module 4: Dashboard & Thống kê (Phục vụ OKR)

| Chỉ số hiển thị | Ý nghĩa |
|:----------------|:--------|
| **Tổng ý tưởng** | Đếm số lượng ý tưởng trong Brainstorming (Theo dõi mục tiêu 50 ý tưởng/năm) |
| **Tỷ lệ Tương tác** | % Vấn đề/Ý tưởng có ít nhất 1 comment (Theo dõi mục tiêu 70%) |
| **Top Contributors** | Bảng vàng thành viên đóng góp nhiều nhất (Gamification nhẹ) |
| **Pipeline** | Biểu đồ ý tưởng đang ở trạng thái nào (Bao nhiêu % đã chuyển sang Pilot - mục tiêu 20%) |

---

## 4. LUỒNG NGƯỜI DÙNG CHÍNH (User Flow)

### Scenario 1: Từ Vấn đề đến Giải pháp
```
1. User A đăng nhập → Thấy Dashboard
2. Click "Đăng Vấn đề mới" → Mô tả: "Quy trình xin nghỉ phép phức tạp, mất 3 ngày"
3. User B vào Comment: "Đúng rồi, mình suggest dùng form online"
4. User A click "Brainstorm Giải pháp" → Tạo Room "Cải tiến quy trình nghỉ phép"
5. Trong Room: User C đề xuất ý tưởng "Auto-approval cho nghỉ <1 ngày"
6. Mọi người Vote 5 sao và Comment bổ sung → Ý tưởng được chuyển trạng thái "Sẵn sàng Pilot"
```

### Scenario 2: Brainstorm độc lập (Không từ Vấn đề)
```
1. User click tab "Brainstorming" → Tạo Room mới trực tiếp
2. Đặt tên: "Ý tưởng cải tiến OKR Tool"
3. Mọi người vào thảo luận ngay (không cần thông qua Problem Feed)
```

---

## 5. YÊU CẦU KỸ THUẬT (Tech Stack đề xuất)

| Thành phần | Công nghệ đề xuất | Lý do |
|:-----------|:------------------|:------|
| **Frontend** | React.js hoặc Vue.js | Tương tác nhanh, dễ làm real-time comment |
| **Backend** | Node.js (Express) hoặc Python (FastAPI) | Xử lý bất đồng bộ tốt cho comment/vote |
| **Database** | PostgreSQL | Lưu trữ quan hệ: User → Post → Comment → Idea (chuẩn chỉnh) |
| **Real-time** | Socket.io | Comment xuất hiện ngay không cần refresh |
| **Authentication** | JWT (JSON Web Token) | Đơn giản, stateless cho web app |
| **Deploy** | Docker + VPS/Internal Server | Dễ maintain cho team nhỏ |

---

## 6. RÀNG BUỘC & LƯU Ý THIẾT KẾ

1. **Đơn giản:** Không làm quá nhiều feature lạ. Tập trung vào 3 luồng chính: *Đăng - Bàn - Vote*.
2. **Notification:** Khi có comment mới hoặc ý tưởng được chuyển trạng thái, gửi email/notification đơn giản.
3. **Backup:** Export dữ liệu ý tưởng ra Excel/CSV định kỳ (phòng hệ thống lỗi, và để báo cáo sếp).
