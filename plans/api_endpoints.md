# 🔌 API Endpoints - Innovation Hub

## Base URL
```
/api/v1
```

## Authentication
Tất cả endpoints (trừ login/register) yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## 📚 API Reference

### 1. Authentication (`/auth`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/auth/login` | Đăng nhập | `{username, password}` | `{token, user}` |
| POST | `/auth/register` | Đăng ký (Admin only) | `{username, password, role, team}` | `{user}` |
| POST | `/auth/logout` | Đăng xuất | - | `{message}` |
| GET | `/auth/me` | Lấy thông tin user hiện tại | - | `{user}` |
| PUT | `/auth/profile` | Cập nhật profile | `{full_name, email, avatar_url}` | `{user}` |
| PUT | `/auth/password` | Đổi mật khẩu | `{old_password, new_password}` | `{message}` |

---

### 2. Users (`/users`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/users` | Danh sách users | Query: `?team=&role=` | `{users[], pagination}` |
| GET | `/users/:id` | Chi tiết user | - | `{user}` |
| PUT | `/users/:id` | Cập nhật user (Admin) | `{role, team, is_active}` | `{user}` |
| DELETE | `/users/:id` | Xóa user (Admin) | - | `{message}` |
| GET | `/users/leaderboard` | Bảng xếp hạng contributors | Query: `?period=month|year` | `{users[]}` |

---

### 3. Problems (`/problems`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/problems` | Danh sách problems | Query: `?status=&category=&sort=&page=` | `{problems[], pagination}` |
| GET | `/problems/:id` | Chi tiết problem (kèm comments) | - | `{problem, comments[], author}` |
| POST | `/problems` | Tạo problem mới | `{title, content, category}` | `{problem}` |
| PUT | `/problems/:id` | Cập nhật problem | `{title, content, category, status}` | `{problem}` |
| DELETE | `/problems/:id` | Xóa problem | - | `{message}` |
| POST | `/problems/:id/comments` | Thêm comment | `{content, parent_id?}` | `{comment}` |
| GET | `/problems/:id/comments` | Lấy comments | - | `{comments[]}` |
| POST | `/problems/:id/react` | Thêm reaction | `{type: like/dislike/insight}` | `{reaction}` |
| DELETE | `/problems/:id/react` | Xóa reaction | - | `{message}` |

**Query Parameters cho GET /problems:**
- `status`: open, discussing, brainstorming, solved, closed
- `category`: process, technical, people, tools, patent
- `sort`: newest, popular, commented
- `search`: tìm kiếm theo title/content
- `author`: filter theo user_id

---

### 4. Rooms (`/rooms`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/rooms` | Danh sách rooms | Query: `?status=&sort=` | `{rooms[], pagination}` |
| GET | `/rooms/:id` | Chi tiết room (kèm ideas) | - | `{room, ideas[], linked_problem}` |
| POST | `/rooms` | Tạo room mới | `{name, description, problem_id?}` | `{room}` |
| PUT | `/rooms/:id` | Cập nhật room | `{name, description, status}` | `{room}` |
| DELETE | `/rooms/:id` | Xóa room | - | `{message}` |

**Tạo room từ problem (tích hợp):**
```
POST /problems/:id/create-room
Body: {name, description}
→ Tự động tạo room với problem_id = :id
```

---

### 5. Ideas (`/ideas`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/ideas` | Danh sách ideas | Query: `?room_id=&status=&sort=` | `{ideas[], pagination}` |
| GET | `/ideas/:id` | Chi tiết idea (kèm votes, comments) | - | `{idea, votes, comments[]}` |
| POST | `/ideas` | Tạo idea mới | `{room_id, title, description, outcome}` | `{idea}` |
| PUT | `/ideas/:id` | Cập nhật idea | `{title, description, outcome, status}` | `{idea}` |
| DELETE | `/ideas/:id` | Xóa idea | - | `{message}` |
| POST | `/ideas/:id/vote` | Vote sao | `{stars: 1-5}` | `{vote}` |
| PUT | `/ideas/:id/vote` | Cập nhật vote | `{stars: 1-5}` | `{vote}` |
| DELETE | `/ideas/:id/vote` | Xóa vote | - | `{message}` |
| POST | `/ideas/:id/pin` | Ghim/Unpin idea (Admin) | `{pinned: true/false}` | `{idea}` |
| POST | `/ideas/:id/comments` | Thêm comment | `{content, parent_id?}` | `{comment}` |
| GET | `/ideas/:id/comments` | Lấy comments | - | `{comments[]}` |
| POST | `/ideas/:id/react` | Thêm reaction | `{type: like/dislike/insight}` | `{reaction}` |
| DELETE | `/ideas/:id/react` | Xóa reaction | - | `{message}` |

