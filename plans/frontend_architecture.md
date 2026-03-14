# 🎨 Frontend Architecture - Innovation Hub

## Tech Stack
- **Framework**: React 18+ với TypeScript
- **State Management**: Zustand (đơn giản, nhẹ)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI hoặc Radix UI
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod validation

---

## 📁 Folder Structure

```
src/
├── api/                    # API calls
│   ├── auth.ts
│   ├── problems.ts
│   ├── rooms.ts
│   ├── ideas.ts
│   ├── comments.ts
│   └── dashboard.ts
├── components/             # Shared components
│   ├── ui/                # Primitive components (Button, Input, Modal...)
│   ├── layout/            # Layout components (Header, Sidebar, Footer)
│   ├── common/            # Common components (Avatar, Badge, Card...)
│   └── feedback/          # Toast, Loading, ErrorBoundary
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   └── useInfiniteScroll.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   ├── problemStore.ts
│   └── uiStore.ts
├── pages/                  # Page components
│   ├── Login/
│   ├── Dashboard/
│   ├── ProblemFeed/
│   ├── ProblemDetail/
│   ├── IdeaLab/
│   ├── RoomDetail/
│   └── Admin/
├── types/                  # TypeScript types
│   └── index.ts
├── utils/                  # Utilities
│   ├── constants.ts
│   ├── helpers.ts
│   └── formatters.ts
└── styles/                 # Global styles
    └── globals.css
```

---

## 🧩 Component Tree

### 1. Layout Components

```
<App>
└── <Router>
    └── <AuthGuard>
        └── <MainLayout>
            ├── <Header />
            │   ├── <Logo />
            │   ├── <SearchBar />
            │   ├── <NotificationBell />
            │   └── <UserMenu />
            │       ├── <Avatar />
            │       └── <Dropdown />
            ├── <Sidebar />
            │   ├── <NavItem> Dashboard </NavItem>
            │   ├── <NavItem> Problem Feed </NavItem>
            │   ├── <NavItem> Idea Lab </NavItem>
            │   └── <NavItem> Admin (nếu có quyền) </NavItem>
            └── <MainContent />
                └── <Routes> ... các pages ... </Routes>
```

### 2. Dashboard Page

```
<DashboardPage>
├── <PageHeader title="Dashboard" />
├── <StatsGrid>
│   ├── <StatCard title="Tổng ý tưởng" value={67} icon={Lightbulb} />
│   ├── <StatCard title="Tỷ lệ tương tác" value="72%" icon={MessageCircle} />
│   ├── <StatCard title="Đang Pilot" value={5} icon={Rocket} />
│   └── <StatCard title="Vấn đề mở" value={12} icon={AlertCircle} />
├── <ChartsRow>
│   ├── <PipelineChart data={pipelineData} />
│   └── <ActivityChart data={activityData} />
└── <LeaderboardTable users={topContributors} />
```

### 3. Problem Feed Page

```
<ProblemFeedPage>
├── <PageHeader title="Problem Feed">
│   └── <Button onClick={openCreateModal}>Đăng Vấn đề mới</Button>
├── <FilterBar>
│   ├── <SearchInput placeholder="Tìm kiếm vấn đề..." />
│   ├── <CategoryFilter options={categories} />
│   ├── <StatusFilter options={statuses} />
│   └── <SortSelect options={sortOptions} />
├── <ProblemList>
│   └── {problems.map(problem => (
│       <ProblemCard key={problem.id}>
│           ├── <CardHeader>
│           │   ├── <Badge variant={problem.category}>{category}</Badge>
│           │   ├── <StatusBadge status={problem.status} />
│           │   └── <TimeAgo date={problem.created_at} />
│           ├── <CardTitle>{problem.title}</CardTitle>
│           ├── <CardContent>{truncatedContent}</CardContent>
│           ├── <CardFooter>
│           │   ├── <AuthorInfo user={problem.author} />
│           │   ├── <ReactionBar>
│           │   │   ├── <ReactionButton type="like" count={likes} />
│           │   │   ├── <ReactionButton type="insight" count={insights} />
│           │   │   └── <CommentCount count={commentCount} />
│           │   └── <ActionButtons>
│           │       └── {canBrainstorm && (
│           │           <Button onClick={createRoom}>Brainstorm</Button>
│           │       )}
│           └── {isAdmin && <AdminActions problem={problem} />}
│       </ProblemCard>
│   ))}
└── <Pagination />
```

### 4. Problem Detail Page

