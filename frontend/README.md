<div align="center">

# 🎨 Innovation Hub — Frontend

### React 18 + TypeScript + Tailwind CSS

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Cấu trúc dự án

```
src/
├── api/                    # API client functions
│   ├── auth.ts            # Đăng nhập, đăng ký, refresh
│   ├── client.ts          # Axios instance + interceptors
│   ├── comments.ts        # Threaded comments
│   ├── dashboard.ts       # Stats, trending, activity
│   ├── events.ts          # Events, teams, scoring
│   ├── ideas.ts           # Ideas CRUD, votes, pin
│   ├── notifications.ts   # Notification polling
│   ├── problems.ts        # Problems CRUD, reactions
│   ├── rooms.ts           # Rooms CRUD, privacy
│   ├── uploads.ts         # MinIO file uploads
│   └── users.ts           # Profile, settings
│
├── components/             # Shared UI components
│   ├── common/            # ProblemCard, IdeaCard, etc.
│   ├── feedback/          # Toast notifications
│   ├── layout/            # Header, Sidebar, MainLayout
│   └── ui/                # Button, Input, Card, Modal, etc.
│
├── i18n/                  # Internationalization
│   └── locales/           # en.json, vi.json
│
├── lib/                   # TipTap editor config
├── pages/                 # Page components
│   ├── Admin/             # User management, analytics
│   ├── Dashboard/         # User dashboard + admin analytics
│   ├── EventDetail/       # Event 6-tab (Intro, Teams, Ideas, Dashboard, FAQ, Awards)
│   ├── Events/            # Event listing
│   ├── Help/              # FAQ 7 categories
│   ├── Home/              # Landing page
│   ├── IdeaDetail/        # Idea detail + comments + voting
│   ├── IdeaLab/           # Room listing + Board/List view
│   ├── ProblemDetail/     # Problem detail + comments + reactions
│   ├── ProblemFeed/       # Problem feed with search & filter
│   ├── Settings/          # Profile, password, language
│   ├── Login/ & Register/ # Authentication
│   └── RoomDetail/        # Room detail + Kanban board
│
├── stores/                 # Zustand state management
│   ├── authStore.ts       # Auth state + JWT handling
│   ├── notificationStore.ts
│   ├── problemStore.ts
│   └── uiStore.ts
│
├── styles/                 # Global CSS + Tailwind
├── types/                  # TypeScript type definitions
└── utils/                  # Constants, helpers
```

---

## Tech Stack

| Công nghệ | Mục đích |
|:----------|:---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite 5** | Build tool, HMR |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **TipTap** | Rich text editor (ProseMirror) |
| **Recharts** | Charts & analytics |
| **Framer Motion** | Animations |
| **react-i18next** | Đa ngôn ngữ (VI/EN) |
| **Radix UI** | Accessible UI primitives |
| **React Hook Form + Zod** | Form handling & validation |
| **Axios** | HTTP client |
| **Lucide React** | Icons |
| **date-fns** | Date formatting |

---

## Tính năng

| Module | Chi tiết |
|:-------|:---------|
| **Auth** | Login/Register, JWT auto-refresh, Protected routes |
| **Problem Feed** | Tạo & chia sẻ, Rich text (TipTap), 5 categories, Search & filter, Reactions (👍👎💡), Threaded comments, Privacy (Public/Private + Share) |
| **Idea Lab** | Brainstorm Rooms, Kanban board kéo thả, Vote 1-5 sao, Ghim ý tưởng, Status workflow, Privacy độc lập |
| **Dashboard** | User: Stats, Trending Ideas, Recent Activity, Top Contributors · Admin: Analytics charts, Date filter, Status breakdowns |
| **Events** | 6 tabs (Intro, Teams, Ideas, Dashboard, FAQ, Awards), Teams + Join requests, Submit Idea (manual/from Room), Chấm điểm 8 criteria Likert 5-point |
| **Notifications** | Polling, 9 types, Click-to-navigate, Mark as read |
| **Settings** | Đổi mật khẩu, Upload avatar, Chọn ngôn ngữ (VI/EN) |
| **Help** | FAQ 7 danh mục, Tìm kiếm |
| **i18n** | Tiếng Việt + English, chuyển đổi tức thì |

---

## Quick Start

### Docker Compose (recommended)

```bash
# Từ root project
docker compose up --build -d
```

Truy cập: **http://localhost:3000**

### Chạy local (development)

```bash
cd frontend
npm install
npm run dev
```

Dev server: **http://localhost:5173** (cần Backend chạy riêng)

### Build production

```bash
npm run build
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3000/api/v1
```

> API requests đi qua Nginx proxy — không truy cập port 8000 trực tiếp.
