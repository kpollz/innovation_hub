# 🏗️ System Architecture - Innovation Hub

## Tổng quan hệ thống

Innovation Hub là 3-tier architecture:
- **Frontend**: React SPA
- **Backend**: Node.js API Server
- **Database**: PostgreSQL

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Web Browser   │    │   Web Browser   │    │   Web Browser   │        │
│   │   (User A)      │    │   (User B)      │    │   (User C)      │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                          │
│                              HTTPS/WSS                                     │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVER LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        NGINX (Reverse Proxy)                         │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│   │  │  Static Files   │  │   API Routes    │  │  WebSocket      │     │   │
│   │  │  /static/*      │  │   /api/v1/*     │  │  /socket.io/*   │     │   │
│   │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │   │
│   └───────────┼────────────────────┼────────────────────┼──────────────┘   │
│               │                    │                    │                   │
│               │                    ▼                    │                   │
│               │         ┌─────────────────────┐         │                   │
│               │         │   Node.js Server    │         │                   │
│               │         │   (Express +        │◄────────┘                   │
│               │         │    Socket.io)       │                             │
│               │         └──────────┬──────────┘                             │
│               │                    │                                        │
│               │         ┌──────────┴──────────┐                             │
│               │         │   Express Routes    │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ Auth Routes   │  │                             │
│               │         │  │ /auth/*       │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ Problem Routes│  │                             │
│               │         │  │ /problems/*   │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ Room Routes   │  │                             │
│               │         │  │ /rooms/*      │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ Idea Routes   │  │                             │
│               │         │  │ /ideas/*      │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ Dashboard     │  │                             │
│               │         │  │ /dashboard/*  │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         └─────────────────────┘                             │
│               │                    │                                        │
│               │         ┌──────────┴──────────┐                             │
│               │         │   Middleware Stack  │                             │
│               │         │  ┌───────────────┐  │                             │
│               │         │  │ CORS          │  │                             │
│               │         │  │ Helmet        │  │                             │
│               │         │  │ Rate Limit    │  │                             │
│               │         │  │ JWT Auth      │  │                             │
│               │         │  │ Validation    │  │                             │
│               │         │  │ Error Handler │  │                             │
│               │         │  └───────────────┘  │                             │
│               │         └─────────────────────┘                             │
│               │                    │                                        │
│               └────────────────────┤                                        │
│                                    │                                        │
│                         ┌──────────┴──────────┐                             │
│                         │    Services Layer   │                             │
│                         │  ┌───────────────┐  │                             │
│                         │  │ AuthService   │  │                             │
│                         │  │ ProblemService│  │                             │
│                         │  │ RoomService   │  │                             │
│                         │  │ IdeaService   │  │                             │
│                         │  │ VoteService   │  │                             │
│                         │  │ CommentService│  │                             │
│                         │  │ NotifyService │  │                             │
│                         │  └───────────────┘  │                             │
│                         └─────────────────────┘                             │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      PostgreSQL Database                             │   │
│   │                                                                      │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│   │   │   users     │  │  problems   │  │    rooms    │                │   │
│   │   ├─────────────┤  ├─────────────┤  ├─────────────┤                │   │
│   │   │ id          │  │ id          │  │ id          │                │   │
│   │   │ username    │  │ title       │  │ name        │                │   │
│   │   │ password_   │  │ content     │  │ problem_id  │───┐            │   │
│   │   │ role        │  │ category    │  │ created_by  │   │            │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘   │            │   │
│   │                                                        │            │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │            │   │
│   │   │    ideas    │  │  comments   │  │   votes     │   │            │   │
│   │   ├─────────────┤  ├─────────────┤  ├─────────────┤   │            │   │
│   │   │ id          │  │ id          │  │ id          │   │            │   │
│   │   │ room_id     │◄─┤ target_id   │  │ idea_id     │   │            │   │
│   │   │ title       │  │ target_type │  │ user_id     │   │            │   │
│   │   │ status      │  │ content     │  │ stars       │   │            │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘   │            │   │
│   │                                                        │            │   │
│   │   ┌─────────────┐  ┌─────────────┐                     │            │   │
│   │   │  reactions  │  │ attachments │                     │            │   │
│   │   ├─────────────┤  ├─────────────┤                     │            │   │
│   │   │ id          │  │ id          │                     │            │   │
│   │   │ target_id   │  │ target_id   │                     │            │   │
│   │   │ type        │  │ file_path   │                     │            │   │
│   │   └─────────────┘  └─────────────┘                     │            │   │
│   │                                                        │            │   │
│   └────────────────────────────────────────────────────────┼────────────┘   │
│                                                            │                │
│                                                            ▼                │
│                                               ┌─────────────────────┐       │
│                                               │  File Storage       │       │
│                                               │  (Local/Cloud)      │       │
│                                               │  - Uploads          │       │
│                                               │  - Avatars          │       │
│                                               │  - Attachments      │       │
│                                               └─────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. User Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│ Client  │     │  Nginx   │     │  Express    │     │  Auth    │     │   DB     │
└────┬────┘     └────┬─────┘     └──────┬──────┘     └────┬─────┘     └────┬─────┘
     │               │                  │                 │                │
     │ POST /login   │                  │                 │                │
     │──────────────►│                  │                 │                │
     │               │   /api/v1/login  │                 │                │
     │               │─────────────────►│                 │                │
     │               │                  │  validate()     │                │
     │               │                  │────────────────►│                │
     │               │                  │                 │  SELECT user   │
     │               │                  │                 │───────────────►│
     │               │                  │                 │◄───────────────│
     │               │                  │                 │  compare hash  │
     │               │                  │                 │                │
     │               │                  │◄────────────────│                │
     │               │                  │  generate JWT   │                │
     │               │                  │                 │                │
     │               │◄─────────────────│  {token, user}  │                │
     │◄──────────────│                  │                 │                │
     │               │                  │                 │                │
```

### 2. Real-time Comment Flow (WebSocket)

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────────┐
│ User A  │     │  Server  │     │   User B    │     │   User C    │
└────┬────┘     └────┬─────┘     └──────┬──────┘     └──────┬──────┘
     │               │                  │                   │
     │  Add comment  │                  │                   │
     │──────────────►│                  │                   │
     │               │  Save to DB      │                   │
     │               │─────────┐        │                   │
     │               │◄────────┘        │                   │
     │  Success      │                  │                   │
     │◄──────────────│                  │                   │
     │               │  broadcast       │                   │
     │               │  'comment:new'   │                   │
     │               ├─────────────────►│                   │
     │               │  'comment:new'   │                   │
     │               ├─────────────────────────────────────►│
     │               │                  │                   │
```

### 3. Problem → Room → Idea Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Problem  │────►│  Room    │────►│   Idea   │
│  Feed    │     │  Lab     │     │  Cards   │
└──────────┘     └──────────┘     └──────────┘

1. User click "Brainstorm" trên Problem
2. System tạo Room mới với problem_id
3. Room hiển thị linked Problem banner
4. User tạo Idea trong Room
5. Idea hiển thị votes, comments
```

---

## 🛡️ Security Architecture

### 1. Authentication
- JWT tokens với expiration
- Refresh token rotation
- Secure httpOnly cookies (production)

### 2. Authorization
- Role-based access control (RBAC)
- Resource ownership check
- Admin privilege escalation

### 3. Input Validation
- Zod schemas cho API validation
- XSS protection via Helmet
- SQL injection protection (parameterized queries)

### 4. Rate Limiting
```
POST /auth/login     : 5 requests / 15 min
POST /api/*          : 100 requests / 15 min
WebSocket connection : 10 connections / IP
```

---

## ⚡ Performance Optimizations

### 1. Database
- Connection pooling (pg-pool)
- Query result caching (Redis)
- Proper indexing
- Pagination cho list APIs

### 2. API
- Response compression (gzip)
- ETag caching
- Nginx caching cho static files

### 3. Frontend
- Code splitting (lazy load routes)
- Virtual scrolling cho long lists
- Image optimization
- Service Worker cho offline support

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS / Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Docker Network                      │  │
│  │                                                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │  │
│  │  │   nginx    │  │   app      │  │   db       │      │  │
│  │  │  container │  │  container │  │  container │      │  │
│  │  │            │  │   Node.js  │  │ PostgreSQL │      │  │
│  │  │  Port 80   │  │            │  │            │      │  │
│  │  │  Port 443  │  │  Port 3000 │  │  Port 5432 │      │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘      │  │
│  │        │               │               │              │  │
│  │        └───────────────┴───────────────┘              │  │
│  │                    Internal Network                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Docker Compose / Kubernetes              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Docker Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| nginx | nginx:alpine | 80, 443 | Reverse proxy, SSL |
| app | node:18-alpine | 3000 | Node.js API server |
| db | postgres:15-alpine | 5432 | PostgreSQL database |
| redis | redis:alpine | 6379 | Caching (optional) |

---

## 📊 Monitoring & Logging

### 1. Application Logging
- Winston cho structured logging
- Log levels: error, warn, info, debug
- Log rotation

### 2. Error Tracking
- Sentry integration (production)
- Error alerting

### 3. Performance Monitoring
- Response time tracking
- Database query profiling
- Memory usage monitoring

---

## 🔌 External Services Integration

| Service | Purpose | Priority |
|---------|---------|----------|
| Email (SMTP/SendGrid) | Notifications | Medium |
| Cloud Storage (S3) | File attachments | Low |
| SSO (OAuth2/SAML) | Company auth | Future |
| Analytics (Plausible) | Usage tracking | Low |

---

## 📁 Project Structure (Backend)

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── server.ts
│   ├── controllers/      # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── problem.controller.ts
│   │   ├── room.controller.ts
│   │   ├── idea.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── problem.service.ts
│   │   └── ...
│   ├── models/           # Database models/queries
│   │   ├── user.model.ts
│   │   ├── problem.model.ts
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/           # Route definitions
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── ...
│   ├── socket/           # WebSocket handlers
│   │   └── index.ts
│   ├── utils/            # Utilities
│   │   ├── logger.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/                # Test files
├── migrations/           # Database migrations
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🎯 Technology Stack Summary

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | React 18 + TypeScript | Type-safe, ecosystem lớn |
| Styling | Tailwind CSS | Nhanh, customizable |
| State | Zustand | Đơn giản, không boilerplate |
| Backend | Node.js + Express | Async I/O, dễ real-time |
| Database | PostgreSQL | Reliable, ACID, JSON support |
| Real-time | Socket.io | Fallback tốt, room support |
| Auth | JWT | Stateless, phổ biến |
| Deploy | Docker | Consistent environments |

---

*Document version: 1.0*
*Created for: Innovation Hub Project*
