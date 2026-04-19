import apiClient from './client';
import type {
  EventObject,
  CreateEvent,
  UpdateEvent,
  EventFilters,
  PaginatedResponse,
  EventTeamObject,
  CreateEventTeam,
  EventTeamMemberObject,
  UpdateMemberStatusDTO,
  TransferLeadDTO,
  AssignReviewDTO,
  EventIdeaObject,
  CreateEventIdea,
  UpdateEventIdea,
  CreateEventIdeaFromRoom,
  EventIdeaFilters,
  EventScoringCriteriaObject,
  EventScoreObject,
  ScoreInputDTO,
  ScoreListResponse,
  FAQObject,
  CreateFAQ,
  UpdateFAQ,
  EventDashboardIdea,
  EventDashboardTeam,
  AssignmentsResponse,
} from '@/types';

export const eventsApi = {
  // --- Events ---
  list: async (filters: EventFilters = {}): Promise<PaginatedResponse<EventObject>> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get<PaginatedResponse<EventObject>>(`/events?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<EventObject> => {
    const response = await apiClient.get<EventObject>(`/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEvent): Promise<EventObject> => {
    const response = await apiClient.post<EventObject>('/events', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEvent): Promise<EventObject> => {
    const response = await apiClient.patch<EventObject>(`/events/${id}`, data);
    return response.data;
  },

  closeEvent: async (id: string): Promise<EventObject> => {
    const response = await apiClient.patch<EventObject>(`/events/${id}/close`);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  // --- Teams ---
  listTeams: async (eventId: string, page = 1, limit = 20): Promise<PaginatedResponse<EventTeamObject>> => {
    const response = await apiClient.get<PaginatedResponse<EventTeamObject>>(
      `/events/${eventId}/teams?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  listTeamMembers: async (eventId: string, teamId: string): Promise<{ items: EventTeamMemberObject[] }> => {
    const response = await apiClient.get<{ items: EventTeamMemberObject[] }>(
      `/events/${eventId}/teams/${teamId}/members`
    );
    return response.data;
  },

  createTeam: async (eventId: string, data: CreateEventTeam): Promise<EventTeamObject> => {
    const response = await apiClient.post<EventTeamObject>(`/events/${eventId}/teams`, data);
    return response.data;
  },

  joinTeam: async (eventId: string, teamId: string): Promise<EventTeamMemberObject> => {
    const response = await apiClient.post<EventTeamMemberObject>(`/events/${eventId}/teams/${teamId}/join`);
    return response.data;
  },

  updateMemberStatus: async (
    eventId: string, teamId: string, userId: string, data: UpdateMemberStatusDTO
  ): Promise<EventTeamMemberObject> => {
    const response = await apiClient.patch<EventTeamMemberObject>(
      `/events/${eventId}/teams/${teamId}/members/${userId}`, data
    );
    return response.data;
  },

  disbandTeam: async (eventId: string, teamId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/teams/${teamId}`);
  },

  leaveTeam: async (eventId: string, teamId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/teams/${teamId}/members/me`);
  },

  transferLead: async (eventId: string, teamId: string, data: TransferLeadDTO): Promise<EventTeamObject> => {
    const response = await apiClient.patch<EventTeamObject>(
      `/events/${eventId}/teams/${teamId}/transfer-lead`, data
    );
    return response.data;
  },

  assignReview: async (eventId: string, teamId: string, data: AssignReviewDTO): Promise<EventTeamObject> => {
    const response = await apiClient.patch<EventTeamObject>(
      `/events/${eventId}/teams/${teamId}/assign-review`, data
    );
    return response.data;
  },

  getAssignments: async (eventId: string): Promise<AssignmentsResponse> => {
    const response = await apiClient.get<AssignmentsResponse>(`/events/${eventId}/assignments`);
    return response.data;
  },

  // --- Ideas ---
  listIdeas: async (eventId: string, filters: EventIdeaFilters = {}): Promise<PaginatedResponse<EventIdeaObject>> => {
    const params = new URLSearchParams();
    if (filters.team_id) params.append('team_id', filters.team_id);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get<PaginatedResponse<EventIdeaObject>>(
      `/events/${eventId}/ideas?${params}`
    );
    return response.data;
  },

  getIdea: async (eventId: string, ideaId: string): Promise<EventIdeaObject> => {
    const response = await apiClient.get<EventIdeaObject>(`/events/${eventId}/ideas/${ideaId}`);
    return response.data;
  },

  createIdea: async (eventId: string, data: CreateEventIdea): Promise<EventIdeaObject> => {
    const response = await apiClient.post<EventIdeaObject>(`/events/${eventId}/ideas`, data);
    return response.data;
  },

  createIdeaFromRoom: async (eventId: string, data: CreateEventIdeaFromRoom): Promise<EventIdeaObject> => {
    const response = await apiClient.post<EventIdeaObject>(`/events/${eventId}/ideas/from-room`, data);
    return response.data;
  },

  updateIdea: async (eventId: string, ideaId: string, data: UpdateEventIdea): Promise<EventIdeaObject> => {
    const response = await apiClient.patch<EventIdeaObject>(`/events/${eventId}/ideas/${ideaId}`, data);
    return response.data;
  },

  deleteIdea: async (eventId: string, ideaId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/ideas/${ideaId}`);
  },

  // --- Scoring ---
  getCriteria: async (eventId: string): Promise<EventScoringCriteriaObject[]> => {
    const response = await apiClient.get<EventScoringCriteriaObject[]>(`/events/${eventId}/criteria`);
    return response.data;
  },

  submitScore: async (eventId: string, ideaId: string, data: ScoreInputDTO): Promise<EventScoreObject> => {
    const response = await apiClient.post<EventScoreObject>(
      `/events/${eventId}/ideas/${ideaId}/scores`, data
    );
    return response.data;
  },

  updateScore: async (eventId: string, ideaId: string, data: ScoreInputDTO): Promise<EventScoreObject> => {
    const response = await apiClient.put<EventScoreObject>(
      `/events/${eventId}/ideas/${ideaId}/scores`, data
    );
    return response.data;
  },

  getScores: async (eventId: string, ideaId: string): Promise<ScoreListResponse> => {
    const response = await apiClient.get<ScoreListResponse>(
      `/events/${eventId}/ideas/${ideaId}/scores`
    );
    return response.data;
  },

  // --- FAQ ---
  getFAQs: async (eventId: string): Promise<FAQObject[]> => {
    const response = await apiClient.get<FAQObject[]>(`/events/${eventId}/faqs`);
    return response.data;
  },

  createFAQ: async (eventId: string, data: CreateFAQ): Promise<FAQObject> => {
    const response = await apiClient.post<FAQObject>(`/events/${eventId}/faqs`, data);
    return response.data;
  },

  updateFAQ: async (eventId: string, faqId: string, data: UpdateFAQ): Promise<FAQObject> => {
    const response = await apiClient.patch<FAQObject>(`/events/${eventId}/faqs/${faqId}`, data);
    return response.data;
  },

  deleteFAQ: async (eventId: string, faqId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/faqs/${faqId}`);
  },

  // --- Dashboard ---
  getDashboardIdeas: async (eventId: string, teamId?: string): Promise<{ items: EventDashboardIdea[] }> => {
    const params = teamId ? `?team_id=${teamId}` : '';
    const response = await apiClient.get<{ items: EventDashboardIdea[] }>(
      `/events/${eventId}/dashboard/ideas${params}`
    );
    return response.data;
  },

  getDashboardTeams: async (eventId: string): Promise<{ items: EventDashboardTeam[] }> => {
    const response = await apiClient.get<{ items: EventDashboardTeam[] }>(
      `/events/${eventId}/dashboard/teams`
    );
    return response.data;
  },
};