**Query Parameters cho GET /ideas:**
- `room_id`: filter theo room
- `status`: draft, refining, ready, selected, rejected
- `sort`: newest, top_voted, commented
- `author`: filter theo user_id

---

### 6. Comments (`/comments`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/comments/:id` | Chi tiết comment (kèm replies) | - | `{comment, replies[]}` |
| PUT | `/comments/:id` | Cập nhật comment | `{content}` | `{comment}` |
| DELETE | `/comments/:id` | Xóa comment | - | `{message}` |

---

### 7. Dashboard & Analytics (`/dashboard`)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/dashboard/stats` | Thống kê tổng quan | Query: `?period=week|month|year` | `{stats}` |
| GET | `/dashboard/okr` | Tiến độ OKR | - | `{total_ideas, interaction_rate, pilot_count}` |
| GET | `/dashboard/pipeline` | Pipeline ý tưởng | - | `{status_counts[]}` |
| GET | `/dashboard/top-contributors` | Top ngưở đóng góp | Query: `?limit=10` | `{users[]}` |
| GET | `/dashboard/export` | Export dữ liệu | Query: `?format=csv|excel&start_date=&end_date=` | File download |

**Response cho /dashboard/stats:**
```json
{
  "total_problems": 45,
  "total_ideas": 67,
  "total_comments": 234,
  "interaction_rate": 0.72,
  "new_this_week": 5,
  "resolved_problems": 12
}
```

---

## 🔐 Phân quyền chi tiết

| Endpoint | Member | Admin |
|----------|--------|-------|
| GET /problems | ✅ | ✅ |
| POST /problems | ✅ | ✅ |
| PUT /problems/:id | Chỉ của mình | ✅ |
| DELETE /problems/:id | Chỉ của mình | ✅ |
| POST /problems/:id/pin | ❌ | ✅ |
| POST /rooms | ✅ | ✅ |
| PUT /rooms/:id/status | ❌ | ✅ |
| POST /ideas | ✅ | ✅ |
| PUT /ideas/:id/status | ❌ | ✅ |
| POST /ideas/:id/pin | ❌ | ✅ |
| GET /users | ❌ | ✅ |
| PUT /users/:id | ❌ | ✅ |
| POST /auth/register | ❌ | ✅ |
| GET /dashboard/export | ❌ | ✅ |

---

## 📊 Response Format chuẩn

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## 🚨 Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| UNAUTHORIZED | 401 | Chưa đăng nhập hoặc token hết hạn |
| FORBIDDEN | 403 | Không có quyền thực hiện |
| NOT_FOUND | 404 | Resource không tồn tại |
| VALIDATION_ERROR | 400 | Dữ liệu không hợp lệ |
| DUPLICATE_ENTRY | 409 | Dữ liệu đã tồn tại |
| INTERNAL_ERROR | 500 | Lỗi server |

---

## 🔄 Real-time Events (WebSocket)

Sử dụng Socket.io cho real-time updates:

| Event | Direction | Data |
|-------|-----------|------|
| `comment:new` | Server → Client | `{comment, target_id, target_type}` |
| `comment:updated` | Server → Client | `{comment}` |
| `comment:deleted` | Server → Client | `{comment_id}` |
| `reaction:updated` | Server → Client | `{target_id, target_type, reactions_count}` |
| `idea:voted` | Server → Client | `{idea_id, vote_avg, vote_count}` |
| `idea:status_changed` | Server → Client | `{idea_id, old_status, new_status}` |
| `problem:status_changed` | Server → Client | `{problem_id, old_status, new_status}` |

---

*Document version: 1.0*
*Created for: Innovation Hub Project*
