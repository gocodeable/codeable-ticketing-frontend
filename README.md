<p align="center">
  <img src="assets/banner.svg" alt="Codeable Ticketing" width="900" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NEXT.JS_16-352e5c?style=for-the-badge&labelColor=0e0926&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/REACT_19-352e5c?style=for-the-badge&labelColor=0e0926&logo=react&logoColor=b7ff00" alt="React" />
  <img src="https://img.shields.io/badge/TAILWIND_4-352e5c?style=for-the-badge&labelColor=0e0926&logo=tailwindcss&logoColor=b7ff00" alt="Tailwind" />
  <img src="https://img.shields.io/badge/FIREBASE-352e5c?style=for-the-badge&labelColor=0e0926&logo=firebase&logoColor=b7ff00" alt="Firebase" />
  <img src="https://img.shields.io/badge/TYPESCRIPT-352e5c?style=for-the-badge&labelColor=0e0926&logo=typescript&logoColor=b7ff00" alt="TypeScript" />
</p>

<p align="center">
  <strong>A modern, Jira-quality project management platform with drag-and-drop Kanban boards, real-time notifications, rich text editing, and AI-powered ticket generation.</strong>
</p>

---

## Overview

Codeable Ticketing is a full-featured issue tracking and project management platform built for agile teams. It combines a polished UI with real-time collaboration, role-based permissions, and deep AI integration — letting you go from a spec document to a fully planned sprint board in minutes.

---

## Features

### Kanban Board
Drag-and-drop issue cards between workflow statuses using **dnd-kit**. Auto-scrolls horizontally when dragging near edges. Columns are customizable per project — add, rename, reorder, or color-code statuses.

### Issue Tracking
Full lifecycle management for **epics, stories, tasks, and bugs**. Each issue supports:
- Five priority levels (highest → lowest) with color indicators
- Assignee and reporter with avatar display
- Estimated completion dates
- File attachments with download tracking
- Threaded comments with rich text and media

### Rich Text Descriptions
**Tiptap editor** with formatting toolbar — bold, italic, headings, lists, links, code blocks, images, and color. Descriptions render as HTML with styled tables, code blocks, and blockquotes.

### Real-Time Notifications
**Firestore** `onSnapshot` listeners push notifications instantly. Unread count badge in the header, mark as read individually or all at once.

### Team & Project Management
Create projects with custom codes, add members with role-based access (admin, member, frontend, backend, QA, PM). Organize people into teams. Pin frequently-used projects for quick access.

### Analytics Dashboard
**Recharts**-powered visualizations per project:
- Issue priority distribution (bar chart)
- Status breakdown (pie chart)
- Workload distribution across team members

### Dark Mode
System preference detection with manual toggle. Persisted via `next-themes`. Every component respects the active theme.

### Search & Filtering
Live search across projects and issues. Filter issues by priority, status, assignee, reporter, and due date. Debounced input (300ms) for smooth UX.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16 |
| **UI Library** | React | 19 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | 4 |
| **Components** | shadcn/ui (Radix UI primitives) | — |
| **Icons** | Lucide React | 553+ icons |
| **Rich Text** | Tiptap | 3.12 |
| **Drag & Drop** | dnd-kit | 6.3 |
| **Charts** | Recharts | 3.5 |
| **Forms** | React Hook Form + Zod | 7.66 / 4.1 |
| **Auth** | Firebase Authentication | 12.5 |
| **Real-Time** | Firebase Firestore | 12.5 |
| **File Storage** | Firebase Cloud Storage | 12.5 |
| **Animation** | Framer Motion | 12.23 |
| **Date Utils** | date-fns | 4.1 |
| **Theme** | next-themes | 0.4 |
| **File Upload** | react-dropzone | 14.3 |
| **Deployment** | Vercel | — |

---

## Project Structure

