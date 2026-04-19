# API CONTRACT - Innovation Hub

**Version**: 1.0
**Cập nhật**: 2026-03-16
**Mục đích**: Nguồn sự thật duy nhất (Single Source of Truth) cho cả Backend và Frontend.

> **Quy tắc**: Khi cần thay đổi API, sửa file này TRƯỚC, rồi cập nhật BE và FE theo.

---

## Quy ước chung

### Base URL
```
/api/v1
```

### Authentication
Tất cả endpoints có đánh dấu 🔒 yêu cầu JWT token:
```
Authorization: Bearer <access_token>
```

### Response Format chuẩn

**Thành công (đơn lẻ):**
```json
{
  "id": "uuid",
  "field": "value",
  ...
}
```

**Thành công (danh sách có phân trang):**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Lỗi:**
```json
{
  "detail": "Mô tả lỗi"
}
```

### Quy ước chung
- **ID**: UUID v4
- **Timestamps**: ISO 8601 (`2026-03-16T10:30:00Z`)
- **Pagination**: `page` (từ 1) + `limit` (mặc định 20, tối đa 100)
- **Phương thức cập nhật**: PATCH (partial update)
- **Xóa**: DELETE trả về 204 No Content

---

## 1. AUTH (`/auth`)

### 1.1 POST `/auth/register` — Đăng ký
- **Auth**: Không yêu cầu
- **Status**: 201 Created

**Request Body:**
```json
{
  "username": "string (3-50 ký tự, bắt buộc)",
  "password": "string (8-128 ký tự, bắt buộc)",
  "email": "string (email hợp lệ, tùy chọn)",
  "full_name": "string (tối đa 100 ký tự, tùy chọn)",
  "team": "string (tối đa 50 ký tự, tùy chọn)"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": { → UserObject }
}
```

---

### 1.2 POST `/auth/login` — Đăng nhập
- **Auth**: Không yêu cầu
- **Status**: 200 OK

**Request Body:**
```json
{
  "username": "string (bắt buộc)",
  "password": "string (bắt buộc)"
}
```

**Response:** Giống 1.1

---

### 1.3 POST `/auth/refresh` — Làm mới token
- **Auth**: Không yêu cầu
- **Status**: 200 OK

**Request Body:**
```json
{
  "refresh_token": "string (bắt buộc)"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": { → UserObject }
}
```

---

### 1.4 PUT `/auth/password` — Đổi mật khẩu 🔒
- **Auth**: Bắt buộc
- **Status**: 200 OK

**Request Body:**
```json
{
  "old_password": "string (bắt buộc)",
  "new_password": "string (8-128 ký tự, bắt buộc)"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

## 2. USERS (`/users`)

### UserObject
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string | null",
  "full_name": "string | null",
  "role": "member | admin",
  "team": "string | null",
  "avatar_url": "string | null",
  "is_active": true,
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

### 2.1 GET `/users/me` — Thông tin user hiện tại 🔒
- **Status**: 200 OK
- **Response:** UserObject

### 2.2 PATCH `/users/me` — Cập nhật profile 🔒
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "email": "string (email)",
  "full_name": "string",
  "team": "string",
  "avatar_url": "string"
}
```

**Response:** UserObject

### 2.3 GET `/users` — Danh sách users 🔒
- **Status**: 200 OK
- **Query**: `?page=1&limit=20&team=&role=&search=&is_active=`
- **Response:** `{ items: UserObject[], total, page, limit }`

### 2.4 GET `/users/{user_id}` — Chi tiết user 🔒
- **Status**: 200 OK
- **Response:** UserObject

### 2.5 PATCH `/users/{user_id}` — Admin cập nhật user 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "email": "string (email)",
  "full_name": "string",
  "team": "string",
  "role": "member | admin",
  "is_active": "boolean"
}
```

**Response:** UserObject

### 2.6 DELETE `/users/{user_id}` — Admin xóa user 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 204 No Content
- **Error**: 400 Bad Request nếu xóa chính mình

### 2.7 POST `/users/{user_id}/reset-password` — Admin reset mật khẩu 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 200 OK
- **Logic**: Tạo mật khẩu ngẫu nhiên 12 ký tự, trả về cho admin để gửi cho user

**Response:**
```json
{
  "new_password": "string (12 ký tự ngẫu nhiên)"
}
```

### 2.8 GET `/users/{user_id}/stats` — Thống kê user 🔒
- **Status**: 200 OK

**Response:**
```json
{
  "problems_count": 0,
  "ideas_count": 0,
  "comments_count": 0,
  "rooms_count": 0
}
```

### 2.9 POST `/uploads/avatar` — Upload avatar 🔒
- **Status**: 200 OK
- **Content-Type**: multipart/form-data

**Request:** Form field `file` (image/png, image/jpeg, image/webp, max 10MB)

**Response:**
```json
{
  "url": "string (URL path to avatar on MinIO)"
}
```

> **Logic**: Upload ảnh lên MinIO bucket `avatars`, trả về URL. Frontend dùng URL này gọi PATCH `/users/me` để cập nhật `avatar_url`.

---

## 3. PROBLEMS (`/problems`)

### ProblemObject
```json
{
  "id": "uuid",
  "title": "string",
  "summary": "string | null",
  "content": "JSON (TipTap)",
  "category": "process | technical | people | tools | patent",
  "status": "open | discussing | brainstorming | solved | closed",
  "visibility": "public | private  ← NEW: default public",
  "author_id": "uuid",
  "author": { → UserObject },
  "room_id": "uuid | null  ← enriched: ID của room đầu tiên (backwards compat)",
  "rooms": "[{id, name, status}]  ← enriched: danh sách tất cả rooms liên kết với problem",
  "shared_user_ids": "[uuid]  ← NEW: danh sách user được share (empty = public)",
  "created_at": "datetime",
  "updated_at": "datetime | null",
  "likes_count": 0,
  "dislikes_count": 0,
  "insights_count": 0,
  "comments_count": 0,
  "user_reaction": "like | dislike | insight | null  ← reaction của user hiện tại (null nếu chưa react, null nếu không có auth)"
}
```

### 3.1 GET `/problems` — Danh sách vấn đề 🔒
- **Status**: 200 OK
- **Query**: `?status=&category=&author_id=&search=&sort=newest&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=1&limit=20`
- **Sort options**: `newest`, `oldest`, `most_liked`, `most_commented`
- **Date filter**: `date_from` inclusive, `date_to` inclusive. Không truyền = không lọc theo thời gian.
- **Privacy filter**: Chỉ trả về problems mà user có quyền xem:
  - `visibility = public` → tất cả users đều thấy
  - `visibility = private` → chỉ author, users trong `shared_user_ids`, và Admin thấy
- **Response:** `{ items: ProblemObject[], total, page, limit }`

### 3.2 POST `/problems` — Tạo vấn đề mới 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "title": "string (5-255 ký tự, bắt buộc)",
  "summary": "string (tối đa 500 ký tự, tùy chọn)",
  "content": "JSON (TipTap, bắt buộc)",
  "category": "process | technical | people | tools | patent (bắt buộc)",
  "visibility": "public | private (tùy chọn, mặc định: public)  ← NEW",
  "shared_user_ids": ["uuid"] (tùy chọn, mặc định: [])  ← NEW: danh sách user được share"
}
```

> **Logic Privacy**: 
> - `visibility` không truyền → mặc định `public`
> - `shared_user_ids` rỗng hoặc không truyền + `visibility = public` → tất cả đều thấy
> - `shared_user_ids` có giá trị → tự động set `visibility = private`

