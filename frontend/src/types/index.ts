// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  team: string;
  department: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
  full_name: string;
  team: string;
  department: string;
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
  page_size: number;
  pages: number;
}

// Problem Types
export type ProblemStatus = 'open' | 'brainstorming' | 'solved' | 'closed';
export type ProblemCategory = 'process' | 'technical' | 'people' | 'tools' | 'patent';

export interface Problem {
  id: string;
  title: string;
  summary?: string;
  content: string;
  status: ProblemStatus;
  category: ProblemCategory;
  author_id: string;
  author: User;
  linked_room_id: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  insights_count: number;
  comments_count: number;
}

export interface CreateProblem {
  title: string;
  summary?: string;
  content: string;
  category: ProblemCategory;
}

export interface UpdateProblem {
  title?: string;
  content?: string;
  status?: ProblemStatus;
  category?: ProblemCategory;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  problem_id: string;
  author_id: string;
  author: User;
  parent_id: string | null;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface CreateComment {
  content: string;
  parent_id?: string;
}

// Room Types
export type RoomStatus = 'active' | 'closed';

export interface Room {
  id: string;
  name: string;
  description: string;
  status: RoomStatus;
  facilitator_id: string;
  facilitator: User;
  linked_problem_id: string | null;
  linked_problem?: Problem;
  created_at: string;
  updated_at: string;
  idea_count: number;
  participant_count: number;
}

export interface CreateRoom {
  name: string;
  description: string;
  linked_problem_id?: string;
}

// Idea Types
export type IdeaStatus = 'draft' | 'refining' | 'ready' | 'selected' | 'rejected';

export interface Idea {
  id: string;
  room_id: string;
  title: string;
  description: string;
  outcome: string;
  status: IdeaStatus;
  author_id: string;
  author: User;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  vote_avg: number;
  vote_count: number;
  comment_count: number;
}

export interface CreateIdea {
  title: string;
  description: string;
  outcome: string;
}

export interface UpdateIdea {
  title?: string;
  description?: string;
  outcome?: string;
  status?: IdeaStatus;
  is_pinned?: boolean;
}

// Vote Types
export interface Vote {
  id: string;
  idea_id: string;
  user_id: string;
  score: number;
  created_at: string;
}

export interface CreateVote {
  score: number;
}

// Reaction Types
export type ReactionType = 'like' | 'dislike' | 'insight';

export interface Reaction {
  id: string;
  problem_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// Dashboard Types
export interface DashboardStats {
  total_problems: number;
  total_ideas: number;
  total_rooms: number;
  total_users: number;
  problems_by_status: Record<ProblemStatus, number>;
  ideas_by_status: Record<IdeaStatus, number>;
  top_contributors: TopContributor[];
  recent_activity: Activity[];
}

export interface TopContributor {
  user: User;
  problems_count: number;
  ideas_count: number;
  votes_received: number;
}

export interface Activity {
  id: string;
  type: 'problem' | 'idea' | 'comment' | 'vote';
  description: string;
  user: User;
  created_at: string;
}

// Filter Types
export interface ProblemFilters {
  search?: string;
  status?: ProblemStatus;
  category?: ProblemCategory;
  sort_by?: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
  page?: number;
  page_size?: number;
}

export interface CommentFilters {
  problem_id?: string;
  idea_id?: string;
  page?: number;
  page_size?: number;
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