```
<ProblemDetailPage>
├── <BackButton />
├── <ProblemHeader>
│   ├── <Breadcrumb />
│   ├── <h1>{problem.title}</h1>
│   ├── <MetaInfo>
│   │   ├── <AuthorBadge user={problem.author} />
│   │   ├── <TimeAgo date={problem.created_at} />
│   │   └── <CategoryBadge category={problem.category} />
│   └── <StatusSelector value={problem.status} onChange={updateStatus} />
├── <ProblemContent>
│   └── <MarkdownRenderer content={problem.content} />
├── <ReactionSection>
│   ├── <ReactionButton type="like" active={userReacted === 'like'} />
│   ├── <ReactionButton type="dislike" />
│   └── <ReactionButton type="insight" />
├── <CommentSection>
│   ├── <CommentForm onSubmit={addComment} />
│   └── <CommentList>
│       └── <CommentThread comments={comments} />
│           └── <CommentItem>
│               ├── <CommentHeader>
│               │   ├── <Avatar user={comment.author} />
│               │   ├── <Username>{comment.author.username}</Username>
│               │   └── <TimeAgo date={comment.created_at} />
│               ├── <CommentContent>{comment.content}</CommentContent>
│               ├── <CommentActions>
│               │   ├── <ReplyButton />
│               │   ├── <EditButton /> (nếu là author)
│               │   └── <DeleteButton /> (nếu là author/admin)
│               └── {comment.replies?.length > 0 && (
│                   <ReplyList>
│                       └── {comment.replies.map(reply => <CommentItem ... />)}
│               )}
└── {linkedRoom && <LinkedRoomCard room={linkedRoom} />}
```

### 5. Idea Lab (Room List) Page

```
<IdeaLabPage>
├── <PageHeader title="Idea Lab - Phòng Brainstorming">
│   └── <Button onClick={openCreateRoomModal}>Tạo Phòng mới</Button>
├── <ViewToggle value={viewMode} onChange={setViewMode} />
│   └── options: ['list', 'board']
├── {viewMode === 'list' ? (
│   └── <RoomList>
│       └── <RoomListItem>
│           ├── <RoomInfo>
│           │   ├── <h3>{room.name}</h3>
│           │   ├── <p>{room.description}</p>
│           │   ├── <Badge>{room.status}</Badge>
│           │   └── {room.linked_problem && <LinkedProblemBadge />}
│           └── <RoomStats>
│               ├── <IdeaCount count={room.idea_count} />
│               └── <ParticipantCount count={room.participant_count} />
│   </RoomList>
│ ) : (
│   └── <RoomBoard>
│       └── <KanbanBoard columns={roomColumns}>
│           └── {rooms.map(room => <RoomCard room={room} />)}
│   </RoomBoard>
│ )}
└── <Pagination />
```

### 6. Room Detail (Brainstorming) Page

```
<RoomDetailPage>
├── <RoomHeader>
│   ├── <Breadcrumb />
│   ├── <h1>{room.name}</h1>
│   ├── <p>{room.description}</p>
│   └── {room.linked_problem && (
│       <LinkedProblemBanner problem={room.linked_problem} />
│   )}
├── <RoomActions>
│   ├── <Button onClick={openCreateIdeaModal}>Đề xuất Ý tưởng</Button>
│   └── {isAdmin && <RoomSettingsButton />}
├── <ViewToggle value={viewMode} onChange={setViewMode} />
│   └── options: ['board', 'list']
├── {viewMode === 'board' ? (
│   └── <IdeaKanbanBoard>
│       ├── <Column title="Draft" status="draft">
│       │   └── <IdeaCards ideas={draftIdeas} />
│       ├── <Column title="Đang hoàn thiện" status="refining">
│       │   └── <IdeaCards ideas={refiningIdeas} />
│       ├── <Column title="Sẵn sàng Pilot" status="ready">
│       │   └── <IdeaCards ideas={readyIdeas} />
│       ├── <Column title="Được chọn" status="selected">
│       │   └── <IdeaCards ideas={selectedIdeas} />
│       └── <Column title="Từ chối" status="rejected">
│           └── <IdeaCards ideas={rejectedIdeas} />
│   </IdeaKanbanBoard>
│ ) : (
│   └── <IdeaList>
│       ├── <FilterBar>
│       │   ├── <SearchInput />
│       │   ├── <StatusFilter />
│       │   └── <SortSelect />
│       └── {ideas.map(idea => <IdeaListItem idea={idea} />)}
│   </IdeaList>
│ )}
└── <RealTimeIndicator /> (Socket connection status)
```

