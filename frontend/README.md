# Innovation Hub Frontend

A React + TypeScript + Tailwind CSS frontend for the Innovation Hub platform.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Project Structure

```
src/
├── api/                    # API clients
│   ├── auth.ts
│   ├── client.ts
│   ├── comments.ts
│   ├── dashboard.ts
│   ├── problems.ts
│   └── rooms.ts
├── components/             # Shared components
│   ├── common/            # ProblemCard, etc.
│   ├── feedback/          # Toast notifications
│   ├── layout/            # Header, Sidebar, MainLayout
│   └── ui/                # Button, Input, Card, Modal, etc.
├── hooks/                  # Custom React hooks
├── pages/                  # Page components
│   ├── Dashboard/
│   ├── IdeaLab/
│   ├── Login/
│   ├── ProblemDetail/
│   ├── ProblemFeed/
│   ├── Register/
│   └── RoomDetail/
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   ├── problemStore.ts
│   └── uiStore.ts
├── styles/                 # Global styles
├── types/                  # TypeScript types
└── utils/                  # Utilities and constants
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The development server will start at http://localhost:3000

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Features

### Authentication
- Login/Register with JWT token handling
- Automatic token refresh
- Protected routes

### Problem Feed
- List view with pagination
- Search and filter by category/status
- Create problem modal
- Reactions (like, insight)
- Comments

### Idea Lab
- Room list with list/board view modes
- Create brainstorming rooms
- Kanban board for ideas
- Voting on ideas (1-10 scale)
- Idea status management

### Dashboard
- Statistics cards
- Problems by status chart
- Ideas by status chart
- Top contributors leaderboard

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api/v1`.

Key endpoints:
- `/auth/*` - Authentication
- `/problems` - Problems CRUD
- `/rooms` - Brainstorming rooms
- `/comments` - Comments
- `/dashboard` - Statistics

## License

MIT
