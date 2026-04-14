# AGENTS.md - Innovation Hub

This document provides essential information for AI coding agents working on the Innovation Hub project.

## Project Overview

**Innovation Hub** is an internal web platform for collecting problems and brainstorming ideas. It serves as a structured alternative to chaotic chat discussions, enabling teams to:

- Post and discuss problems with threaded comments
- Create brainstorming rooms with kanban boards and voting
- Track innovation metrics via dashboards with date range filtering
- Support bilingual interface (English and Vietnamese)

### Core Features

| Module | Description |
|--------|-------------|
| Problem Feed | Newsfeed-style posting of organizational challenges with reactions (👍 👎 💡) |
| Idea Lab | Brainstorming rooms with kanban board view for idea management |
| Dashboard | Statistics and top contributors tracking for OKR goals |
| Authentication | JWT-based auth with member/admin role separation |

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | React 18, TS 5.2 |
| **Build Tool** | Vite | 5.1.4 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **State Management** | Zustand | 4.5.2 |
| **Backend** | Python + FastAPI | Python 3.11, FastAPI 0.104 |
| **Database** | PostgreSQL | 16 |
| **ORM** | SQLAlchemy | 2.0 (async) |
| **Migrations** | Alembic | 1.12 |
| **Storage** | MinIO | Latest |
| **Deploy** | Docker Compose | - |

## Project Structure

```
innovation_hub/
├── backend/                    # FastAPI Backend (Clean Architecture)
│   ├── app/
│   │   ├── core/              # Configuration and exceptions
│   │   │   ├── config.py      # Pydantic settings (env vars)
│   │   │   └── exceptions.py  # Custom app exceptions
│   │   ├── domain/            # Business logic (no infra deps)
│   │   │   ├── entities/      # Domain entities (User, Problem, Room, Idea)
│   │   │   ├── repositories/  # Repository interfaces (abstract)
│   │   │   └── value_objects/ # Value objects (Email, Role, Status, Category)
│   │   ├── application/       # Application layer
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── services/      # Application services (JWT, notifications)
│   │   │   └── use_cases/     # Use case implementations
│   │   └── infrastructure/    # Infrastructure layer
│   │       ├── database/      # SQLAlchemy models, migrations, repo impls
│   │       ├── security/      # Password hashing, JWT handling
│   │       ├── storage/       # MinIO client
│   │       └── web/api/v1/    # FastAPI routes/endpoints
│   ├── scripts/               # Admin management utilities
│   ├── pyproject.toml         # Poetry dependencies
│   ├── alembic.ini            # Migration configuration
│   └── Dockerfile
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/               # API client (Axios) and endpoint modules
│   │   ├── components/        # React components
│   │   │   ├── common/        # Shared components (ProblemCard)
│   │   │   ├── layout/        # Layout components (Header, Sidebar, AuthGuard)
│   │   │   ├── ui/            # Base UI components (Button, Input, Modal)
│   │   │   └── notifications/ # Notification dropdown
│   │   ├── pages/             # Page components
│   │   │   ├── ProblemFeed/   # Problem listing and creation
│   │   │   ├── ProblemDetail/ # Single problem view
│   │   │   ├── IdeaLab/       # Room listing
│   │   │   ├── RoomDetail/    # Room with ideas (kanban/list view)
│   │   │   ├── IdeaDetail/    # Single idea view
│   │   │   ├── Dashboard/     # Statistics page
│   │   │   ├── Admin/         # User management
│   │   │   └── Settings/      # User profile settings
│   │   ├── stores/            # Zustand stores (auth, problems, notifications, UI)
│   │   ├── i18n/              # Internationalization (EN/VI)
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Constants and helper functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml         # Orchestrates all services
└── .env.example               # Environment template
```

## Architecture Patterns

### Backend - Clean Architecture

The backend follows **Clean Architecture** with clear separation of concerns:

1. **Domain Layer** (`app/domain/`): Pure business logic
   - Entities contain business rules (e.g., `Problem.can_transition_to()`)
   - No dependencies on frameworks or infrastructure
   - Repository interfaces define contracts

2. **Application Layer** (`app/application/`): Use cases and DTOs
   - Use cases orchestrate domain objects
   - DTOs define input/output contracts
   - Services for cross-cutting concerns (JWT, notifications)

3. **Infrastructure Layer** (`app/infrastructure/`): External concerns
   - Database models and repository implementations
   - API endpoints (FastAPI routers)
   - Security implementations
   - Storage clients

4. **Core** (`app/core/`): Configuration and shared utilities

### Frontend Architecture

- **Component-based**: Functional components with hooks
- **State Management**: Zustand for global state (auth, notifications)
- **API Layer**: Axios with interceptors for token refresh
- **Routing**: React Router v6 with protected routes via AuthGuard
- **Styling**: Tailwind CSS with custom component library
- **i18n**: react-i18next with English and Vietnamese support

## Build and Development Commands

### Full Stack (Docker Compose)

```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Backend Only

```bash
cd backend

# Install dependencies (requires Poetry)
poetry install

# Run development server
poetry run uvicorn app.main:app --reload

# Run migrations
poetry run alembic upgrade head

# Create new migration
poetry run alembic revision --autogenerate -m "description"

# Format code
poetry run black .
poetry run isort .

# Type checking
poetry run mypy .

# Run tests
poetry run pytest

# Create admin user
docker-compose exec api poetry run python scripts/create_admin.py
```

### Frontend Only

```bash
cd frontend

# Install dependencies
npm install

# Development server (with proxy to backend)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## API Conventions

See `API_CONTRACT.md` for the complete API specification (Single Source of Truth).

### Key Conventions

- **Base URL**: `/api/v1`
- **Authentication**: JWT Bearer tokens in `Authorization` header
- **Response Format**:
  - Single item: Direct object
  - List: `{ items: [...], total, page, limit }`
  - Error: `{ detail: "message" }`
- **HTTP Methods**:
  - `GET` - Retrieve
  - `POST` - Create
  - `PATCH` - Partial update
  - `DELETE` - Remove (returns 204)
- **IDs**: UUID v4
- **Timestamps**: ISO 8601 format

### Important API Contract Rules

> **CRITICAL**: When changing API behavior, update `API_CONTRACT.md` FIRST, then implement in backend and frontend.

The API Contract includes a comparison table showing what's implemented vs. what's missing. Check section 12 of `API_CONTRACT.md` before implementing new endpoints.

## Database Schema

### Main Entities

| Entity | Description |
|--------|-------------|
| `users` | User accounts with roles (member/admin) |
| `problems` | Problem posts in the feed |
| `rooms` | Brainstorming rooms linked to problems (optional) |
| `ideas` | Ideas within rooms with status workflow |
| `comments` | Threaded comments on problems and ideas |
| `reactions` | Like/dislike/insight reactions |
| `votes` | Star ratings (1-5) on ideas |
| `notifications` | User notification feed |

### Status Workflows

**Problem Status:**
```
open → discussing → brainstorming → solved
  ↓                                → closed
  └────────────────────────────────┘
```
- Auto-transitions: `open`→`discussing` (on comment), `discussing`→`brainstorming` (on room create)
- Manual transitions: To `solved` or `closed` (author/admin only)

**Idea Status:**
```
draft ↔ refining ↔ reviewing → submitted
                              → closed
```
- Board view allows drag-drop between non-terminal states

## Code Style Guidelines

### Python (Backend)

- **Formatter**: Black (line length 88)
- **Import Sorting**: isort (black profile)
- **Type Checking**: mypy (strict mode for new code)
- **Docstrings**: Google style
- **Naming**:
  - Classes: PascalCase
  - Functions/variables: snake_case
  - Constants: UPPER_SNAKE_CASE
  - Private: _leading_underscore

### TypeScript (Frontend)