### 7. Idea Detail Component

```
<IdeaCard> (dùng trong cả Board và List view)
├── {idea.is_pinned && <PinBadge />}
├── <IdeaHeader>
│   ├── <h4>{idea.title}</h4>
│   ├── <AuthorBadge user={idea.author} />
│   └── <TimeAgo date={idea.created_at} />
├── <IdeaContent>
│   ├── <Section title="Giải pháp">
│   │   └── <TruncatedText content={idea.description} maxLength={200} />
│   ├── <Section title="Lợi ích mong đợi">
│   │   └── <TruncatedText content={idea.outcome} />
│   └── <ExpandButton />
├── <IdeaStats>
│   ├── <VoteDisplay average={idea.vote_avg} count={idea.vote_count} />
│   ├── <CommentCount count={idea.comment_count} />
│   └── <ReactionBar />
├── <IdeaActions>
│   ├── <VoteButton ideaId={idea.id} currentVote={userVote} />
│   ├── <CommentButton onClick={showComments} />
│   └── {isAuthor && <EditButton />}
└── {showComments && <IdeaComments ideaId={idea.id} />}
```

### 8. Admin Page

```
<AdminPage>
├── <PageHeader title="Quản trị hệ thống" />
├── <AdminTabs>
│   ├── <Tab value="users">Quản lý Users</Tab>
│   ├── <Tab value="problems">Quản lý Vấn đề</Tab>
│   └── <Tab value="reports">Báo cáo & Export</Tab>
├── {activeTab === 'users' && (
│   └── <UserManagement>
│       ├── <Toolbar>
│       │   ├── <SearchInput />
│       │   ├── <TeamFilter />
│       │   └── <AddUserButton />
│       └── <UserTable>
│           ├── columns: Username, Full Name, Team, Role, Status, Actions
│           └── <UserRow actions={[Edit, Deactivate, Delete]} />
│   </UserManagement>
│ )}
├── {activeTab === 'problems' && (
│   └── <ProblemManagement>
│       ├── <BulkActions />
│       └── <ProblemTable withAdminActions />
│   </ProblemManagement>
│ )}
└── {activeTab === 'reports' && (
    └── <ReportsSection>
        ├── <DateRangePicker />
        ├── <ReportPreview />
        └── <ExportButtons formats={['csv', 'excel', 'pdf']} />
    </ReportsSection>
│ )}
```

---

## 🎭 State Management (Zustand)

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}
```

### Problem Store
```typescript
interface ProblemState {
  problems: Problem[];
  selectedProblem: Problem | null;
  filters: ProblemFilters;
  pagination: Pagination;
  fetchProblems: (filters?: ProblemFilters) => Promise<void>;
  createProblem: (data: CreateProblemData) => Promise<void>;
  updateProblem: (id: string, data: UpdateProblemData) => Promise<void>;
  setFilters: (filters: ProblemFilters) => void;
}
```

### UI Store
```typescript
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toast: Toast | null;
  modal: ModalState | null;
  toggleSidebar: () => void;
  showToast: (toast: Toast) => void;
  showModal: (modal: ModalState) => void;
  closeModal: () => void;
}
```

---

## 🔌 Custom Hooks

### useAuth
```typescript
const { user, login, logout, isAdmin } = useAuth();
```

### useSocket
```typescript
const { isConnected, emit, on } = useSocket();
```

### useInfiniteScroll
```typescript
const { ref, hasMore, isLoading } = useInfiniteScroll(fetchMore);
```

### useProblemRealtime
```typescript
const { comments, reactions, addComment } = useProblemRealtime(problemId);
```

---

## 🎯 Key UI Patterns

### 1. Optimistic Updates
- Khi user vote/reaction → Hiển thị ngay → Gọi API sau → Rollback nếu lỗi

### 2. Infinite Scroll
- Problem Feed, Comments: Load thêm khi scroll xuống cuối

### 3. Real-time Comments
- Socket.io: Comment mới tự động xuất hiện không cần refresh

### 4. Drag & Drop (Kanban)
- React DnD hoặc @dnd-kit để kéo thả idea giữa các cột

### 5. Markdown Rendering
- ReactMarkdown để hiển thị content rich text

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout thay đổi |
|------------|-------|-----------------|
| Mobile | < 640px | Sidebar ẩn, cards stack |
| Tablet | 640-1024px | Sidebar collapsible |
| Desktop | > 1024px | Full layout |

---

*Document version: 1.0*
*Created for: Innovation Hub Project*
