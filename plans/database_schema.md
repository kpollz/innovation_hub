# 🗄️ Database Schema - Innovation Hub

## Tổng quan

Database được thiết kế trên PostgreSQL, sử dụng quan hệ 1-N và N-M phù hợp với business logic.

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INNOVATION HUB DATABASE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│   │   users     │          │  problems   │          │    rooms    │         │
│   ├─────────────┤          ├─────────────┤          ├─────────────┤         │
│   │ id (PK)     │          │ id (PK)     │          │ id (PK)     │         │
│   │ username    │          │ title       │◄─────────│ problem_id  │         │
│   │ password_hash│         │ content     │          │ name        │         │
│   │ role        │          │ category    │          │ description │         │
│   │ team        │          │ status      │          │ created_by  │         │
│   │ avatar_url  │          │ author_id   │─────────►│ status      │         │
│   │ is_active   │          │ created_at  │          │ created_at  │         │
│   │ created_at  │          │ updated_at  │          │ updated_at  │         │
│   └──────┬──────┘          └──────┬──────┘          └──────┬──────┘         │
│          │                        │                        │                │
│          │                        │                        │                │
│          │                        │                        │                │
│   ┌──────┴──────┐          ┌──────┴──────┐          ┌──────┴──────┐         │
│   │   ideas     │          │  comments   │          │   votes     │         │
│   ├─────────────┤          ├─────────────┤          ├─────────────┤         │
│   │ id (PK)     │          │ id (PK)     │          │ id (PK)     │         │
│   │ room_id     │◄─────────│ target_id   │          │ idea_id     │         │
│   │ title       │          │ target_type │          │ user_id     │         │
│   │ description │          │ content     │          │ stars       │         │
│   │ outcome     │          │ author_id   │          │ created_at  │         │
│   │ status      │          │ parent_id   │          └─────────────┘         │
│   │ author_id   │          │ created_at  │                                 │
│   │ created_at  │          └─────────────┘                                 │
│   │ updated_at  │                                                         │
│   └─────────────┘                                                         │
│                                                                            │
│   ┌─────────────┐          ┌─────────────┐                                 │
│   │  reactions  │          │ attachments │                                 │
│   ├─────────────┤          ├─────────────┤                                 │
│   │ id (PK)     │          │ id (PK)     │                                 │
│   │ target_id   │          │ target_id   │                                 │
│   │ target_type │          │ target_type │                                 │
│   │ type        │          │ filename    │                                 │
│   │ user_id     │          │ file_path   │                                 │
│   │ created_at  │          │ file_type   │                                 │
│   └─────────────┘          │ created_at  │                                 │
│                            └─────────────┘                                 │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Chi tiết từng Table

### 1. users
Lưu thông tin ngưở dùng hệ thống

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| email | VARCHAR(100) | UNIQUE, NULL | Email liên hệ |
| full_name | VARCHAR(100) | NULL | Tên đầy đủ |
| role | VARCHAR(20) | DEFAULT 'member' | Vai trò: member, admin |
| team | VARCHAR(50) | NULL | Ban/Team thuộc về |
| avatar_url | VARCHAR(255) | NULL | URL ảnh đại diện |
| is_active | BOOLEAN | DEFAULT true | Trạng thái tài khoản |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

---

### 2. problems
Lưu các vấn đề đăng trong Problem Feed

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| title | VARCHAR(255) | NOT NULL | Tiêu đề vấn đề |
| content | TEXT | NOT NULL | Mô tả chi tiết (Markdown) |
| category | VARCHAR(50) | NOT NULL | Category: process, technical, people, tools, patent |
| status | VARCHAR(30) | DEFAULT 'open' | Trạng thái: open, discussing, brainstorming, solved, closed |
| author_id | UUID | FOREIGN KEY (users.id) | Ngưở đăng |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

**Status workflow:**
```
open → discussing → brainstorming → solved → closed
                ↘
                 (có thể chuyển thẳng sang brainstorming)
```

---

### 3. rooms
Lưu phòng brainstorming (Idea Lab)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| problem_id | UUID | FOREIGN KEY (problems.id), UNIQUE, NULL | Vấn đề liên kết (có thể null nếu tạo độc lập) |
| name | VARCHAR(255) | NOT NULL | Tên phòng |
| description | TEXT | NULL | Mô tả phòng |
| created_by | UUID | FOREIGN KEY (users.id) | Ngưở tạo phòng |
| status | VARCHAR(30) | DEFAULT 'active' | Trạng thái: active, archived |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

---

