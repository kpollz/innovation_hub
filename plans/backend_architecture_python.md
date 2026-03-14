# 🐍 Backend Architecture - Python FastAPI + Clean Architecture

**Version**: 1.0  
**Stack**: Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL, Pydantic v2

---

## 1. TỔNG QUAN CLEAN ARCHITECTURE

### Nguyên tắc Dependency Rule

```
                    ┌─────────────────────┐
                    │    PRESENTATION     │  ← FastAPI Routes, Controllers
                    │   (Interface Layer) │     Dependencies Injector
                    ├─────────────────────┤
                    │     APPLICATION     │  ← Use Cases, Application Services
                    │    (Use Case Layer) │     DTOs, Ports (Interfaces)
                    ├─────────────────────┤
                    │       DOMAIN        │  ← Entities, Value Objects
                    │   (Business Layer)  │     Domain Services, Rules
                    │         ▲           │
                    │    No dependencies  │     NO imports from outer layers
                    │    on outer layers  │
                    └─────────────────────┘
                              │
                    ┌─────────────────────┐
                    │    INFRASTRUCTURE   │  ← Database, External APIs
                    │  (Framework Layer)  │     Implements Domain Interfaces
                    └─────────────────────┘
```

**Quy tắc vàng**: Code trong inner layers KHÔNG ĐƯỢC import gì từ outer layers.

---