- **Linter**: ESLint with TypeScript parser
- **Formatting**: Follow existing patterns
- **Naming**:
  - Components: PascalCase
  - Hooks: camelCase starting with `use`
  - Types/Interfaces: PascalCase
  - Constants: UPPER_SNAKE_CASE
- **Imports**: Use path aliases (`@/components`, `@/stores`)

## Testing Strategy

### Backend Tests

```bash
# Run all tests
cd backend && poetry run pytest

# Run with coverage
poetry run pytest --cov=app

# Run specific test file
poetry run pytest tests/test_problems.py
```

- **Framework**: pytest with pytest-asyncio
- **Location**: `backend/tests/` (create if not exists)
- **Types**: Unit tests for domain logic, integration tests for API endpoints

### Frontend Tests

- Current: No test suite configured
- Recommended: Vitest (aligns with Vite) or Jest
- Components to prioritize: AuthGuard, API client interceptors, form validations

## Security Considerations

### Authentication & Authorization

- JWT tokens: Access token (30 min), Refresh token (7 days)
- Password hashing: bcrypt with salt
- Role-based access control: `member` vs `admin`
- Permission checks:
  - Members: Can only modify their own content
  - Admins: Can modify all content and manage users

### Data Validation

- Backend: Pydantic models for all inputs
- Frontend: Zod schemas for form validation
- File uploads: Limited to images (PNG, JPEG, WebP), max 10MB

### Environment Variables

**Never commit these to git:**

| Variable | Location | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | `backend/.env` | JWT signing key |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection |
| `MINIO_SECRET_KEY` | `backend/.env` | Object storage credentials |

## Common Development Tasks

### Adding a New API Endpoint

1. Update `API_CONTRACT.md` with endpoint specification
2. Create/modify use case in `backend/app/application/use_cases/`
3. Add DTO in `backend/app/application/dto/`
4. Implement repository method if needed
5. Add endpoint in `backend/app/infrastructure/web/api/v1/endpoints/`
6. Register route in `backend/app/infrastructure/web/api/v1/router.py`
7. Add frontend API call in `frontend/src/api/`
8. Update frontend types in `frontend/src/types/index.ts`

### Adding a Database Migration

```bash
cd backend

# Generate migration from model changes
poetry run alembic revision --autogenerate -m "add_X_column"

# Review generated migration in app/infrastructure/database/migrations/versions/

# Apply migration
poetry run alembic upgrade head

# Downgrade if needed
poetry run alembic downgrade -1
```

### Adding i18n Translations

1. Add key to both `frontend/src/i18n/locales/en.json` and `vi.json`
2. Use in component: `const { t } = useTranslation(); t('key.subkey')`
3. Maintain consistent structure between languages

## Deployment

### Docker Compose Production

```bash
# Build and run
docker-compose -f docker-compose.yml up -d --build

# Check logs
docker-compose logs -f api
docker-compose logs -f frontend
```

### Service URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

## Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` in `backend/.env` uses `db` as host (Docker container name), not `localhost`
- Check PostgreSQL container is healthy: `docker-compose ps`

### Migration Failures

1. Check migration file syntax
2. Ensure model matches database state
3. For stuck migrations: `poetry run alembic stamp head` then recreate

### Frontend API Proxy Issues

- Vite dev server proxies `/api` to `localhost:8000`
- Ensure backend is running on port 8000
- For Docker, Nginx handles proxying in production

### MinIO Upload Issues

- Check MinIO container is running
- Verify bucket `avatars` exists (created automatically)
- Check `MINIO_ENDPOINT` uses container name (`minio:9000`) in Docker

## Documentation References

- `API_CONTRACT.md` - Complete API specification (SSOT)
- `APPLICATION_OVERVIEW.md` - Product requirements (in Vietnamese)
- `README.md` - Quick start guide
- Backend: Swagger UI at `/docs` when running

## Contact & Contributing

When making changes:
1. Follow existing code patterns
2. Update this document if conventions change
3. Ensure API contract is updated before implementation
4. Test both backend and frontend integration