```
app/
├── auth/                  # Login, signup, forgot password
├── projects/              # Project listing + create project
├── project/[id]/          # Single project (Kanban, table, settings, members)
├── teams/                 # Team listing + create team
├── team/[id]/             # Team detail view
├── profile/[uid]/         # User profile + settings
├── api/                   # Next.js API routes
│   ├── issues/            # Issue CRUD + move between statuses
│   ├── comments/          # Threaded comments
│   ├── media/             # Upload/download via Firebase Storage
│   ├── notifications/     # Real-time notification management
│   ├── workflow-statuses/  # Status CRUD + reordering
│   ├── pinned-projects/   # User pinned projects
│   ├── starred-issues/    # User starred issues
│   └── ...                # Users, teams, tabs, recents
└── layout.tsx             # Root layout with auth + theme providers

components/
├── ProjectBoard.tsx       # Kanban board with dnd-kit drag-and-drop
├── SortableStatusColumn.tsx  # Droppable status column
├── SortableIssueCard.tsx  # Draggable issue card
├── IssuesTable.tsx        # Table view of issues
├── IssueViewMode.tsx      # Issue detail (description + metadata panel)
├── IssueDetailDialog.tsx  # Issue detail modal
├── IssueEditForm.tsx      # Issue create/edit form
├── IssueCommentsSection.tsx  # Threaded comments with rich text
├── AddIssueDialog.tsx     # Create new issue modal
├── RichTextEditor.tsx     # Tiptap-based rich text editor
├── Header.tsx             # App header (notifications, theme toggle, profile)
├── SideBar.tsx            # Navigation sidebar
├── IssuePriorityBarChart.tsx  # Priority analytics chart
├── IssueStatusPieChart.tsx    # Status analytics chart
├── WorkloadDistribution.tsx   # Team workload chart
├── MediaViewerDialog.tsx  # Full-screen image/video viewer
├── ProtectedRoute.tsx     # Auth guard wrapper
├── theme-provider.tsx     # Dark mode context
└── ui/                    # shadcn/ui component library

lib/
├── api/apiClient.ts       # Centralized fetch with auto 401 handling
├── auth/AuthProvider.tsx   # Firebase auth context + useAuth() hook
├── firebase/              # Firebase config, login, signup, logout
└── hooks/
    └── useNotifications.ts  # Real-time Firestore notifications

hooks/
├── useIssuePermissions.ts  # Role-based permission checks
├── useImageSelection.ts    # Image selection utilities
└── use-mobile.ts           # Mobile viewport detection

types/                     # TypeScript interfaces for all models
utils/                     # Issue colors, media detection, role helpers
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- Firebase project with Authentication + Firestore + Storage enabled
- Codeable Ticketing API backend running

### Setup

```bash
git clone https://github.com/gocodeable/codeable-ticketing-frontend.git
cd codeable-ticketing-frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

---

## Authentication

Firebase Authentication with email/password. The auth flow:

1. User signs up or logs in via `/auth`
2. Firebase creates/validates the user and returns an ID token
3. `SyncUser` creates a corresponding user record in the backend
4. `AuthProvider` context broadcasts auth state to all components
5. API client automatically injects Bearer tokens on every request
6. On 401 response, the client signs out and redirects to `/auth`

Email domain is restricted to `@gocodeable.com` for the hosted instance.

---

## API Integration

All backend communication goes through `lib/api/apiClient.ts`:

```typescript
const data = await apiGet('/projects', idToken);
const result = await apiPost('/issues', { title, description, ... }, idToken);
await apiPatch(`/issues/${id}`, { priority: 'high' }, idToken);
```

Features:
- Automatic Bearer token injection
- 401 detection → sign out → redirect
- Consistent error handling
- Next.js API routes proxy to the backend

---

## AI Integration

This platform is designed to work with two companion tools:

| Tool | What It Does |
|------|-------------|
| **[Codeable Ticketing MCP](https://github.com/gocodeable/codeable-ticketing-mcp)** | MCP server that lets Claude manage tickets through natural conversation |
| **[Codeable Ticketing Skill](https://github.com/gocodeable/codeable-ticketing-skill)** | Claude skill that auto-generates detailed tickets from specs, PRDs, and codebases |

Together they enable: **spec document → `/create-tickets` → full sprint board** with properly formatted HTML descriptions, smart developer assignment, and realistic timelines.

---

## Deployment

Deployed on **Vercel**. See [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for full setup.

**Build settings:**
- Framework: Next.js (auto-detected)
- Build: `npm run build`
- Output: `.next`

**Required env vars in Vercel:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_API_URL`

---

## License

MIT

<p align="center">
  <br />
  <a href="https://gocodeable.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/codeable_wordmark_white.svg" />
      <source media="(prefers-color-scheme: light)" srcset="assets/codeable_wordmark.svg" />
      <img src="assets/codeable_wordmark.svg" alt="Codeable" width="140" />
    </picture>
  </a>
  <br />
  <sub>Built by <a href="https://gocodeable.com">Codeable</a></sub>
</p>