## 2. FOLDER STRUCTURE

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── container.py               # Dependency Injection container
│   │
│   ├── domain/                    # LAYER 1: DOMAIN (Core Business)
│   │   ├── __init__.py
│   │   ├── entities/              # Business entities
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── problem.py
│   │   │   ├── room.py
│   │   │   ├── idea.py
│   │   │   ├── comment.py
│   │   │   └── vote.py
│   │   ├── value_objects/         # Immutable value objects
│   │   │   ├── __init__.py
│   │   │   ├── email.py
│   │   │   ├── category.py
│   │   │   └── status.py
│   │   ├── repositories/          # Repository interfaces (ports)
│   │   │   ├── __init__.py
│   │   │   ├── user_repository.py
│   │   │   ├── problem_repository.py
│   │   │   ├── room_repository.py
│   │   │   ├── idea_repository.py
│   │   │   └── comment_repository.py
│   │   └── services/              # Domain services (complex business logic)
│   │       ├── __init__.py
│   │       └── notification_service.py
│   │
│   ├── application/               # LAYER 2: APPLICATION (Use Cases)
│   │   ├── __init__.py
│   │   ├── dto/                   # Data Transfer Objects
│   │   │   ├── __init__.py
│   │   │   ├── user_dto.py
│   │   │   ├── problem_dto.py
│   │   │   ├── room_dto.py
│   │   │   ├── idea_dto.py
│   │   │   └── common.py          # Pagination, filters
│   │   ├── use_cases/             # Use case implementations
│   │   │   ├── __init__.py
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── login.py
│   │   │   │   ├── register.py
│   │   │   │   └── refresh_token.py
│   │   │   ├── problem/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── create_problem.py
│   │   │   │   ├── update_problem.py
│   │   │   │   ├── list_problems.py
│   │   │   │   └── delete_problem.py
│   │   │   ├── room/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── create_room.py
│   │   │   │   └── list_rooms.py
│   │   │   ├── idea/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── create_idea.py
│   │   │   │   ├── vote_idea.py
│   │   │   │   └── update_idea_status.py
│   │   │   └── comment/
│   │   │       ├── __init__.py
│   │   │       ├── add_comment.py
│   │   │       └── delete_comment.py
│   │   └── services/              # Application services
│   │       ├── __init__.py
│   │       └── jwt_service.py
│   │
│   ├── infrastructure/            # LAYER 3: INFRASTRUCTURE
│   │   ├── __init__.py
│   │   ├── database/              # Database implementation
│   │   │   ├── __init__.py
│   │   │   ├── config.py          # DB connection settings
│   │   │   ├── session.py         # Async session manager
│   │   │   ├── models/            # SQLAlchemy ORM models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── user_model.py
│   │   │   │   ├── problem_model.py
│   │   │   │   ├── room_model.py
│   │   │   │   ├── idea_model.py
│   │   │   │   ├── comment_model.py
│   │   │   │   ├── reaction_model.py
│   │   │   │   └── vote_model.py
│   │   │   ├── repositories/      # Repository implementations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user_repository_impl.py
│   │   │   │   ├── problem_repository_impl.py
│   │   │   │   ├── room_repository_impl.py
│   │   │   │   ├── idea_repository_impl.py
│   │   │   │   └── comment_repository_impl.py
│   │   │   └── migrations/        # Alembic migrations
│   │   ├── web/                   # Web layer (FastAPI)
│   │   │   ├── __init__.py
│   │   │   ├── api/               # API routes
│   │   │   │   ├── __init__.py
│   │   │   │   ├── deps.py        # FastAPI dependencies
│   │   │   │   ├── v1/            # API version 1
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── router.py
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── __init__.py
│   │   │   │   │   │   ├── auth.py
│   │   │   │   │   │   ├── users.py
│   │   │   │   │   │   ├── problems.py
│   │   │   │   │   │   ├── rooms.py
│   │   │   │   │   │   ├── ideas.py
│   │   │   │   │   │   ├── comments.py
│   │   │   │   │   │   └── dashboard.py
│   │   │   │   │   └── middleware/
│   │   │   │   │       ├── __init__.py
│   │   │   │   │       ├── auth_middleware.py
│   │   │   │   │       └── error_handler.py
│   │   │   └── websocket/         # Socket.io handlers
│   │   │       ├── __init__.py
│   │   │       └── handlers.py
│   │   ├── security/              # Security implementations
│   │   │   ├── __init__.py
│   │   │   ├── password.py        # Password hashing
│   │   │   └── jwt.py             # JWT implementation
│   │   └── external/              # External services
│   │       ├── __init__.py
│   │       └── email_service.py
│   │
│   └── core/                      # Shared utilities
│       ├── __init__.py
│       ├── config.py              # App configuration
│       ├── exceptions.py          # Custom exceptions
│       └── logging.py             # Logging setup
│
├── tests/                         # Test suite
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures
│   ├── unit/                      # Unit tests (Domain + Use Cases)
│   │   ├── domain/
│   │   └── application/
│   ├── integration/               # Integration tests (Repositories)
│   │   └── infrastructure/
│   └── e2e/                       # End-to-end tests (API)
│       └── api/
│
├── alembic.ini                    # Alembic config
├── pyproject.toml                 # Poetry dependencies
├── Dockerfile
└── docker-compose.yml
```

---

## 3. LAYER DETAILS

### 3.1 Domain Layer (entities/)

Pure Python, không import gì từ FastAPI/SQLAlchemy.

```python
# app/domain/entities/problem.py
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4

from app.domain.value_objects.category import ProblemCategory


class ProblemStatus(str, Enum):
    OPEN = "open"
    DISCUSSING = "discussing"
    BRAINSTORMING = "brainstorming"
    SOLVED = "solved"
    CLOSED = "closed"


