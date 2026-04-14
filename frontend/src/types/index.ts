// User Types
export interface User {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  team: string | null;
  role: 'member' | 'admin';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserRegister {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  team?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Problem Types
export type ProblemStatus = 'open' | 'discussing' | 'brainstorming' | 'solved' | 'closed';
export type ProblemCategory = 'process' | 'technical' | 'people' | 'tools' | 'patent';
export type ProblemVisibility = 'public' | 'private';

export interface ProblemAuthor {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ProblemRoomSummary {
  id: string;
  name: string;
  status: string;
}

export interface Problem {
  id: string;
  title: string;
  summary?: string;
  content: string;
  status: ProblemStatus;
  category: ProblemCategory;
  visibility: ProblemVisibility;
  shared_user_ids: string[];
  author_id: string;
  author: ProblemAuthor | null;
  room_id: string | null;
  rooms: ProblemRoomSummary[];
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  dislikes_count: number;
  insights_count: number;
  comments_count: number;
  user_reaction: string | null;
}

export interface CreateProblem {
  title: string;
  summary?: string;
  content: string;
  category: ProblemCategory;
  visibility?: ProblemVisibility;
  shared_user_ids?: string[];
}

export interface UpdateProblem {
  title?: string;
  summary?: string;
  content?: string;
  status?: ProblemStatus;
  category?: ProblemCategory;
  visibility?: ProblemVisibility;
  shared_user_ids?: string[];
}

// Comment Types
export interface CommentAuthor {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  target_id: string;
  target_type: 'problem' | 'idea';
  content: string;
  author_id: string;
  author: CommentAuthor | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateComment {
  target_id: string;
  target_type: 'problem' | 'idea';
  content: string;
  parent_id?: string;
}

// Room Types
export type RoomStatus = 'active' | 'archived';

export interface RoomCreator {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  status: RoomStatus;
  visibility: ProblemVisibility;
  shared_user_ids: string[];
  problem_id: string | null;
  created_by: string;
  creator: RoomCreator | null;
  created_at: string;
  updated_at: string | null;
  idea_count: number;
}

export interface CreateRoom {
  name: string;
  description?: string;
  problem_id?: string;
  visibility?: ProblemVisibility;
  shared_user_ids?: string[];
}

export interface UpdateRoom {
  name?: string;
  description?: string;
  status?: RoomStatus;
  visibility?: ProblemVisibility;
  shared_user_ids?: string[];
}

// Idea Types
export type IdeaStatus = 'draft' | 'refining' | 'reviewing' | 'submitted' | 'closed';

export interface IdeaAuthor {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface UserVote {
  stars: number;
}

export interface Idea {
  id: string;
  room_id: string;
  title: string;
  description: string;
  summary: string | null;
  status: IdeaStatus;
  author_id: string;
  author: IdeaAuthor | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string | null;
  vote_avg: number;
  vote_count: number;
  likes_count: number;
  dislikes_count: number;
  insights_count: number;
  comments_count: number;
  user_reaction: string | null;
  user_vote: UserVote | null;
}

export interface CreateIdea {
  room_id: string;
  title: string;
  description: string;
  summary?: string;
}

export interface UpdateIdea {
  title?: string;
  description?: string;
  summary?: string;
  status?: IdeaStatus;
  is_pinned?: boolean;
}

// Vote Types
export interface Vote {
  id: string;
  idea_id: string;
  user_id: string;
  stars: number;
  created_at: string;
  updated_at: string | null;
}

export interface CreateVote {
  stars: number;
}

// Reaction Types
export type ReactionType = 'like' | 'dislike' | 'insight';

export interface Reaction {
  id: string;
  target_id: string;
  target_type: 'problem' | 'idea';
  type: ReactionType;
  user_id: string;
  created_at: string;
}

// Dashboard Types
export interface DashboardStats {
  total_problems: number;
  total_ideas: number;
  total_comments: number;
  total_rooms: number;
  interaction_rate: number;
  resolved_problems: number;
  problems_by_status: Record<string, number>;
  ideas_by_status: Record<string, number>;
}

export interface TopContributor {
  user: User;
  problems_count: number;
  ideas_count: number;
  votes_received: number;
}

// Notification Types
export type NotificationType = 'comment_added' | 'reaction_added' | 'vote_added' | 'status_changed';

export interface NotificationActor {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  actor: NotificationActor | null;
  type: NotificationType;
  target_id: string;
  target_type: 'problem' | 'idea';
  target_title: string;
  action_detail: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
}

// Filter Types
export interface ProblemFilters {
  search?: string;
  status?: ProblemStatus;
  category?: ProblemCategory;
  author_id?: string;
  sort?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface CommentFilters {
  target_id?: string;
  target_type?: string;
  page?: number;
  limit?: number;
}

// UI Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface ModalState {
  isOpen: boolean;
  type: string;
  data?: unknown;
}
