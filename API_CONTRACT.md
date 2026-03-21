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
- **Query**: `?page=1&limit=20&team=&role=`
- **Response:** `{ items: UserObject[], total, page, limit }`

### 2.4 GET `/users/{user_id}` — Chi tiết user 🔒
- **Status**: 200 OK
- **Response:** UserObject

---

## 3. PROBLEMS (`/problems`)

### ProblemObject
```json
{
  "id": "uuid",
  "title": "string",
  "summary": "string | null",
  "content": "string",
  "category": "process | technical | people | tools | patent",
  "status": "open | discussing | brainstorming | solved | closed",
  "author_id": "uuid",
  "author": { → UserObject },
  "room_id": "uuid | null  ← enriched: ID của room đầu tiên (backwards compat)",
  "rooms": "[{id, name, status}]  ← enriched: danh sách tất cả rooms liên kết với problem",
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
- **Query**: `?status=&category=&author_id=&search=&sort=newest&page=1&limit=20`
- **Sort options**: `newest`, `oldest`, `most_liked`, `most_commented`
- **Response:** `{ items: ProblemObject[], total, page, limit }`

### 3.2 POST `/problems` — Tạo vấn đề mới 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "title": "string (5-255 ký tự, bắt buộc)",
  "summary": "string (tối đa 500 ký tự, tùy chọn)",
  "content": "string (tối thiểu 10 ký tự, bắt buộc)",
  "category": "process | technical | people | tools | patent (bắt buộc)"
}
```

**Response:** ProblemObject

### 3.3 GET `/problems/{problem_id}` — Chi tiết vấn đề 🔒
- **Status**: 200 OK
- **Response:** ProblemObject

### 3.4 PATCH `/problems/{problem_id}` — Cập nhật vấn đề 🔒
- **Quyền**: Tác giả hoặc Admin
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "title": "string (5-255 ký tự)",
  "summary": "string (tối đa 500 ký tự)",
  "content": "string (tối thiểu 10 ký tự)",
  "category": "process | technical | people | tools | patent",
  "status": "open | discussing | brainstorming | solved | closed"
}
```

> **Lưu ý**: Status phải tuân theo workflow (chỉ tiến, không lùi). Xem chi tiết auto/manual transitions ở Section 11.
> - `discussing` và `brainstorming` được hệ thống tự chuyển (không cần gửi qua PATCH)
> - Qua PATCH chỉ nên chuyển: `solved`, `closed`
> - Admin có thể thay đổi status. Member chỉ có thể thay đổi status bài của mình.

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
  "created_at": "datetime",
  "updated_at": "datetime | null",
  "idea_count": 0,
  "participant_count": 0
}
```

### 5.1 GET `/rooms` — Danh sách phòng brainstorming 🔒
- **Status**: 200 OK
- **Query**: `?status=&problem_id=&search=&page=1&limit=20`
- **Response:** `{ items: RoomObject[], total, page, limit }`

### 5.2 POST `/rooms` — Tạo phòng mới (standalone) 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "name": "string (3-255 ký tự, bắt buộc)",
  "description": "string (tùy chọn)",
  "problem_id": "uuid (tùy chọn - liên kết với vấn đề)"
}
```

> **Logic khi có problem_id**: Tự động chuyển problem status sang `brainstorming`. 1 problem có thể liên kết với nhiều room.

**Response:** RoomObject

### 5.3 GET `/rooms/{room_id}` — Chi tiết phòng 🔒
- **Status**: 200 OK
- **Response:** RoomObject

### 5.4 PATCH `/rooms/{room_id}` — Cập nhật phòng 🔒
- **Quyền**: Người tạo hoặc Admin
- **Status**: 200 OK

**Request Body (tất cả tùy chọn):**
```json
{
  "name": "string",
  "description": "string",
  "status": "active | archived"
}
```

**Response:** RoomObject

### 5.5 DELETE `/rooms/{room_id}` — Xóa phòng 🔒
- **Quyền**: Người tạo hoặc Admin
- **Status**: 204 No Content
- **Error**: 404 Not Found, 403 Forbidden

### 5.6 POST `/problems/{problem_id}/rooms` — Tạo phòng từ vấn đề (1-click) 🔒
- **Status**: 201 Created
- **Error**: 400 Bad Request nếu problem đã ở trạng thái `solved` hoặc `closed`
- **Logic**: Tạo room với `problem_id` liên kết, chuyển problem status sang `brainstorming`. 1 problem có thể liên kết với nhiều room.

**Request Body:**
```json
{
  "name": "string (3-255 ký tự, bắt buộc)",
  "description": "string (tùy chọn)"
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
  "description": "string",
  "outcome": "string | null",
  "status": "draft | refining | ready | selected | rejected",
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
- **Response:** `{ items: IdeaObject[], total, page, limit }`

### 6.2 POST `/ideas` — Tạo ý tưởng mới 🔒
- **Status**: 201 Created

**Request Body:**
```json
{
  "room_id": "uuid (bắt buộc)",
  "title": "string (3-255 ký tự, bắt buộc)",
  "description": "string (tối thiểu 10 ký tự, bắt buộc)",
  "outcome": "string (tùy chọn)"
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
  "description": "string (tối thiểu 10 ký tự)",
  "outcome": "string",
  "status": "draft | refining | ready | selected | rejected",
  "is_pinned": "boolean (chỉ Admin)"
}
```

> **Status workflow**: draft → refining → ready → selected|rejected

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

**Response:**
```json
{
  "total_problems": 0,
  "total_ideas": 0,
  "total_comments": 0,
  "total_users": 0,
  "total_rooms": 0,
  "interaction_rate": 0.0,
  "new_this_week": 0,
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
    "ready": 0,
    "selected": 0,
    "rejected": 0
  }
}
```

### 9.2 GET `/dashboard/top-contributors` — Bảng xếp hạng 🔒
- **Status**: 200 OK
- **Query**: `?limit=10`

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

## 10. PHÂN QUYỀN TỔNG HỢP

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
| GET /users | ✅ | ✅ |

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
draft → refining → ready → selected
  ↓                  ↓
  rejected       rejected
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

*Tài liệu này là nguồn sự thật duy nhất. Mọi thay đổi API phải cập nhật ở đây trước.*