### 4. ideas
Lưu ý tưởng trong phòng brainstorming

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| room_id | UUID | FOREIGN KEY (rooms.id), NOT NULL | Phòng chứa ý tưởng |
| title | VARCHAR(255) | NOT NULL | Tiêu đề ý tưởng |
| description | TEXT | NOT NULL | Mô tả giải pháp |
| outcome | TEXT | NULL | Lợi ích mong đợi |
| status | VARCHAR(30) | DEFAULT 'draft' | Trạng thái: draft, refining, ready, selected, rejected |
| author_id | UUID | FOREIGN KEY (users.id) | Ngưở đề xuất |
| is_pinned | BOOLEAN | DEFAULT false | Có ghim lên đầu không |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

**Status workflow:**
```
draft → refining → ready → selected
   ↓                   ↓
rejected            (hoặc rejected)
```

---

### 5. comments
Lưu comment cho problems và ideas (threaded comments)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| target_id | UUID | NOT NULL | ID của problem hoặc idea |
| target_type | VARCHAR(20) | NOT NULL | Loại: 'problem', 'idea' |
| content | TEXT | NOT NULL | Nội dung comment |
| author_id | UUID | FOREIGN KEY (users.id) | Ngưở comment |
| parent_id | UUID | FOREIGN KEY (comments.id), NULL | Comment cha (null nếu là root) |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

**Threaded structure:**
```
Comment A (parent_id = null)
  └── Comment B (parent_id = A)
        └── Comment C (parent_id = B)
Comment D (parent_id = null)
```

---

### 6. reactions
Lưu reaction 👍 👎 💡 cho problems và ideas

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| target_id | UUID | NOT NULL | ID của problem hoặc idea |
| target_type | VARCHAR(20) | NOT NULL | Loại: 'problem', 'idea' |
| type | VARCHAR(20) | NOT NULL | Loại: 'like', 'dislike', 'insight' |
| user_id | UUID | FOREIGN KEY (users.id) | Ngưở reaction |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |

**Unique constraint:** (target_id, target_type, user_id) - mỗi ngưở chỉ reaction 1 lần

---

### 7. votes
Lưu vote sao (1-5) cho ideas

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| idea_id | UUID | FOREIGN KEY (ideas.id) | Idea được vote |
| user_id | UUID | FOREIGN KEY (users.id) | Ngưở vote |
| stars | INTEGER | CHECK (stars BETWEEN 1 AND 5) | Số sao: 1-5 |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Thờ gian cập nhật |

**Unique constraint:** (idea_id, user_id) - mỗi ngưở chỉ vote 1 lần/idea

---

### 8. attachments
Lưu file đính kèm cho problems và ideas

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | ID duy nhất |
| target_id | UUID | NOT NULL | ID của problem hoặc idea |
| target_type | VARCHAR(20) | NOT NULL | Loại: 'problem', 'idea' |
| filename | VARCHAR(255) | NOT NULL | Tên file gốc |
| file_path | VARCHAR(500) | NOT NULL | Đường dẫn lưu file |
| file_type | VARCHAR(50) | NULL | MIME type |
| file_size | INTEGER | NULL | Kích thước file (bytes) |
| created_at | TIMESTAMP | DEFAULT NOW() | Thờ gian tạo |

---

## 🔗 Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| users → problems | 1:N | 1 user đăng nhiều problems |
| users → rooms | 1:N | 1 user tạo nhiều rooms |
| users → ideas | 1:N | 1 user đề xuất nhiều ideas |
| users → comments | 1:N | 1 user viết nhiều comments |
| users → reactions | 1:N | 1 user tạo nhiều reactions |
| users → votes | 1:N | 1 user vote nhiều ideas |
| problems → rooms | 1:1 | 1 problem có 0-1 room |
| rooms → ideas | 1:N | 1 room chứa nhiều ideas |
| problems → comments | 1:N | 1 problem có nhiều comments |
| ideas → comments | 1:N | 1 idea có nhiều comments |
| problems → reactions | 1:N | 1 problem có nhiều reactions |
| ideas → reactions | 1:N | 1 idea có nhiều reactions |
| ideas → votes | 1:N | 1 idea có nhiều votes |
| comments → comments | 1:N | 1 comment có nhiều replies (threaded) |

---

## 📈 Indexes Recommendations

```sql
-- Tìm kiếm và filter nhanh
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_author ON problems(author_id);
CREATE INDEX idx_problems_created ON problems(created_at DESC);

CREATE INDEX idx_ideas_room ON ideas(room_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_author ON ideas(author_id);

CREATE INDEX idx_comments_target ON comments(target_id, target_type);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

CREATE INDEX idx_reactions_target ON reactions(target_id, target_type);
CREATE INDEX idx_votes_idea ON votes(idea_id);
```

---

## 🔄 Triggers

```sql
-- Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

*Document version: 1.0*
*Created for: Innovation Hub Project*
