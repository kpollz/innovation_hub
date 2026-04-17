"""Create scoring criteria use case."""
from uuid import UUID

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.domain.entities.event_scoring_criteria import EventScoringCriteria
from app.domain.repositories.event_repository import EventRepository
from app.domain.repositories.event_scoring_criteria_repository import EventScoringCriteriaRepository


DEFAULT_CRITERIA = [
    ("problem", "Unresolved Problem", "Đây là một bài toán chưa có giải pháp hoặc giải pháp chưa triệt để (chưa đáp ứng được nhu cầu người dùng)?", 0),
    ("problem", "Root Cause Analysis", "Tác giả đã có sự tìm hiểu và phân tích được nguyên nhân gốc rễ của vấn đề/bài toán?", 1),
    ("problem", "Problem Recognition", "Đây là một bài toán có độ nhận diện cao, được nhắc nhiều trên báo đài hoặc tin tức?", 2),
    ("problem", "Gap Evidence", "Có bằng chứng về việc bài toán chưa được giải quyết (gap analysis) từ các nguồn uy tín?", 3),
    ("solution", "Novelty", "Ý tưởng của giải pháp thực sự mới lạ và chưa từng xuất hiện trong các giải pháp đã biết (kể cả lĩnh vực khác)?", 4),
    ("solution", "Root Cause Resolution", "Giải pháp có khả năng giải quyết được vấn đề gốc rễ một cách triệt để và như mong đợi?", 5),
    ("solution", "Competitive Advantage", "Giải pháp có những điểm khác biệt và ưu thế cạnh tranh so với các giải pháp hiện có trên thị trường?", 6),
    ("solution", "Technical Feasibility", "Giải pháp khả thi về mặt kỹ thuật, có thể phát triển và triển khai dựa trên các công nghệ hiện tại hoặc tương lai gần?", 7),
]


class CreateCriteriaUseCase:

    def __init__(
        self,
        event_repo: EventRepository,
        criteria_repo: EventScoringCriteriaRepository,
    ):
        self.event_repo = event_repo
        self.criteria_repo = criteria_repo

    async def execute(
        self,
        event_id: UUID,
        criteria_data: list[dict] | None = None,
        is_admin: bool = False,
    ) -> list[EventScoringCriteria]:
        if not is_admin:
            raise ForbiddenException("Only admin can create scoring criteria")

        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException(f"Event {event_id} not found")

        if await self.criteria_repo.exists_for_event(event_id):
            raise ConflictException("Criteria already exist for this event")

        if criteria_data:
            criteria_list = [
                EventScoringCriteria(
                    event_id=event_id,
                    group=c["group"],
                    name=c["name"],
                    description=c.get("description"),
                    weight=c.get("weight", 1.0),
                    max_score=c.get("max_score", 12.5),
                    sort_order=c.get("sort_order", 0),
                )
                for c in criteria_data
            ]
        else:
            criteria_list = [
                EventScoringCriteria(
                    event_id=event_id,
                    group=group,
                    name=name,
                    description=desc,
                    sort_order=order,
                )
                for group, name, desc, order in DEFAULT_CRITERIA
            ]

        return await self.criteria_repo.create_batch(criteria_list)
