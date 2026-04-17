"""Event FAQ endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.event_faq_dto import CreateFAQRequest, UpdateFAQRequest, FAQResponse
from app.application.use_cases.event_faq.create_faq import CreateFAQUseCase
from app.application.use_cases.event_faq.list_faqs import ListFAQsUseCase
from app.application.use_cases.event_faq.update_faq import UpdateFAQUseCase
from app.application.use_cases.event_faq.delete_faq import DeleteFAQUseCase
from app.core.exceptions import NotFoundException, ForbiddenException
from app.infrastructure.database.repositories.event_repository_impl import SQLEventRepository
from app.infrastructure.database.repositories.event_faq_repository_impl import SQLEventFAQRepository
from app.infrastructure.database.repositories.event_team_repository_impl import SQLEventTeamRepository
from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO
from app.infrastructure.web.api import deps

router = APIRouter()


async def _is_team_lead(team_repo: SQLEventTeamRepository, event_id: UUID, user_id: UUID) -> bool:
    teams, _ = await team_repo.list_teams_by_event(event_id, page=1, limit=1000)
    return any(t.leader_id == user_id for t in teams)


@router.post("/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    event_id: UUID,
    data: CreateFAQRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    faq_repo: SQLEventFAQRepository = Depends(deps.get_event_faq_repo),
    team_repo: SQLEventTeamRepository = Depends(deps.get_event_team_repo),
):
    """Create FAQ. Admin or Team Lead only."""
    is_admin = current_user.role == "admin"
    is_lead = await _is_team_lead(team_repo, event_id, current_user.id)

    use_case = CreateFAQUseCase(event_repo, faq_repo)
    try:
        faq = await use_case.execute(
            event_id=event_id,
            question=data.question,
            answer=data.answer,
            sort_order=data.sort_order,
            created_by=current_user.id,
            is_admin=is_admin,
            is_team_lead=is_lead,
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return FAQResponse(
        id=faq.id, event_id=faq.event_id, question=faq.question,
        answer=faq.answer, sort_order=faq.sort_order,
        created_by=faq.created_by, created_at=faq.created_at, updated_at=faq.updated_at,
    )


@router.get("/faqs", response_model=list[FAQResponse])
async def list_faqs(
    event_id: UUID,
    event_repo: SQLEventRepository = Depends(deps.get_event_repo),
    faq_repo: SQLEventFAQRepository = Depends(deps.get_event_faq_repo),
):
    """List FAQs for an event. Public read — no auth required."""
    use_case = ListFAQsUseCase(event_repo, faq_repo)
    try:
        faqs = await use_case.execute(event_id)
    except NotFoundException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return [
        FAQResponse(
            id=f.id, event_id=f.event_id, question=f.question,
            answer=f.answer, sort_order=f.sort_order,
            created_by=f.created_by, created_at=f.created_at, updated_at=f.updated_at,
        ) for f in faqs
    ]


@router.patch("/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(
    event_id: UUID,
    faq_id: UUID,
    data: UpdateFAQRequest,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    faq_repo: SQLEventFAQRepository = Depends(deps.get_event_faq_repo),
):
    """Update FAQ. Author or Admin only."""
    use_case = UpdateFAQUseCase(faq_repo)
    try:
        faq = await use_case.execute(
            faq_id=faq_id,
            question=data.question,
            answer=data.answer,
            sort_order=data.sort_order,
            user_id=current_user.id,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return FAQResponse(
        id=faq.id, event_id=faq.event_id, question=faq.question,
        answer=faq.answer, sort_order=faq.sort_order,
        created_by=faq.created_by, created_at=faq.created_at, updated_at=faq.updated_at,
    )


@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    event_id: UUID,
    faq_id: UUID,
    current_user: UserResponseDTO = Depends(get_current_active_user),
    faq_repo: SQLEventFAQRepository = Depends(deps.get_event_faq_repo),
):
    """Delete FAQ. Author or Admin only."""
    use_case = DeleteFAQUseCase(faq_repo)
    try:
        await use_case.execute(
            faq_id=faq_id,
            user_id=current_user.id,
            is_admin=current_user.role == "admin",
        )
    except (NotFoundException, ForbiddenException) as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
