# Innovation Hub

Internal platform for collecting problems and brainstorming ideas.

## Features

- **Problem Feed** - Post and discuss problems with threaded comments
- **Idea Lab** - Brainstorming rooms with kanban board and voting
- **Dashboard** - Statistics with date range filtering
- **Authentication** - JWT-based auth with admin/member roles
- **i18n** - English and Vietnamese language support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Storage | MinIO (avatar uploads) |
| Deploy | Docker Compose |

## Quick Start

### 1. Clone and setup environment

```bash
git clone https://github.com/kpollz/innovation_hub.git
cd innovation_hub
```

Copy both env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

> **Important:** `backend/.env` is used by the API service. Make sure `DATABASE_URL` uses `db` as host (Docker container name), not `localhost`.

### 2. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

This starts 4 services: PostgreSQL, MinIO, Backend API, and Frontend (Nginx).

### 3. Access the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

> The frontend proxies `/api/` requests to the backend via Nginx, so everything works through `http://localhost:3000`.

### 4. Create admin user

```bash
# Run inside the API container
docker-compose exec api poetry run python scripts/create_admin.py

# Or with custom credentials
docker-compose exec api poetry run python scripts/create_admin.py \
  --username myadmin \
  --password mypassword123 \
  --email admin@company.com

# List existing admins
docker-compose exec api poetry run python scripts/create_admin.py --list
```

Default credentials: `admin` / `abc13579`

### 5. Register a regular user

Open http://localhost:3000 and click **Register** to create a member account.

## Environment Variables

### Root `.env` (Docker Compose)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | `innovation_user` | PostgreSQL username |
| `DB_PASSWORD` | `innovation_pass` | PostgreSQL password |
| `DB_NAME` | `innovation_hub` | Database name |
| `DB_PORT` | `5432` | PostgreSQL port |
| `API_PORT` | `8000` | Backend API port |
| `FRONTEND_PORT` | `3000` | Frontend port |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO root username |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | MinIO root password |

### `backend/.env` (API Application)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (use `db` as host in Docker) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `MINIO_ENDPOINT` | No | MinIO endpoint (default: `minio:9000`) |
| `LOG_LEVEL` | No | Logging level (default: `INFO`) |

## Project Structure

```
innovation_hub/
├── backend/                # FastAPI + Clean Architecture
│   ├── app/
│   │   ├── core/           # Config, exceptions
│   │   ├── domain/         # Entities, repository interfaces
│   │   ├── application/    # DTOs, services
│   │   └── infrastructure/ # Database, API routes, security
│   ├── scripts/            # Admin management scripts
│   ├── Dockerfile
│   └── .env.example
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state management
│   │   ├── i18n/           # Translations (EN/VI)
│   │   └── types/          # TypeScript types
│   ├── nginx.conf          # Nginx config with API proxy
│   └── Dockerfile
├── docker-compose.yml
├── API_CONTRACT.md         # API specification (source of truth)
├── APPLICATION_OVERVIEW.md # Product requirements
└── README.md
```

## API Endpoints

Full API documentation is available at http://localhost:8000/docs after starting the services.

See [API_CONTRACT.md](API_CONTRACT.md) for the complete API specification.

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/problems` | List problems |
| POST | `/api/v1/problems` | Create problem |
| GET | `/api/v1/rooms` | List brainstorming rooms |
| POST | `/api/v1/rooms` | Create room |
| GET | `/api/v1/ideas` | List ideas |
| POST | `/api/v1/ideas/{id}/votes` | Vote on idea (1-5 stars) |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |

## License

MIT