**Response:** ProblemObject

### 3.3 GET `/problems/{problem_id}` — Chi tiết vấn đề 🔒
- **Status**: 200 OK
- **Privacy**: Nếu `visibility = private`, chỉ author, users trong `shared_user_ids`, và Admin được xem. Khác → 403.
- **Response:** ProblemObject

### 3.4 PATCH `/problems/{problem_id}` — Cập nhật vấn đề 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "title": "string (5-255 ký tự)",
  "summary": "string (tối đa 500 ký tự)",
  "content": "JSON (TipTap)",
  "category": "process | technical | people | tools | patent",
  "status": "open | discussing | brainstorming | solved | closed",
  "visibility": "public | private  ← NEW",
  "shared_user_ids": ["uuid"]  ← NEW: thay thế toàn bộ danh sách share"
}
```

> **Lưu ý**: Status phải tuân theo workflow (chỉ tiến, không lùi). Xem chi tiết auto/manual transitions ở Section 11.
> - `discussing` và `brainstorming` được hệ thống tự chuyển (không cần gửi qua PATCH)
> - Qua PATCH chỉ nên chuyển: `solved`, `closed`
> - Admin có thể thay đổi status. Member chỉ có thể thay đổi status bài của mình.
> - **Privacy**: Chỉ author hoặc Admin mới thay đổi visibility/shared_user_ids.

**Response:** ProblemObject

### 3.5 DELETE `/problems/{problem_id}` — Xóa vấn đề 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 204 No Content

---

## 4. REACTIONS (`/problems/{problem_id}/reactions`)

### ReactionObject
```json
{
  "id": "uuid",
  "target_id": "uuid",
  "target_type": "problem | idea",
  "type": "like | dislike | insight",
  "user_id": "uuid",
  "created_at": "datetime"
}
```

### 4.1 POST `/problems/{problem_id}/reactions` — Thêm/đổi reaction 🔒
- **Status**: 201 Created
- **Logic**: Nếu user đã reaction cùng type → xóa (toggle). Khác type → đổi sang type mới.

**Request Body:**
```json
{
  "type": "like | dislike | insight (bắt buộc)"
}
```

**Response:** ReactionObject

### 4.2 DELETE `/problems/{problem_id}/reactions` — Xóa reaction 🔒
- **Status**: 204 No Content

### 4.3 POST `/ideas/{idea_id}/reactions` — Thêm reaction cho idea 🔒
- Tương tự 4.1 nhưng cho idea

### 4.4 DELETE `/ideas/{idea_id}/reactions` — Xóa reaction cho idea 🔒
- Tương tự 4.2 nhưng cho idea

---

## 5. ROOMS (`/rooms`)

### RoomObject
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "problem_id": "uuid | null",
  "problem": { → ProblemObject (tóm tắt) } | null,
  "created_by": "uuid",
  "creator": { → UserObject },
  "status": "active | archived",
  "visibility": "public | private (default: public)",
  "shared_user_ids": "[uuid] (danh sách user được chia sẻ khi private)",
  "created_at": "datetime",
  "updated_at": "datetime | null",
  "idea_count": 0,
  "participant_count": 0
}
```

### 5.1 GET `/rooms` — Danh sách phòng brainstorming
- **Status**: 200 OK
- **Auth**: Tùy chọn (Bearer token). Nếu không có token, chỉ hiện phòng public.
- **Query**: `?status=&problem_id=&search=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=1&limit=20`
- **Date filter**: `date_from` inclusive, `date_to` inclusive. Không truyền = không lọc theo thời gian.
- **Privacy**: Room có quyền riêng biệt, **độc lập** với Problem (kể cả khi có `problem_id`). Kiểm tra `visibility` + `shared_user_ids` của chính Room. Admin thấy tất cả.
- **Response:** `{ items: RoomObject[], total, page, limit }`

### 5.2 POST `/rooms` — Tạo phòng mới (standalone) 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "name": "string (3-255 ký tự, bắt buộc)",
  "description": "string (tùy chọn)",
  "problem_id": "uuid (tùy chọn - liên kết với vấn đề)",
  "visibility": "public | private (default: public)",
  "shared_user_ids": ["uuid"] (tùy chọn - danh sách user được chia sẻ)
}
```

> **Logic khi có problem_id**: Tự động chuyển problem status sang `brainstorming`. 1 problem có thể liên kết với nhiều room.
> **Logic privacy**: Nếu `shared_user_ids` có giá trị và `visibility` là `public`, tự động chuyển thành `private`.

**Response:** RoomObject

### 5.3 GET `/rooms/{room_id}` — Chi tiết phòng
- **Status**: 200 OK
- **Auth**: Tùy chọn (Bearer token). Nếu không có token, chỉ xem được phòng public.
- **Privacy**: Trả về 403 nếu phòng private và user không phải creator, không trong shared_user_ids, và không phải admin.
- **Response:** RoomObject

### 5.4 PATCH `/rooms/{room_id}` — Cập nhật phòng 🔒
- **Quyền**: Người tạo hoặc Admin
- **Status**: 200 OK
- **Privacy**: Trả về 403 nếu phòng private và user không có quyền truy cập.

**Request Body (tất cả tùy chọn):**
```json
{
  "name": "string",
  "description": "string",
  "status": "active | archived",
  "visibility": "public | private",
  "shared_user_ids": ["uuid"]
}
```

**Response:** RoomObject

### 5.5 DELETE `/rooms/{room_id}` — Xóa phòng 🔒
- **Quyền**: Người tạo hoặc Admin
- **Status**: 204 No Content
- **Privacy**: Trả về 403 nếu phòng private và user không có quyền truy cập.
- **Error**: 404 Not Found, 403 Forbidden

### 5.6 POST `/problems/{problem_id}/rooms` — Tạo phòng từ vấn đề (1-click) 🔒
- **Status**: 201 Created
- **Error**: 400 Bad Request nếu problem đã ở trạng thái `solved` hoặc `closed`
- **Privacy**: Kiểm tra quyền truy cập Problem trước khi tạo Room. Room được tạo có quyền riêng biệt, độc lập với Problem.
- **Logic**: Tạo room với `problem_id` liên kết, chuyển problem status sang `brainstorming`. 1 problem có thể liên kết với nhiều room. Privacy của Room độc lập với Problem.

**Request Body:**
```json
{
  "name": "string (3-255 ký tự, bắt buộc)",
  "description": "string (tùy chọn)",
  "visibility": "public | private (default: public)",
  "shared_user_ids": ["uuid"] (tùy chọn)
}
```

**Response:** RoomObject

---

## 6. IDEAS (`/ideas`)

### IdeaObject
```json
{
  "id": "uuid",
  "room_id": "uuid",
  "title": "string",
  "description": "JSON (TipTap)",
  "summary": "string | null",
  "status": "draft | refining | reviewing | submitted | closed",
  "author_id": "uuid",
  "author": { → UserObject },
  "is_pinned": false,
  "created_at": "datetime",
  "updated_at": "datetime | null",
  "vote_avg": 0.0,
  "vote_count": 0,
  "comments_count": 0,
  "user_reaction": "like | dislike | insight | null  ← reaction của user hiện tại",
  "user_vote": "{ stars: 1-5 } | null  ← vote của user hiện tại (null nếu chưa vote)"
}
```

### 6.1 GET `/ideas` — Danh sách ý tưởng 🔒
- **Status**: 200 OK
- **Query**: `?room_id=&author_id=&status=&search=&sort=newest&page=1&limit=20`
- **Sort options**: `newest`, `top_voted`, `most_commented`
- **Privacy**: Ideas kế thừa quyền truy cập của Room. Nếu room là private, chỉ hiện ideas cho creator, shared users, và admin.
- **Response:** `{ items: IdeaObject[], total, page, limit }`

### 6.2 POST `/ideas` — Tạo ý tưởng mới 🔒
- **Status**: 201 Created
- **Privacy**: Trả về 403 nếu room là private và user không có quyền truy cập.

**Request Body:**
```json
{
  "room_id": "uuid (bắt buộc)",
  "title": "string (3-255 ký tự, bắt buộc)",
  "description": "JSON (TipTap, bắt buộc)",
  "summary": "string (tối đa 500 ký tự, tùy chọn)"
}
```

**Response:** IdeaObject

### 6.3 GET `/ideas/{idea_id}` — Chi tiết ý tưởng 🔒
- **Status**: 200 OK
- **Response:** IdeaObject

### 6.4 PATCH `/ideas/{idea_id}` — Cập nhật ý tưởng 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "title": "string (3-255 ký tự)",
  "description": "JSON (TipTap)",
  "summary": "string",
  "status": "draft | refining | reviewing | submitted | closed",
  "is_pinned": "boolean (chỉ Admin)"
}
```