@dataclass
class Problem:
    """Domain entity: Pure business logic, no infrastructure dependencies."""
    title: str
    content: str
    category: ProblemCategory
    author_id: UUID
    id: UUID = field(default_factory=uuid4)
    status: ProblemStatus = field(default=ProblemStatus.OPEN)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    room_id: Optional[UUID] = None
    
    # Valid state transitions
    _valid_transitions = {
        ProblemStatus.OPEN: [ProblemStatus.DISCUSSING, ProblemStatus.CLOSED],
        ProblemStatus.DISCUSSING: [ProblemStatus.BRAINSTORMING, ProblemStatus.SOLVED, ProblemStatus.CLOSED],
        ProblemStatus.BRAINSTORMING: [ProblemStatus.SOLVED, ProblemStatus.CLOSED],
        ProblemStatus.SOLVED: [ProblemStatus.CLOSED],
        ProblemStatus.CLOSED: []
    }
    
    def can_transition_to(self, new_status: ProblemStatus) -> bool:
        """Business rule: Check if status transition is valid."""
        return new_status in self._valid_transitions.get(self.status, [])
    
    def transition_to(self, new_status: ProblemStatus) -> None:
        """Business rule: Perform status transition."""
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from {self.status.value} to {new_status.value}"
            )
        self.status = new_status
        self.updated_at = datetime.utcnow()
    
    def link_to_room(self, room_id: UUID) -> None:
        """Business rule: Link problem to brainstorming room."""
        if self.room_id is not None:
            raise ValueError("Problem is already linked to a room")
        self.room_id = room_id
        self.transition_to(ProblemStatus.BRAINSTORMING)


# app/domain/value_objects/category.py
from enum import Enum


class ProblemCategory(str, Enum):
    PROCESS = "process"
    TECHNICAL = "technical"
    PEOPLE = "people"
    TOOLS = "tools"
    PATENT = "patent"
```

### 3.2 Domain Repository Interfaces (repositories/)

Abstract interfaces - no implementation details.

```python
# app/domain/repositories/problem_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from uuid import UUID

from app.domain.entities.problem import Problem


class ProblemRepository(ABC):
    """Repository interface (Port) - defines what operations are possible."""
    
    @abstractmethod
    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        """Get problem by ID."""
        pass
    
    @abstractmethod
    async def list(
        self,
        filters: dict,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Problem], int]:
        """List problems with pagination. Returns (items, total_count)."""
        pass
    
    @abstractmethod
    async def create(self, problem: Problem) -> Problem:
        """Create new problem."""
        pass
    
    @abstractmethod
    async def update(self, problem: Problem) -> Problem:
        """Update existing problem."""
        pass
    
    @abstractmethod
    async def delete(self, problem_id: UUID) -> bool:
        """Delete problem."""
        pass
```

### 3.3 Application Layer DTOs (dto/)

Data structures for crossing layer boundaries.

```python
# app/application/dto/problem_dto.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.problem import ProblemStatus, ProblemCategory


# Input DTOs
class CreateProblemDTO(BaseModel):
    """Input for creating a problem."""
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)
    category: ProblemCategory


class UpdateProblemDTO(BaseModel):
    """Input for updating a problem."""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=10)
    category: Optional[ProblemCategory] = None
    status: Optional[ProblemStatus] = None


class ProblemListFilters(BaseModel):
    """Filters for listing problems."""
    status: Optional[ProblemStatus] = None
    category: Optional[ProblemCategory] = None
    author_id: Optional[UUID] = None
    search: Optional[str] = None


# Output DTOs
class ProblemResponseDTO(BaseModel):
    """Output for problem data."""
    id: UUID
    title: str
    content: str
    category: ProblemCategory
    status: ProblemStatus
    author_id: UUID
    room_id: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ProblemListResponseDTO(BaseModel):
    """Output for paginated problem list."""
    items: list[ProblemResponseDTO]
    total: int
    page: int
    limit: int
```

### 3.4 Application Use Cases (use_cases/)

Orchestrate domain entities and repositories.

```python
# app/application/use_cases/problem/create_problem.py
from uuid import UUID

from app.application.dto.problem_dto import CreateProblemDTO, ProblemResponseDTO
from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository


