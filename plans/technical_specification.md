# 📋 Technical Specification - Innovation Hub

**Version**: 1.0  
**Date**: 2026-03-14  
**Author**: Architect Mode  

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu
Xây dựng nền tảng web nội bộ để thu thập vấn đề và brainstorming ý tưởng, thay thế chat lung tung bằng quy trình có cấu trúc.

### 1.2 OKR Mapping
| KR | Mục tiêu | Feature hỗ trợ |
|----|----------|----------------|
| KR3.1 | 50 ý tưởng/năm | Idea Lab, Dashboard counting |
| KR3.2 | 70% tương tác | Comments, reactions, votes |
| KR3.3 | 20% thành pilot | Status workflow, Pipeline tracking |

### 1.3 Scope
- **In-scope**: Problem Feed, Idea Lab, Dashboard, Admin
- **Out-of-scope**: SSO integration (phase 2), Mobile app (future)

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1 High-Level Architecture

```
┌─────────────┐     HTTPS/WSS     ┌─────────────┐     SQL      ┌─────────────┐
│   React     │◄─────────────────►│  Node.js    │◄───────────►│ PostgreSQL  │
│  Frontend   │                   │   Backend   │            │  Database   │
└─────────────┘                   └─────────────┘            └─────────────┘
                                       │
                                       │ Socket.io
                                       ▼
                              ┌─────────────────┐
                              │  Real-time      │
                              │  Notifications  │
                              └─────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript | 18.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Backend | Node.js + Express | 18.x |
| Database | PostgreSQL | 15.x |
| Real-time | Socket.io | 4.x |
| Auth | JWT | - |
| Deploy | Docker | - |

---

## 3. DATABASE DESIGN

### 3.1 ERD Summary

**8 Core Tables:**
1. `users` - User accounts & profiles
2. `problems` - Problem posts in feed
3. `rooms` - Brainstorming rooms
4. `ideas` - Ideas within rooms
5. `comments` - Threaded comments (polymorphic)
6. `reactions` - Like/dislike/insight (polymorphic)
7. `votes` - Star ratings for ideas
8. `attachments` - File uploads (polymorphic)

### 3.2 Key Relationships
- User → Problems (1:N)
- User → Rooms (1:N)
- User → Ideas (1:N)
- Problem → Room (1:1, optional)
- Room → Ideas (1:N)
- Problem/Idea → Comments (1:N, polymorphic)
- Problem/Idea → Reactions (1:N, polymorphic)
- Idea → Votes (1:N)

### 3.3 Data Types
- **PK**: UUID (gen_random_uuid())
- **Timestamps**: TIMESTAMP WITH TIME ZONE
- **Status**: VARCHAR with CHECK constraints
- **Content**: TEXT (Markdown support)

---

## 4. API SPECIFICATION

### 4.1 Base URL
```
/api/v1
```

### 4.2 Authentication
JWT Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

### 4.3 Endpoint Groups

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Auth | POST /auth/login, /auth/register | Authentication |
| Users | GET/PUT/DELETE /users/:id | User management |
| Problems | CRUD /problems, /problems/:id/comments | Problem feed |
| Rooms | CRUD /rooms | Brainstorming rooms |
| Ideas | CRUD /ideas, /ideas/:id/vote | Idea management |
| Comments | /comments/:id | Threaded comments |
| Dashboard | /dashboard/* | Statistics & reports |

### 4.4 Response Format
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Project Structure
```
src/
├── api/           # API clients
├── components/    # Shared components
├── hooks/         # Custom hooks
├── stores/        # Zustand stores
├── pages/         # Page components
├── types/         # TypeScript types
└── utils/         # Utilities
```

### 5.2 State Management
- **Auth**: JWT token, user info
- **Problem**: List, filters, pagination
- **UI**: Sidebar, modals, toasts

### 5.3 Key Components
- `ProblemFeed` - List view with filters
- `ProblemDetail` - Detail with threaded comments
- `IdeaLab` - Kanban/List view toggle
- `RoomDetail` - Brainstorming space
- `Dashboard` - Statistics & OKR tracking

---

## 6. REAL-TIME FEATURES

### 6.1 WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `comment:new` | Server → Client | New comment posted |
| `comment:updated` | Server → Client | Comment edited |
| `comment:deleted` | Server → Client | Comment removed |
| `reaction:updated` | Server → Client | Reaction changed |
| `idea:voted` | Server → Client | New vote on idea |
| `idea:status_changed` | Server → Client | Idea status update |

### 6.2 Implementation
- Socket.io rooms per problem/idea
- Broadcasting to connected clients
- Optimistic updates on client

---

## 7. SECURITY

### 7.1 Authentication
- JWT access token (15 min expiry)
- Refresh token rotation
- Password hashing (bcrypt, 10 rounds)

### 7.2 Authorization
| Role | Permissions |
|------|-------------|
| member | Create posts, comment, vote, view dashboard |
| admin | All + user management, pin posts, export data |

### 7.3 Input Validation
- Zod schemas for all API inputs
- XSS protection (Helmet)
- SQL injection prevention (parameterized queries)

### 7.4 Rate Limiting
```
Login: 5 req / 15 min
API: 100 req / 15 min
WebSocket: 10 conn / IP
```

---

## 8. PERFORMANCE

### 8.1 Database
- Connection pooling
- Proper indexing
- Query pagination

### 8.2 API
- Response compression
- ETag caching
- Nginx static file caching

### 8.3 Frontend
- Code splitting
- Virtual scrolling
- Image optimization

---

## 9. DEPLOYMENT

### 9.1 Infrastructure
```
VPS/Cloud Server
├── Nginx (Reverse Proxy + SSL)
├── Node.js App (Docker)
└── PostgreSQL (Docker)
```

### 9.2 Docker Services
```yaml
services:
  nginx:    # Port 80, 443
  app:      # Port 3000
  db:       # Port 5432
```

### 9.3 Environment Variables
```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRY=
REFRESH_TOKEN_SECRET=
PORT=
NODE_ENV=
```

---

## 10. DEVELOPMENT ROADMAP

### Phase 1: Foundation (Week 1-2)
- [ ] Setup project structure
- [ ] Database setup & migrations
- [ ] Auth system (login/register)
- [ ] Basic API endpoints

### Phase 2: Core Features (Week 3-4)
- [ ] Problem Feed (CRUD + comments)
- [ ] Idea Lab (rooms + ideas)
- [ ] Voting & reactions
- [ ] Dashboard basics

### Phase 3: Polish (Week 5)
- [ ] Real-time comments (Socket.io)
- [ ] File uploads
- [ ] Admin features
- [ ] Export functionality

### Phase 4: Deploy (Week 6)
- [ ] Docker setup
- [ ] Production deployment
- [ ] Testing & bug fixes
- [ ] Documentation

---

## 11. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes | Medium | Keep migrations, avoid breaking changes |
| Performance issues | Medium | Indexes, pagination, caching |
| Security vulnerabilities | High | Input validation, rate limiting, audits |
| Scope creep | Medium | Clear MVP definition, prioritize OKR features |

---

## 12. DOCUMENTATION INDEX

| Document | Purpose |
|----------|---------|
| `APPLICATION_OVERVIEW.md` | Business requirements & user stories |
| `database_schema.md` | Database design & ERD |
| `api_endpoints.md` | API specification |
| `frontend_architecture.md` | Frontend component design |
| `system_architecture.md` | System architecture & deployment |
| `technical_specification.md` | This document - comprehensive spec |

---

*End of Technical Specification*