> **Status workflow**: draft → refining → reviewing → submitted | closed. Board view cho phép kéo thả tự do giữa các status (trừ terminal).

**Response:** IdeaObject

### 6.5 DELETE `/ideas/{idea_id}` — Xóa ý tưởng 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 204 No Content

---

## 7. VOTES (`/ideas/{idea_id}/votes`)

### VoteObject
```json
{
  "id": "uuid",
  "idea_id": "uuid",
  "user_id": "uuid",
  "stars": 1-5,
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

### 7.1 POST `/ideas/{idea_id}/votes` — Vote cho ý tưởng 🔒
- **Status**: 201 Created
- **Logic**: Nếu user đã vote → cập nhật vote hiện có. Chưa vote → tạo mới.

**Request Body:**
```json
{
  "stars": "integer (1-5, bắt buộc)"
}
```

**Response:** VoteObject

### 7.2 DELETE `/ideas/{idea_id}/votes` — Xóa vote 🔒
- **Status**: 204 No Content

---

## 8. COMMENTS (`/comments`)

### CommentObject
```json
{
  "id": "uuid",
  "target_id": "uuid",
  "target_type": "problem | idea",
  "content": "string",
  "author_id": "uuid",
  "author": { → UserObject },
  "parent_id": "uuid | null",
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

### 8.1 GET `/comments` — Danh sách comments 🔒
- **Status**: 200 OK
- **Query**: `?target_id=uuid&target_type=problem|idea&page=1&limit=20`
- **Response:** `{ items: CommentObject[], total, page, limit }`

### 8.2 POST `/comments` — Tạo comment mới 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "target_id": "uuid (bắt buộc)",
  "target_type": "problem | idea (bắt buộc)",
  "content": "string (1-5000 ký tự, bắt buộc)",
  "parent_id": "uuid (tùy chọn - reply comment)"
}
```

**Response:** CommentObject

### 8.3 PATCH `/comments/{comment_id}` — Sửa comment 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 200 OK

**Request Body:**
```json
{
  "content": "string (1-5000 ký tự, bắt buộc)"
}
```

**Response:** CommentObject

### 8.4 DELETE `/comments/{comment_id}` — Xóa comment 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 204 No Content

---

## 9. DASHBOARD (`/dashboard`)

### 9.1 GET `/dashboard/stats` — Thống kê tổng quan 🔒
- **Status**: 200 OK
- **Query**: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` (cả 2 đều tùy chọn)

> **Logic**: Lọc theo khoảng thời gian tùy ý. `date_from` inclusive, `date_to` inclusive. Không truyền = xem tất cả.

**Response:**
```json
{
  "total_problems": 0,
  "total_ideas": 0,
  "total_comments": 0,
  "total_rooms": 0,
  "interaction_rate": 0.0,
  "resolved_problems": 0,
  "problems_by_status": {
    "open": 0,
    "discussing": 0,
    "brainstorming": 0,
    "solved": 0,
    "closed": 0
  },
  "ideas_by_status": {
    "draft": 0,
    "refining": 0,
    "reviewing": 0,
    "submitted": 0,
    "closed": 0
  }
}
```

### 9.2 GET `/dashboard/top-contributors` — Bảng xếp hạng 🔒
- **Status**: 200 OK
- **Query**: `?limit=10&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

**Response:**
```json
[
  {
    "user": { → UserObject },
    "problems_count": 0,
    "ideas_count": 0,
    "votes_received": 0
  }
]
```

### 9.3 GET `/dashboard/recent-problems` — Vấn đề gần đây 🔒
- **Status**: 200 OK
- **Query**: `?limit=5`
- **Response:** `ProblemObject[]`

### 9.4 GET `/dashboard/recent-ideas` — Ý tưởng gần đây 🔒
- **Status**: 200 OK
- **Query**: `?limit=5`
- **Response:** `IdeaObject[]`

---

## 10. NOTIFICATIONS (`/notifications`)

### 10.1 GET `/notifications` — Danh sách thông báo 🔒
- **Status**: 200 OK
- **Query**: `?page=1&limit=5&unread_only=false`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "actor_id": "uuid",
      "actor": {
        "id": "uuid",
        "username": "string",
        "full_name": "string | null",
        "avatar_url": "string | null"
      },
      "type": "comment_added | reaction_added | vote_added | status_changed",
      "target_id": "uuid",
      "target_type": "problem | idea",
      "target_title": "string",
      "action_detail": "string | null  ← Chi tiết hành động (nội dung comment, loại reaction, số sao vote, status change)",
      "is_read": false,
      "created_at": "datetime"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 5,
  "unread_count": 0
}
```

### action_detail theo từng loại notification

| Type | action_detail | Ví dụ | Giới hạn |
|------|--------------|-------|----------|
| `comment_added` | Nội dung comment (truncate) | "Mình nghĩ nên dùng form online..." | Tối đa 100 ký tự |
| `reaction_added` | Loại reaction | "like", "dislike", "insight" | - |
| `vote_added` | Số sao (1-5) | "5" | - |
| `status_changed` | Status cũ → mới | "open → brainstorming" | - |

### 10.2 GET `/notifications/unread-count` — Số thông báo chưa đọc 🔒
- **Status**: 200 OK

**Response:**
```json
{ "count": 0 }
```

### 10.3 PATCH `/notifications/{id}/read` — Đánh dấu đã đọc 🔒
- **Status**: 200 OK

**Response:**
```json
{ "success": true }
```

### 10.4 PATCH `/notifications/read-all` — Đánh dấu tất cả đã đọc 🔒
- **Status**: 200 OK

**Response:**
```json
{ "updated": 0 }
```

**Notification triggers:**
| Hành động | Type | Target |
|-----------|------|--------|
| Comment mới | comment_added | problem/idea |
| Reaction mới | reaction_added | problem/idea |
| Vote mới | vote_added | idea |
| Đổi trạng thái | status_changed | problem/idea |

Recipients: Owner của target + tất cả users đã tương tác (comment/reaction/vote), trừ actor.

---

## 11. PHÂN QUYỀN TỔNG HỢP