class CreateProblemUseCase:
    """Use case: Create a new problem."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        dto: CreateProblemDTO,
        author_id: UUID
    ) -> ProblemResponseDTO:
        """
        Execute the use case.
        
        Args:
            dto: Creation data
            author_id: ID of the user creating the problem
            
        Returns:
            Created problem as DTO
        """
        # Create domain entity
        problem = Problem(
            title=dto.title,
            content=dto.content,
            category=dto.category,
            author_id=author_id
        )
        
        # Persist via repository
        created_problem = await self.problem_repo.create(problem)
        
        # Return as DTO
        return ProblemResponseDTO.model_validate(created_problem)
```

```python
# app/application/use_cases/problem/update_problem.py
from uuid import UUID

from app.application.dto.problem_dto import UpdateProblemDTO, ProblemResponseDTO
from app.domain.exceptions import NotFoundException, ForbiddenException
from app.domain.repositories.problem_repository import ProblemRepository


class UpdateProblemUseCase:
    """Use case: Update an existing problem."""
    
    def __init__(self, problem_repo: ProblemRepository):
        self.problem_repo = problem_repo
    
    async def execute(
        self,
        problem_id: UUID,
        dto: UpdateProblemDTO,
        current_user_id: UUID,
        is_admin: bool = False
    ) -> ProblemResponseDTO:
        # Get existing problem
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise NotFoundException(f"Problem {problem_id} not found")
        
        # Authorization check
        if problem.author_id != current_user_id and not is_admin:
            raise ForbiddenException("You can only update your own problems")
        
        # Update fields
        if dto.title:
            problem.title = dto.title
        if dto.content:
            problem.content = dto.content
        if dto.category:
            problem.category = dto.category
        if dto.status:
            problem.transition_to(dto.status)  # Business rule enforced here
        
        # Persist
        updated = await self.problem_repo.update(problem)
        
        return ProblemResponseDTO.model_validate(updated)
```

### 3.5 Infrastructure Repository Implementation

```python
# app/infrastructure/database/repositories/problem_repository_impl.py
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.problem import Problem
from app.domain.repositories.problem_repository import ProblemRepository
from app.infrastructure.database.models.problem_model import ProblemModel


class SQLProblemRepository(ProblemRepository):
    """SQLAlchemy implementation of ProblemRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_entity(self, model: ProblemModel) -> Problem:
        """Map ORM model to domain entity."""
        return Problem(
            id=model.id,
            title=model.title,
            content=model.content,
            category=model.category,
            author_id=model.author_id,
            status=model.status,
            room_id=model.room_id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_model(self, entity: Problem) -> ProblemModel:
        """Map domain entity to ORM model."""
        return ProblemModel(
            id=entity.id,
            title=entity.title,
            content=entity.content,
            category=entity.category,
            author_id=entity.author_id,
            status=entity.status,
            room_id=entity.room_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        result = await self.session.execute(
            select(ProblemModel).where(ProblemModel.id == problem_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
    
    async def list(
        self,
        filters: dict,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Problem], int]:
        query = select(ProblemModel)
        
        # Apply filters
        if filters.get("status"):
            query = query.where(ProblemModel.status == filters["status"])
        if filters.get("category"):
            query = query.where(ProblemModel.category == filters["category"])
        if filters.get("author_id"):
            query = query.where(ProblemModel.author_id == filters["author_id"])
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)
        
        # Pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(ProblemModel.created_at.desc())
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(m) for m in models], total
    
    async def create(self, problem: Problem) -> Problem:
        model = self._to_model(problem)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def update(self, problem: Problem) -> Problem:
        model = await self.session.get(ProblemModel, problem.id)
        if not model:
            raise ValueError(f"Problem {problem.id} not found")
        
        model.title = problem.title
        model.content = problem.content
        model.category = problem.category
        model.status = problem.status
        model.updated_at = problem.updated_at
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_entity(model)
    
    async def delete(self, problem_id: UUID) -> bool:
        model = await self.session.get(ProblemModel, problem_id)
        if not model:
            return False
        
        await self.session.delete(model)
        await self.session.commit()
        return True
```

### 3.6 Presentation Layer (FastAPI Routes)

```python
# app/infrastructure/web/api/v1/endpoints/problems.py
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.application.dto.problem_dto import (
    CreateProblemDTO,
    UpdateProblemDTO,
    ProblemListFilters,
    ProblemResponseDTO,
    ProblemListResponseDTO
)
from app.application.use_cases.problem.create_problem import CreateProblemUseCase
from app.application.use_cases.problem.list_problems import ListProblemsUseCase
from app.application.use_cases.problem.update_problem import UpdateProblemUseCase
from app.infrastructure.web.api.deps import (
    get_create_problem_use_case,
    get_list_problems_use_case,
    get_update_problem_use_case,
    get_current_user
)

router = APIRouter()


@router.post(
    "/problems",
    response_model=ProblemResponseDTO,
    status_code=status.HTTP_201_CREATED
)
async def create_problem(
    data: CreateProblemDTO,
    use_case: CreateProblemUseCase = Depends(get_create_problem_use_case),
    current_user = Depends(get_current_user)
):
    """Create a new problem."""
    return await use_case.execute(data, current_user.id)


@router.get("/problems", response_model=ProblemListResponseDTO)
async def list_problems(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    use_case: ListProblemsUseCase = Depends(get_list_problems_use_case)
):
    """List problems with pagination and filters."""
    filters = ProblemListFilters(
        status=status,
        category=category,
        search=search
    )
    return await use_case.execute(filters, page, limit)


@router.get("/problems/{problem_id}", response_model=ProblemResponseDTO)
async def get_problem(
    problem_id: UUID,
    use_case: ListProblemsUseCase = Depends(get_list_problems_use_case)
):
    """Get a single problem by ID."""
    # Implementation...
    pass


@router.put("/problems/{problem_id}", response_model=ProblemResponseDTO)
async def update_problem(
    problem_id: UUID,
    data: UpdateProblemDTO,
    use_case: UpdateProblemUseCase = Depends(get_update_problem_use_case),
    current_user = Depends(get_current_user)
):
    """Update a problem."""
    return await use_case.execute(
        problem_id=problem_id,
        dto=data,
        current_user_id=current_user.id,
        is_admin=current_user.is_admin
    )
```

### 3.7 Dependency Injection Container

```python
# app/container.py
from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository
from app.application.use_cases.problem.create_problem import CreateProblemUseCase
from app.application.use_cases.problem.list_problems import ListProblemsUseCase


class Container(containers.DeclarativeContainer):
    """Dependency injection container."""
    
    config = providers.Singleton(Settings)
    
    # Database
    engine = providers.Singleton(
        create_async_engine,
        url=config.provided.DATABASE_URL,
        echo=config.provided.DEBUG
    )
    
    session_factory = providers.Singleton(
        async_sessionmaker,
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    # Repositories
    problem_repository = providers.Factory(
        SQLProblemRepository,
        session=session_factory
    )
    
    # Use Cases
    create_problem_use_case = providers.Factory(
        CreateProblemUseCase,
        problem_repo=problem_repository
    )
    
    list_problems_use_case = providers.Factory(
        ListProblemsUseCase,
        problem_repo=problem_repository
    )
```

---

## 4. DATA FLOW EXAMPLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CREATE PROBLEM FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. CLIENT          2. FASTAPI           3. USE CASE        4. REPO     │
│     REQUEST            ROUTE                                          │
│                                                                          │
│  POST /problems ─────► @router.post ───► CreateProblemUseCase          │
│  {                    ("/problems")        .execute()                    │
│    "title": "...",        │                  │                          │
│    "content": "..."       ▼                  ▼                          │
│  }                 CreateProblemDTO    Problem Domain Entity            │
│                        (validation)       (business rules)              │
│                                          │                               │
│                                          ▼                               │
│                                     SQLProblemRepository               │
│                                          │                               │
│                                          ▼                               │
│                                     ProblemModel (ORM)                  │
│                                          │                               │
│                                          ▼                               │
│                                     PostgreSQL DB                       │
│                                                                          │
│  ◄───────────────────────────────────────────────────────────────      │
│                        ProblemResponseDTO                               │
│                        (JSON response)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests (Domain + Application)

```python
# tests/unit/domain/test_problem.py
import pytest
from uuid import uuid4

from app.domain.entities.problem import Problem, ProblemStatus
from app.domain.value_objects.category import ProblemCategory


class TestProblem:
    def test_create_problem(self):
        problem = Problem(
            title="Test Problem",
            content="Test content",
            category=ProblemCategory.TECHNICAL,
            author_id=uuid4()
        )
        assert problem.status == ProblemStatus.OPEN
        assert problem.title == "Test Problem"
    
    def test_valid_status_transition(self):
        problem = Problem(
            title="Test",
            content="Content",
            category=ProblemCategory.PROCESS,
            author_id=uuid4()
        )
        
        problem.transition_to(ProblemStatus.DISCUSSING)
        assert problem.status == ProblemStatus.DISCUSSING
    
    def test_invalid_status_transition(self):
        problem = Problem(
            title="Test",
            content="Content",
            category=ProblemCategory.PROCESS,
            author_id=uuid4(),
            status=ProblemStatus.CLOSED
        )
        
        with pytest.raises(ValueError):
            problem.transition_to(ProblemStatus.OPEN)
```

### 5.2 Integration Tests (Repositories)

```python
# tests/integration/infrastructure/test_problem_repository.py
import pytest
from uuid import uuid4

from app.domain.entities.problem import Problem
from app.domain.value_objects.category import ProblemCategory
from app.infrastructure.database.repositories.problem_repository_impl import SQLProblemRepository


@pytest.mark.asyncio
async def test_create_and_get_problem(db_session):
    # Arrange
    repo = SQLProblemRepository(db_session)
    problem = Problem(
        title="Integration Test",
        content="Test content",
        category=ProblemCategory.TECHNICAL,
        author_id=uuid4()
    )
    
    # Act
    created = await repo.create(problem)
    fetched = await repo.get_by_id(created.id)
    
    # Assert
    assert fetched is not None
    assert fetched.title == "Integration Test"
    assert fetched.id == created.id
```

### 5.3 E2E Tests (API)

```python
# tests/e2e/api/test_problems.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_problem_api(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/problems",
        json={
            "title": "E2E Test Problem",
            "content": "This is a test problem for E2E testing",
            "category": "technical"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "E2E Test Problem"
    assert data["status"] == "open"
```

---

## 6. DEPENDENCIES (pyproject.toml)

```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
sqlalchemy = {extras = ["asyncpg"], version = "^2.0.23"}
alembic = "^1.12.0"
asyncpg = "^0.29.0"
redis = "^5.0.0"
httpx = "^0.25.0"
structlog = "^23.2.0"
python-socketio = "^5.9.0"
dependency-injector = "^4.41.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
pytest-cov = "^4.1.0"
black = "^23.0.0"
isort = "^5.12.0"
flake8 = "^6.1.0"
mypy = "^1.7.0"
```

---

## 7. SUMMARY

### ✅ Ưu điểm của Clean Architecture

| Ưu điểm | Giải thích |
|---------|-----------|
| **Testability** | Domain không phụ thuộc framework → unit test dễ |
| **Flexibility** | Đổi DB chỉ cần sửa Repository, không động Domain |
| **Maintainability** | Business logic tập trung, dễ tìm |
| **Independence** | Framework agnostic - có thể đổi FastAPI mà không ảnh hưởng business logic |

### ⚠️ Trade-offs

| Hạn chế | Giải thích |
|---------|-----------|
| **Boilerplate** | Nhiều files, mapping DTO ↔ Entity |
| **Learning curve** | Team cần hiểu DI, Ports/Adapters |
| **Over-engineering** | Với project nhỏ, có thể là quá mức |

### 🎯 Khuyến nghị cho Innovation Hub

Clean Architecture phù hợp vì:
- Dự án có business logic (status transitions, voting rules)
- Cần maintain dài hạn
- Team có thể học và áp dụng

Nhưng có thể **simplify**:
- Không cần quá nhiều Value Objects
- DTO và Entity có thể gần giống nhau (không cần mapping phức tạp)

---

*Document version: 1.0*
*Stack: Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL*
