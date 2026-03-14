# Innovation Hub Backend

FastAPI-based backend for Innovation Hub - a platform for problem tracking and collaborative brainstorming.

## Architecture

This project follows **Clean Architecture** principles:

```
app/
├── domain/              # Business logic (entities, value objects, repository interfaces)
├── application/         # Use cases, DTOs, application services
├── infrastructure/      # Database, API routes, external services
├── core/               # Configuration and shared utilities
└── main.py             # FastAPI application entry point
```

## Tech Stack

- **Python 3.11+**
- **FastAPI** - Web framework
- **SQLAlchemy 2.0** - ORM with async support
- **PostgreSQL** - Primary database
- **Pydantic v2** - Data validation
- **dependency-injector** - Dependency injection
- **Alembic** - Database migrations
- **JWT** - Authentication

## Quick Start

### Prerequisites

- Python 3.11+
- Poetry
- Docker & Docker Compose (optional)

### Installation

1. **Clone and setup environment:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Install dependencies:**
```bash
poetry install
```

3. **Run with Docker Compose:**
```bash
docker-compose up -d
```

Or run locally:
```bash
# Start PostgreSQL manually
poetry run uvicorn app.main:app --reload
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Run Tests
```bash
poetry run pytest
```

### Database Migrations
```bash
# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

### Code Formatting
```bash
poetry run black .
poetry run isort .
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{id}` - Get user by ID
- `PATCH /api/v1/users/me` - Update current user

### Problems
- `GET /api/v1/problems` - List problems
- `POST /api/v1/problems` - Create problem
- `GET /api/v1/problems/{id}` - Get problem
- `PATCH /api/v1/problems/{id}` - Update problem
- `DELETE /api/v1/problems/{id}` - Delete problem

### Rooms
- `GET /api/v1/rooms` - List rooms
- `POST /api/v1/rooms` - Create room
- `GET /api/v1/rooms/{id}` - Get room

### Ideas
- `GET /api/v1/ideas` - List ideas
- `POST /api/v1/ideas` - Create idea
- `GET /api/v1/ideas/{id}` - Get idea
- `PATCH /api/v1/ideas/{id}` - Update idea
- `POST /api/v1/ideas/{id}/votes` - Vote on idea

### Comments
- `GET /api/v1/comments` - List comments
- `POST /api/v1/comments` - Create comment
- `PATCH /api/v1/comments/{id}` - Update comment
- `DELETE /api/v1/comments/{id}` - Delete comment
