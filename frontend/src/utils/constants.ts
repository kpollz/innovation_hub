// Use relative path for Docker (nginx proxies /api/ to backend)
// Fallback to localhost for local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api/v1' : 'http://localhost:8000/api/v1');

export const PROBLEM_CATEGORIES = [
  { value: 'process', label: 'Process', color: 'bg-blue-100 text-blue-800' },
  { value: 'technical', label: 'Technical', color: 'bg-purple-100 text-purple-800' },
  { value: 'people', label: 'People', color: 'bg-green-100 text-green-800' },
  { value: 'tools', label: 'Tools', color: 'bg-orange-100 text-orange-800' },
  { value: 'patent', label: 'Patent', color: 'bg-gray-100 text-gray-800' },
] as const;

export const PROBLEM_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'brainstorming', label: 'Brainstorming', color: 'bg-blue-100 text-blue-800' },
  { value: 'solved', label: 'Solved', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
] as const;

export const IDEA_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'refining', label: 'Refining', color: 'bg-blue-100 text-blue-800' },
  { value: 'ready', label: 'Ready for Pilot', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'selected', label: 'Selected', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const;

export const REACTION_TYPES = [
  { value: 'like', label: 'Like', icon: 'ThumbsUp' },
  { value: 'insight', label: 'Insight', icon: 'Lightbulb' },
  { value: 'dislike', label: 'Dislike', icon: 'ThumbsDown' },
] as const;

export const SIDEBAR_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/problems', label: 'Problem Feed', icon: 'AlertCircle' },
  { path: '/rooms', label: 'Idea Lab', icon: 'Lightbulb' },
] as const;