| Endpoint | Member | Admin |
|----------|--------|-------|
| POST /auth/register | ✅ | ✅ |
| GET /problems | ✅ | ✅ |
| POST /problems | ✅ | ✅ |
| PATCH /problems/{id} | Chỉ bài mình | ✅ Tất cả |
| DELETE /problems/{id} | Chỉ bài mình | ✅ Tất cả |
| POST /rooms | ✅ | ✅ |
| PATCH /rooms/{id} | Chỉ phòng mình tạo | ✅ Tất cả |
| POST /ideas | ✅ | ✅ |
| PATCH /ideas/{id} | Chỉ idea mình | ✅ Tất cả |
| PATCH /ideas/{id} (is_pinned) | ❌ | ✅ |
| DELETE /ideas/{id} | Chỉ idea mình | ✅ Tất cả |
| POST /ideas/{id}/votes | ✅ | ✅ |
| POST /comments | ✅ | ✅ |
| PATCH /comments/{id} | Chỉ comment mình | ✅ Tất cả |
| DELETE /comments/{id} | Chỉ comment mình | ✅ Tất cả |
| GET /dashboard/* | ✅ | ✅ |
| GET /notifications | ✅ (chỉ của mình) | ✅ (chỉ của mình) |
| PATCH /notifications/{id}/read | ✅ (chỉ của mình) | ✅ (chỉ của mình) |
| PATCH /notifications/read-all | ✅ | ✅ |
| GET /users | ✅ | ✅ |
| PATCH /users/{id} | ❌ | ✅ |
| DELETE /users/{id} | ❌ | ✅ |
| POST /users/{id}/reset-password | ❌ | ✅ |
| GET /users/{id}/stats | ✅ | ✅ |

---

## 11. STATUS WORKFLOWS

### Problem Status
```
open → discussing → brainstorming → solved
  ↓         ↑              ↑      → closed
  └─────────┘──────────────┘
  (open có thể chuyển thẳng sang brainstorming)
  (solved và closed là 2 trạng thái terminal ngang hàng)
```

**Auto-transitions (hệ thống tự chuyển):**
| Từ | Sang | Trigger |
|----|------|---------|
| open | discussing | Khi có comment từ người khác (không phải author của problem) |
| open / discussing | brainstorming | Khi tạo brainstorm room liên kết với problem |

**Manual transitions (user/admin chuyển thủ công):**
| Từ | Sang | Ai được phép |
|----|------|-------------|
| brainstorming | solved | Author hoặc Admin |
| brainstorming | closed | Author hoặc Admin |

> **Lưu ý**:
> - `solved` và `closed` là 2 trạng thái terminal ngang hàng, không chuyển đổi qua lại.
> - `solved`: Problem đã có giải pháp. `closed`: Problem bị đóng/không giải quyết được.
> - Khi problem ở trạng thái `solved` hoặc `closed`, không thể tạo brainstorm room mới.
> - FE chỉ hiển thị các status hợp lệ trong dropdown. Các status tự động (discussing, brainstorming) không hiển thị.

### Idea Status
```
draft ↔ refining ↔ reviewing → submitted
                              → closed
(Board view cho phép kéo thả tự do giữa draft/refining/reviewing)
(submitted và closed là terminal status)
```

### Room Status
```
active → archived
```

---

## 12. BẢNG SO SÁNH: Contract vs Code hiện tại

### Backend cần thêm/sửa:
| Endpoint | Trạng thái | Ghi chú |
|----------|-----------|---------|
| POST /problems/{id}/reactions | ❌ THIẾU | Cần tạo mới |
| DELETE /problems/{id}/reactions | ❌ THIẾU | Cần tạo mới |
| POST /ideas/{id}/reactions | ❌ THIẾU | Cần tạo mới |
| DELETE /ideas/{id}/reactions | ❌ THIẾU | Cần tạo mới |
| PATCH /rooms/{id} | ❌ THIẾU | Cần tạo mới |
| POST /problems/{id}/rooms | ❌ THIẾU | Tạo room từ problem (1-click) |
| DELETE /ideas/{id} | ❌ THIẾU | Cần tạo mới |
| DELETE /ideas/{id}/votes | ❌ THIẾU | Cần tạo mới |
| PUT /auth/password | ❌ THIẾU | Đổi mật khẩu |
| GET /dashboard/top-contributors | ❌ THIẾU | Cần tạo mới |
| GET /dashboard/recent-problems | ❌ THIẾU | Cần tạo mới |
| GET /dashboard/recent-ideas | ❌ THIẾU | Cần tạo mới |
| GET /dashboard/stats | ⚠️ SỬA | Interaction_rate, new_this_week đang hardcode = 0 |
| POST /auth/refresh | ⚠️ SỬA | Response trả user placeholder, cần fetch user thật |
| ProblemObject response | ⚠️ SỬA | Cần thêm author, counts (likes, comments,...) |
| IdeaObject response | ⚠️ SỬA | Cần thêm author, vote_avg, vote_count, comments_count |
| RoomObject response | ⚠️ SỬA | Cần thêm creator, idea_count, participant_count |

### Frontend cần sửa:
| API Call hiện tại | Cần đổi thành | Ghi chú |
|------------------|--------------|---------|
| POST /problems/{id}/reactions `{reaction_type}` | POST /problems/{id}/reactions `{type}` | Đổi field name |
| PUT /problems/{id} | PATCH /problems/{id} | Đổi method |
| POST /rooms/{id}/ideas | POST /ideas `{room_id}` | Đổi path, thêm room_id vào body |
| PUT /rooms/{id}/ideas/{ideaId} | PATCH /ideas/{ideaId} | Đổi path + method |
| POST /rooms/{id}/ideas/{id}/vote `{score}` | POST /ideas/{id}/votes `{stars}` | Đổi path + field name + range (1-5) |
| GET /rooms/{id}/ideas | GET /ideas?room_id={id} | Đổi path, dùng query param |
| ProblemStatus type | Thêm `discussing` | Thiếu trong frontend types |
| Room create `{linked_problem_id}` | `{problem_id}` | Đổi field name |
| Room response `facilitator` | `creator` | Đổi field name |
| Vote score 1-10 | stars 1-5 | Đổi range + field name |

---

## 13. PRIVACY RULES (Quy tắc quyền riêng tư)

### Nguyên tắc: Problem và Room độc lập, Idea kế thừa Room

```
Problem (visibility: public/private, shared_user_ids)  ← Độc lập
  └── Room (liên kết hoặc độc lập)  ← Độc lập, KHÔNG kế thừa từ Problem
       └── Idea  ← Kế thừa từ Room
```

### Quy tắc chi tiết

| Tạo tác | Quyền riêng tư | Mô tả |
|---------|----------------|-------|
| **Problem** | `visibility` + `shared_user_ids` riêng | Độc lập. Có thể là public hoặc private. |
| **Room** | `visibility` + `shared_user_ids` riêng | **Độc lập với Problem**, kể cả khi có liên kết (`problem_id`). Room có thể private dù Problem public, và ngược lại. |
| **Idea** | **Kế thừa từ Room** | Ý tưởng luôn kế thừa quyền từ Room chứa nó. Không có bảng quyền riêng. |

### Logic kiểm tra quyền

**Problem:**
- `public` → tất cả users đều thấy
- `private` → chỉ author, users trong `shared_user_ids`, và Admin thấy

**Room (có hoặc không có `problem_id`):**
- Luôn dùng `visibility` và `shared_user_ids` riêng của room
- `public` → tất cả users đều thấy (kể cả khi Problem liên kết là private)
- `private` → chỉ creator, users trong `shared_user_ids`, và Admin thấy (kể cả khi Problem liên kết là public)

**Idea:**
- Luôn kế thừa từ Room chứa nó
- Không có bảng quyền riêng

### Edge cases

| Tình huống | Kết quả |
|-----------|---------|
| Problem **private** + Room **public** | Room hiển thị cho tất cả users. Khi click vào linked Problem → 403 nếu user không có quyền xem Problem. |
| Problem **public** + Room **private** | Problem hiển thị cho tất cả users. Room chỉ hiển thị cho users được ủy quyền. |
| Tạo Room từ Problem private | User phải có quyền xem Problem để tạo Room. Room mặc định `public` nhưng có thể set riêng. |

### Auto-set private
- Khi `shared_user_ids` có giá trị và `visibility` là `public`, hệ thống tự động chuyển thành `private`
- Áp dụng cho cả Problem và Room

### Admin bypass
- Admin (`role = "admin"`) luôn thấy tất cả nội dung bất kể visibility

### API Error responses
| Mã lỗi | Khi nào | Mô tả |
|--------|---------|-------|
| 403 | User không có quyền xem private content | `"You do not have permission to view this problem/room"` |
| 404 | Resource không tồn tại | `"Problem/Room not found"` |

---

## 14. EVENTS (`/events`) — Quản lý Sự kiện Đổi mới Sáng tạo

> **Context**: Module Event cho phép Admin tổ chức các cuộc thi/chương trình đổi mới sáng tạo nội bộ (ví dụ: "Agentic AI in Mobile"). Event hoạt động như một lớp overlay trên nền tảng hiện tại, tận dụng Problems/Rooms/Ideas có sẵn và bổ sung structured workflow cho competition.

### EventObject
```json
{
  "id": "uuid",
  "title": "string",
  "description": "JSON (TipTap content) | null",
  "introduction_type": "editor | embed",
  "embed_url": "string (URL) | null",
  "status": "draft | active | closed",
  "start_date": "date | null",
  "end_date": "date | null",
  "created_by": "uuid",
  "creator": { → UserObject },
  "team_count": 0,
  "idea_count": 0,
  "created_at": "datetime",
  "updated_at": "datetime | null",
  "closed_at": "datetime | null"
}
```

> **Note**:
> - `description`: TipTap JSON content, dùng khi `introduction_type = "editor"`
> - `embed_url`: URL của trang web ngoài, dùng khi `introduction_type = "embed"`
> - XOR logic: Chỉ được cung cấp 1 trong 2 (`description` hoặc `embed_url`). Nếu `embed` thì `description` phải null/empty, và ngược lại.
> - `status` workflow: `draft` → `active` → `closed`. Chỉ Admin mới tạo và quản lý Event.
> - Khi `closed`: Tất cả write APIs (submit idea, score, join team) trả về 403.

### 14.1 POST `/events` — Tạo sự kiện 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 201 Created

**Request Body:**
```json
{
  "title": "string (3-255 ký tự, bắt buộc)",
  "description": "JSON (TipTap content, tùy chọn — dùng khi introduction_type = editor)",
  "embed_url": "string (URL hợp lệ, tùy chọn — dùng khi introduction_type = embed)",
  "introduction_type": "editor | embed (mặc định: editor)",
  "status": "draft | active (mặc định: draft)",
  "start_date": "date (tùy chọn)",
  "end_date": "date (tùy chọn)"
}
```

> **Validation**: Nếu `introduction_type = "embed"` thì `embed_url` bắt buộc. Nếu `editor` thì `description` có thể null/empty.

**Response:** EventObject

### 14.2 GET `/events` — Danh sách sự kiện 🔒
- **Status**: 200 OK
- **Query**: `?status=draft|active|closed&page=1&limit=20`
- **Response:** `{ items: EventObject[], total, page, limit }`

### 14.3 GET `/events/{event_id}` — Chi tiết sự kiện 🔒
- **Status**: 200 OK
- **Response:** EventObject

### 14.4 PATCH `/events/{event_id}` — Cập nhật sự kiện 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 200 OK
- **Condition**: Chỉ cập nhật khi `status != closed`

**Request Body (tất cả tùy chọn):**
```json
{
  "title": "string (3-255 ký tự)",
  "description": "JSON (TipTap content)",
  "embed_url": "string (URL)",
  "introduction_type": "editor | embed",
  "status": "draft | active",
  "start_date": "date",
  "end_date": "date"
}
```

**Response:** EventObject

### 14.5 PATCH `/events/{event_id}/close` — Đóng sự kiện 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 200 OK
- **Logic**: Chuyển status sang `closed`, set `closed_at = now()`. Từ thời điểm này, tất cả write APIs cho event này trả về 403.

**Response:** EventObject

---

## 15. EVENT TEAMS (`/events/{event_id}/teams`) — Quản lý Đội

### EventTeamObject
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "name": "string",
  "slogan": "string | null",
  "leader_id": "uuid",
  "leader": { → UserObject },
  "assigned_to_team_id": "uuid | null",
  "assigned_to_team": { "id": "uuid", "name": "string" } | null,
  "member_count": 0,
  "idea_count": 0,
  "created_at": "datetime"
}
```

> **Note**: `assigned_to_team_id` là team mà team này được giao chấm điểm. Ví dụ: Team A có `assigned_to_team_id = Team B` nghĩa là Team A chấm Team B.

### EventTeamMemberObject
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "user_id": "uuid",
  "user": { → UserObject },
  "status": "pending | active",
  "joined_at": "datetime"
}
```

### Database Schema
```sql
event_teams: id, event_id, name, slogan, leader_id, assigned_to_team_id (nullable), created_at
event_team_members: id, team_id, user_id, status (pending|active), joined_at
-- Constraint: UNIQUE(user_id, event_id) — 1 user chỉ thuộc 1 team/event
```

### 15.1 POST `/events/{event_id}/teams` — Tạo đội 🔒
- **Status**: 201 Created
- **Condition**: Event phải `active`. User chưa thuộc team nào trong event này.
- **Logic**: Creator tự động trở thành Team Lead (`leader_id`). Tự động thêm vào `event_team_members` với `status = active`.

**Request Body:**
```json
{
  "name": "string (2-100 ký tự, bắt buộc)",
  "slogan": "string (tối đa 255 ký tự, tùy chọn)"
}
```

**Response:** EventTeamObject

### 15.2 GET `/events/{event_id}/teams` — Danh sách đội 🔒
- **Status**: 200 OK
- **Response:** `{ items: EventTeamObject[], total, page, limit }`

### 15.3 POST `/events/{event_id}/teams/{team_id}/join` — Xin tham gia đội 🔒
- **Status**: 201 Created
- **Condition**: Event phải `active`. User chưa thuộc team nào trong event này.
- **Logic**: Tạo record trong `event_team_members` với `status = pending`. Team Lead nhận notification.

**Response:** EventTeamMemberObject

### 15.4 PATCH `/events/{event_id}/teams/{team_id}/members/{user_id}` — Duyệt/Từ chối 🔒
- **Quyền**: Team Lead
- **Status**: 200 OK

**Request Body:**
```json
{
  "status": "active | rejected (bắt buộc)"
}
```

**Response:** EventTeamMemberObject

### 15.5 DELETE `/events/{event_id}/teams/{team_id}` — Giải tán đội 🔒 (Team Lead only)
- **Quyền**: Team Lead (leader của team)
- **Status**: 204 No Content
- **Condition**: Event phải khác `closed`
- **Logic**: Cascade xóa tất cả members. Ideas đã submit vẫn giữ (không xóa).
- **Review assignment cleanup**: Nếu team này có `assigned_to_team_id` hoặc có team khác trỏ đến team này → clear các `assigned_to_team_id` liên quan, tạo notification cho Admin về việc assignment bị đứt cần gán lại.
- **Error**: 403 nếu không phải Team Lead hoặc event đã closed.

### 15.6 DELETE `/events/{event_id}/teams/{team_id}/members/me` — Rời đội 🔒
- **Quyền**: Member (không phải Team Lead)
- **Status**: 204 No Content
- **Condition**: Event phải `active`. Không cho phép nếu user là Team Lead (phải chuyển quyền hoặc giải tán).
- **Error**: 403 nếu user là Team Lead.

### 15.7 PATCH `/events/{event_id}/teams/{team_id}/transfer-lead` — Chuyển quyền Team Lead 🔒
- **Quyền**: Team Lead hiện tại
- **Status**: 200 OK
- **Condition**: Event phải `active`. `new_leader_id` phải là active member của cùng team.

**Request Body:**
```json
{
  "new_leader_id": "uuid (bắt buộc — phải là active member của team)"
}
```

> **Logic**: Current leader trở thành regular member. New leader được set làm `leader_id`. Nếu current leader muốn rời team sau khi chuyển, gọi tiếp 15.6.

**Response:** EventTeamObject

### 15.8 PATCH `/events/{event_id}/teams/{team_id}/assign-review` — Gán đội chấm điểm 🔒 (Admin only)
- **Quyền**: Admin
- **Status**: 200 OK

**Request Body:**
```json
{
  "target_team_id": "uuid (bắt buộc — team sẽ được team này chấm)"
}
```

> **Validation**: `target_team_id` phải thuộc cùng event, không được trùng với `team_id` (không tự chấm mình). Mỗi team chỉ được chấm bởi tối đa 1 team — nếu `target_team_id` đã có reviewer khác, trả về 422.
> **Ví dụ circular pattern 4 đội**: Team A→B, B→C, C→D, D→A (Admin gán thủ công từng pair).

**Response:** EventTeamObject

### 15.9 GET `/events/{event_id}/assignments` — Xem bảng gán chấm 🔒
- **Quyền**: Tất cả users
- **Status**: 200 OK

**Response:**
```json
{
  "assignments": [
    {
      "team": { "id": "uuid", "name": "string" },
      "reviews": { "id": "uuid", "name": "string" }
    }
  ]
}
```

---

## 16. EVENT IDEAS (`/events/{event_id}/ideas`) — Ý tưởng trong Sự kiện

### EventIdeaObject
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "team_id": "uuid",
  "team": { "id": "uuid", "name": "string", "slogan": "string | null" },
  "title": "string",
  "user_problem": "JSON (TipTap) | null",
  "user_scenarios": "JSON (TipTap) | null",
  "user_expectation": "JSON (TipTap) | null",
  "research": "JSON (TipTap) | null",
  "solution": "JSON (TipTap)",
  "source_type": "manual | linked",
  "source_problem_id": "uuid | null",
  "source_room_id": "uuid | null",
  "source_idea_id": "uuid | null",
  "author_id": "uuid",
  "author": { → UserObject },
  "total_score": 0.0,
  "score_count": 0,
  "can_score": false,
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

> **Note**:
> - `source_type = "manual"`: Tạo trực tiếp trong Event. Các field `source_*` đều null.
> - `source_type = "linked"`: Copy từ Brainstorming Room. Lưu traceability qua `source_*` fields.
> - **Decoupled**: Event Idea là bản copy độc lập. Thay đổi trong Room/Problem gốc KHÔNG ảnh hưởng Event Idea.
> - `can_score`: `true` nếu user là Team Lead của team được gán chấm team sở hữu idea này. Backend tự động tính dựa trên `assigned_to_team_id` của user's team so với `team_id` của idea.
> - `total_score`: Tổng điểm (= sum(score × weight)). `null` nếu chưa được chấm. Public — mọi user trong event đều thấy.
> - `score_count`: Số lượng đội đã chấm. Public — hiển thị cho tất cả user.
> - Nội dung các field TipTap (user_problem, user_scenarios, etc.) lưu dưới dạng JSON.

### Database Schema
```sql
event_ideas: id, event_id, team_id, title, user_problem (JSONB), user_scenarios (JSONB),
  user_expectation (JSONB), research (JSONB), solution (JSONB, required),
  source_type (manual|linked), source_problem_id (nullable), source_room_id (nullable),
  source_idea_id (nullable), author_id, created_at, updated_at
```

### 16.1 POST `/events/{event_id}/ideas` — Tạo ý tưởng (Manual) 🔒
- **Status**: 201 Created
- **Condition**: Event phải `active`. User phải thuộc 1 team trong event (auto-fill `team_id`).

**Request Body:**
```json
{
  "title": "string (3-255 ký tự, bắt buộc)",
  "user_problem": "JSON (TipTap, tùy chọn)",
  "user_scenarios": "JSON (TipTap, tùy chọn)",
  "user_expectation": "JSON (TipTap, tùy chọn)",
  "research": "JSON (TipTap, tùy chọn)",
  "solution": "JSON (TipTap, bắt buộc)",
  "source_type": "manual (mặc định)"
}
```

**Response:** EventIdeaObject

### 16.2 POST `/events/{event_id}/ideas/from-room` — Tạo ý tưởng (từ Room) 🔒
- **Status**: 201 Created
- **Condition**: Event phải `active`. User phải thuộc 1 team trong event. User phải có quyền xem Room và Idea.

**Request Body:**
```json
{
  "room_id": "uuid (bắt buộc)",
  "idea_id": "uuid (bắt buộc)"
}
```

> **Copy Logic**:
> - `idea.description` → `solution`
> - `problem.content` (từ room's linked problem, nếu có) → `user_problem`
> - `idea.summary` → `title` (nếu hợp lệ, ngược lại dùng `idea.title`)
> - `source_type = "linked"`, lưu `source_room_id`, `source_idea_id`, `source_problem_id`
> - Tạo bản ghi độc lập (decoupled). User có thể chỉnh sửa trước khi submit chính thức.

**Response:** EventIdeaObject (cho phép FE redirect đến edit form)

### 16.3 GET `/events/{event_id}/ideas` — Danh sách ý tưởng 🔒
- **Status**: 200 OK
- **Query**: `?team_id=&sort=score|newest&page=1&limit=20`
- **Sort options**: `score` (total_score DESC, null last), `newest` (created_at DESC)
- **Response:** `{ items: EventIdeaObject[], total, page, limit }`

### 16.4 GET `/events/{event_id}/ideas/{idea_id}` — Chi tiết ý tưởng 🔒
- **Status**: 200 OK
- **Response:** EventIdeaObject (bao gồm `can_score` flag)

### 16.5 PATCH `/events/{event_id}/ideas/{idea_id}` — Cập nhật ý tưởng 🔒
- **Quyền**: Author hoặc Team Lead của team sở hữu idea
- **Status**: 200 OK
- **Condition**: Event phải `active`

**Request Body (tất cả tùy chọn):**
```json
{
  "title": "string (3-255 ký tự)",
  "user_problem": "JSON (TipTap)",
  "user_scenarios": "JSON (TipTap)",
  "user_expectation": "JSON (TipTap)",
  "research": "JSON (TipTap)",
  "solution": "JSON (TipTap)"
}
```

**Response:** EventIdeaObject

> **Comments**: Event Ideas hỗ trợ comments qua API `/comments` với `target_type='event_idea'`, `target_id=<idea_id>`. Xem section 7 (Comments) để biết chi tiết.

---

## 17. EVENT SCORING (`/events/{event_id}`) — Hệ thống Chấm điểm

> **Tiêu chí chấm điểm cố định**: 8 tiêu chí mặc định (4 Problem + 4 Solution), tự động tạo (auto-seed) khi event lần đầu được truy cập. Không thể tạo/sửa/xóa qua API.

### Cơ chế chấm điểm (5-point Likert Scale)

Mỗi tiêu chí được đánh giá trên thang điểm **5 mức độ đồng ý**:

| Mức độ | Điểm | Label |
|--------|------|-------|
| Strongly Agree | 12.5 | Hoàn toàn đồng ý |
| Agree | 10 | Đồng ý |
| Neutral | 7.5 | Trung lập |
| Disagree | 5 | Không đồng ý |
| Strongly Disagree | 2.5 | Hoàn toàn không đồng ý |

> **Max score per criteria = 12.5**. Tổng điểm tối đa = 8 × 12.5 = **100 điểm**.
> **Validation**: Score phải là 1 trong 5 giá trị: {2.5, 5, 7.5, 10, 12.5}.

### EventScoringCriteriaObject
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "group": "problem | solution",
  "name": "string (e.g., 'Unresolved Problem', 'Root Cause Analysis')",
  "description": "string | null",
  "weight": 1.0,
  "max_score": 12.5,
  "sort_order": 0,
  "created_at": "datetime"
}
```

> **Note**: `group` phân loại tiêu chí thành "problem" (nhóm đánh giá bài toán) hoặc "solution" (nhóm đánh giá giải pháp).

### EventScoreObject
```json
{
  "id": "uuid",
  "event_idea_id": "uuid",
  "scorer_team_id": "uuid",
  "scorer_team": { "id": "uuid", "name": "string" },
  "criteria_scores": { "criteria_id_1": 12.5, "criteria_id_2": 10 },
  "total_score": 0.0,
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

> **Calculation**: `total_score = Σ(score_i × weight_i)` cho tất cả criteria.

### Database Schema
```sql
event_scoring_criteria: id, event_id, group (varchar: problem|solution), name, description,
  weight (float, default 1.0), max_score (float, default 12.5), sort_order (int), created_at
event_scores: id, event_idea_id, scorer_team_id,
  criteria_scores (JSONB: {criteria_id: score}), total_score (float, calculated),
  created_at, updated_at
-- Constraint: UNIQUE(event_idea_id, scorer_team_id) — 1 đội chỉ chấm 1 lần/idea
```

### 17.1 GET `/events/{event_id}/criteria` — Xem tiêu chí
- **Status**: 200 OK
- **Auto-seed**: Nếu event chưa có criteria → tự động tạo 8 tiêu chí mặc định
- **Response:** `EventScoringCriteriaObject[]` (sorted by `group` ASC, `sort_order` ASC)

**8 Tiêu chí cố định:**

| # | Group | Name | Description | Weight | Max Score |
|---|-------|------|-------------|--------|-----------|
| 1 | problem | Unresolved Problem | Đây là một bài toán chưa có giải pháp hoặc giải pháp chưa triệt để? | 1.0 | 12.5 |
| 2 | problem | Root Cause Analysis | Tác giả đã tìm hiểu và phân tích được nguyên nhân gốc rễ của vấn đề? | 1.0 | 12.5 |
| 3 | problem | Problem Recognition | Đây là một bài toán có độ nhận diện cao, được nhắc nhiều trên báo đài hoặc tin tức? | 1.0 | 12.5 |
| 4 | problem | Gap Evidence | Có bằng chứng về việc bài toán chưa được giải quyết (gap analysis) từ các nguồn uy tín? | 1.0 | 12.5 |
| 5 | solution | Novelty | Ý tưởng của giải pháp thực sự mới lạ và chưa từng xuất hiện trong các giải pháp đã biết? | 1.0 | 12.5 |
| 6 | solution | Root Cause Resolution | Giải pháp có khả năng giải quyết được vấn đề gốc rễ một cách triệt để? | 1.0 | 12.5 |
| 7 | solution | Competitive Advantage | Giải pháp có những điểm khác biệt và ưu thế cạnh tranh so với các giải pháp hiện có? | 1.0 | 12.5 |
| 8 | solution | Technical Feasibility | Giải pháp khả thi về mặt kỹ thuật, có thể phát triển dựa trên công nghệ hiện tại hoặc tương lai gần? | 1.0 | 12.5 |

### 17.2 POST `/events/{event_id}/ideas/{idea_id}/scores` — Chấm điểm 🔒
- **Quyền**: Team Lead của team được gán chấm team sở hữu idea (`can_score = true`)
- **Status**: 201 Created
- **Condition**: Event phải `active`

**Request Body:**
```json
{
  "criteria_scores": {
    "criteria_id_1": 12.5,
    "criteria_id_2": 10,
    "criteria_id_3": 7.5,
    "criteria_id_4": 5
  }
}
```

> **Validation**:
> - Mỗi score phải ∈ {2.5, 5, 7.5, 10, 12.5} (5-point Likert scale)
> - Phải có đủ scores cho tất cả criteria của event
> - 1 đội chỉ chấm 1 lần cho mỗi idea

**Response:** EventScoreObject

### 17.3 PUT `/events/{event_id}/ideas/{idea_id}/scores` — Cập nhật điểm 🔒
- **Quyền**: Team Lead đã chấm (cùng điều kiện 17.3)
- **Status**: 200 OK
- **Condition**: Event phải `active`
- **Logic**: Replace toàn bộ `criteria_scores`. Recalculate `total_score`.

**Request Body:** Giống 17.3

**Response:** EventScoreObject

### 17.4 GET `/events/{event_id}/ideas/{idea_id}/scores` — Xem điểm 🔒
- **Status**: 200 OK

**Response:**
```json
{
  "idea_id": "uuid",
  "scores": [EventScoreObject],
  "summary": {
    "total_avg": 0.0,
    "criteria_avg": { "criteria_id": avg_score }
  }
}
```

---

## 18. EVENT FAQ (`/events/{event_id}/faqs`) — Hỏi Đáp

### FAQObject
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "question": "string",
  "answer": "JSON (TipTap) | null",
  "sort_order": 0,
  "created_by": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

> **Note**: `sort_order` control thứ tự hiển thị. Auto-set = MAX(sort_order) + 1 khi tạo mới nếu không truyền.

### 18.1 POST `/events/{event_id}/faqs` — Tạo FAQ 🔒
- **Quyền**: Admin hoặc Team Lead trong event
- **Status**: 201 Created

**Request Body:**
```json
{
  "question": "string (bắt buộc)",
  "answer": "JSON (TipTap, tùy chọn — có thể trả lời sau)",
  "sort_order": 0
}
```

**Response:** FAQObject

### 18.2 GET `/events/{event_id}/faqs` — Danh sách FAQ
- **Auth**: Không yêu cầu (public read)
- **Status**: 200 OK
- **Sort**: `sort_order` ASC, sau đó `created_at` ASC
- **Response:** `FAQObject[]`

### 18.3 PATCH `/events/{event_id}/faqs/{faq_id}` — Cập nhật FAQ 🔒
- **Quyền**: Admin hoặc author
- **Status**: 200 OK

**Request Body:**
```json
{
  "question": "string",
  "answer": "JSON (TipTap)",
  "sort_order": 0
}
```

**Response:** FAQObject

### 18.4 DELETE `/events/{event_id}/faqs/{faq_id}` — Xóa FAQ 🔒
- **Quyền**: Admin hoặc author
- **Status**: 204 No Content

---

## 19. EVENT DASHBOARD (`/events/{event_id}/dashboard`) — Thống kê Sự kiện

### 19.1 GET `/events/{event_id}/dashboard/ideas` — Bảng xếp hạng ý tưởng 🔒
- **Status**: 200 OK
- **Query**: `?team_id= (tùy chọn — lọc theo team)`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "team": { "id": "uuid", "name": "string" },
      "author": { → UserObject (tóm tắt) },
      "total_score": 0.0,
      "score_count": 0,
      "criteria_breakdown": { "criteria_name": avg_score },
      "created_at": "datetime"
    }
  ]
}
```

> **Sort**: `total_score` DESC. Ideas chưa chấm (null) xếp cuối.

### 19.2 GET `/events/{event_id}/dashboard/teams` — Bảng xếp hạng đội 🔒
- **Status**: 200 OK

**Response:**
```json
{
  "items": [
    {
      "team": { "id": "uuid", "name": "string", "slogan": "string | null" },
      "idea_count": 0,
      "avg_score": 0.0,
      "total_score": 0.0,
      "members": [{ → UserObject (tóm tắt) }]
    }
  ]
}
```

> **Sort**: `idea_count` DESC, sau đó `avg_score` DESC.

---

## 20. EVENT NOTIFICATIONS — Mở rộng hệ thống thông báo

### Notification Types mới

| Type | Trigger | Recipient |
|------|---------|-----------|
| `event_join_request` | User xin tham gia team | Team Lead của team |
| `event_join_approved` | Team Lead duyệt yêu cầu | User được duyệt |
| `event_join_rejected` | Team Lead từ chối yêu cầu | User bị từ chối |
| `event_idea_submitted` | Idea mới được submit trong event | Admin (+ tùy chọn: Team Leads khác) |
| `event_scored` | Team chấm điểm cho idea | Team Lead của team sở hữu idea |

### Notification detail format

| Type | action_detail | Ví dụ |
|------|--------------|-------|
| `event_join_request` | Team name | "Team Alpha" |
| `event_join_approved` | Team name | "Team Alpha" |
| `event_join_rejected` | Team name | "Team Alpha" |
| `event_idea_submitted` | Idea title | "Auto-approval cho nghỉ <1 ngày" |
| `event_scored` | Score summary | "35.5/40 từ Team Beta" |

> Sử dụng cấu trúc `notifications` table hiện tại với `target_type = "event"`, `target_id = event_id`.

---

## 21. EVENT PERMISSIONS — Phân quyền Sự kiện

### Event-level permissions

| Endpoint | Member | Team Lead | Admin |
|----------|--------|-----------|-------|
| POST /events | ❌ | ❌ | ✅ |
| GET /events | ✅ | ✅ | ✅ |
| PATCH /events/{id} | ❌ | ❌ | ✅ |
| PATCH /events/{id}/close | ❌ | ❌ | ✅ |
| POST /events/{id}/teams | ✅ (chưa có team) | ✅ | ✅ |
| POST /events/{id}/teams/{id}/join | ✅ (chưa có team) | ❌ (đã có) | ✅ |
| PATCH .../members/{uid} | ❌ | ✅ (team mình lead) | ✅ |
| DELETE .../teams/{id} | ❌ | ✅ (team mình lead) | ✅ |
| DELETE .../members/me | ✅ (không phải lead) | ❌ | ❌ |
| PATCH .../transfer-lead | ❌ | ✅ (current lead) | ✅ |
| PATCH .../assign-review | ❌ | ❌ | ✅ |
| GET .../assignments | ✅ | ✅ | ✅ |
| POST .../ideas (manual) | ✅ (có team) | ✅ | ✅ |
| POST .../ideas/from-room | ✅ (có team) | ✅ | ✅ |
| PATCH .../ideas/{id} | Author only | ✅ (team idea) | ✅ |
| POST .../criteria | ❌ | ❌ | ✅ |
| GET .../criteria | ✅ | ✅ | ✅ |
| POST .../scores | ❌ | ✅ (can_score=true) | ✅ |
| PUT .../scores | ❌ | ✅ (can_score=true) | ✅ |
| GET .../scores | ✅ | ✅ | ✅ |
| POST .../faqs | ❌ | ✅ | ✅ |
| GET .../faqs | ✅ (public) | ✅ | ✅ |
| PATCH .../faqs/{id} | Author | Author | ✅ |
| DELETE .../faqs/{id} | Author | Author | ✅ |
| GET .../dashboard/* | ✅ | ✅ | ✅ |

### Event Status Constraints

| Status | Submit Idea | Join/Leave Team | Score | Edit Idea |
|--------|------------|-----------------|-------|-----------|
| `draft` | ❌ | ❌ | ❌ | ❌ |
| `active` | ✅ | ✅ | ✅ | ✅ |
| `closed` | ❌ | ❌ | ❌ | ❌ |

### Team Lead role
- Không phải role hệ thống (user.role). Là role nội bộ event: `event_teams.leader_id = user_id`.
- User có thể là Member trong hệ thống nhưng là Team Lead trong 1 event.

---

## 22. EVENT IDEA STATUS WORKFLOW

Event Ideas không có status workflow phức tạp như Room Ideas. Lifecycle đơn giản:

```
Created (submitted) → Scored → Event Closed
```

- Khi Event `active`: Ideas có thể được tạo, chỉnh sửa, chấm điểm
- Khi Event `closed`: Tất cả trở thành read-only

> **Lưu ý**: Event Ideas KHÔNG liên quan đến Room Idea status (draft/refining/reviewing/submitted). Đây là 2 hệ thống hoàn toàn độc lập.

---

## 23. INTEGRATION: Event ↔ Existing System

### Luồng kết nối chính

```
Problem Feed          Idea Lab              Event
───────────          ────────              ─────
Problem ←──────── Room ←───── Idea ──────→ Event Idea
    │                  │                      │
    │    (1) Tạo Room  │   (2) Submit to      │
    │    từ Problem    │       Event           │
    │                  │                      │
    └──────────────────┴──────────────────────┘
    Mỗi module hoạt động độc lập.
    "Submit to Event" là bridge 1 chiều (copy, không live link).
```

### Brainstorming Room → Event Idea (1 chiều)

1. User click "Submit to Event" trên 1 Idea trong Room
2. FE hiện dropdown chọn Event đang active
3. FE gọi `POST /events/{event_id}/ideas/from-room`
4. Backend copy: `problem.content → user_problem`, `idea.description → solution`, `idea.summary → title`
5. FE redirect đến edit form cho user chỉnh sửa
6. User chỉnh sửa và save → Idea chính thức tham gia Event

> **Độc lập**: Sau khi copy, Event Idea hoàn toàn tách biệt. Thay đổi Room Idea KHÔNG ảnh hưởng Event Idea.

*Tài liệu này là nguồn sự thật duy nhất. Mọi thay đổi API phải cập nhật ở đây trước.*
