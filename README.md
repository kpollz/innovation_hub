# Innovation Hub 🚀

Nền tảng thu thập vấn đề và brainstorming ý tưởng nội bộ

## Tính năng chính

- 📋 **Problem Feed** - Đăng và thảo luận vấn đề
- 💡 **Idea Lab** - Brainstorming với kanban board
- 📊 **Dashboard** - Thống kê và theo dõi OKR
- 🔐 **Authentication** - JWT-based auth

## Tech Stack

### Backend
- Python 3.11 + FastAPI
- PostgreSQL + SQLAlchemy 2.0 (async)
- Clean Architecture
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite + Tailwind CSS
- Zustand (state management)
- Axios

## Quick Start

### 1. Clone và setup

```bash
git clone https://github.com/kpollz/innovation_hub.git
cd innovation_hub

# Copy env file
cp .env.example .env
```

### 2. Chạy với Docker Compose (Recommended)

```bash
# Build và chạy tất cả services
docker-compose up --build

# Hoặc chạy ngầm
docker-compose up -d --build
```

### 3. Truy cập

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 4. Tạo admin user

**Cách 1: Chạy script trong container (Recommended)**

```bash
# Vào container backend
docker-compose exec api bash

# Chạy script tạo admin
poetry run python scripts/create_admin.py

# Hoặc với tham số tùy chỉnh
poetry run python scripts/create_admin.py --username myadmin --password mypassword123
```

**Cách 2: Chạy từ local (khi đã cài poetry)**

```bash
cd backend
poetry run python scripts/create_admin.py
```

**Cách 3: Dùng API (nếu đã có user thường)**

```bash
# Đăng ký user mới qua API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@company.com","role":"admin"}'
```

**Lưu ý:** Cách 3 chỉ hoạt động nếu backend cho phép set role=admin khi register. Nếu không, hãy dùng cách 1 hoặc 2.

## Development

### Chạy Backend dev

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

### Chạy Frontend dev

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
innovation_hub/
├── backend/          # FastAPI + Clean Architecture
├── frontend/         # React + TypeScript
├── plans/            # Architecture documentation
├── docker-compose.yml
└── README.md
```

## Architecture

![Clean Architecture](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

Project follows Clean Architecture principles with 3 layers:
- **Domain**: Business logic, entities, repository interfaces
- **Application**: Use cases, DTOs, application services
- **Infrastructure**: Database, API routes, external services

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh token

### Problems
- `GET /api/v1/problems` - Danh sách vấn đề
- `POST /api/v1/problems` - Tạo vấn đề mới
- `GET /api/v1/problems/{id}` - Chi tiết vấn đề

### Rooms & Ideas
- `GET /api/v1/rooms` - Danh sách phòng brainstorming
- `POST /api/v1/rooms` - Tạo phòng mới
- `GET /api/v1/ideas` - Danh sách ý tưởng
- `POST /api/v1/ideas/{id}/vote` - Vote ý tưởng

## License

MIT
