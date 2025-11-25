import { Issue } from "@/types/issue";
import type { Project } from "@/types/project";
import type { Recents } from "@/types/recents";
import type { TabItem } from "@/types/tabitem";
import type { Team } from "@/types/team";

export const mockRecentProjects: Recents[] = [
  {
    id: "1",
    title: "Website Redesign",
    type: "project",
    icon: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    lastAccessed: new Date("2025-11-14T10:30:00"),
  },
  {
    id: "2",
    title: "Marketing Campaign Q4",
    type: "project",
    icon: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    lastAccessed: new Date("2025-11-14T09:15:00"),
  }
];

export const mockRecentIssues: Recents[] = [
  {
    id: "issue-1",
    title: "Fix login page responsive layout",
    type: "issue",
    icon: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    lastAccessed: new Date("2025-11-14T11:00:00"),
  },
  {
    id: "issue-2",
    title: "Add dark mode support",
    type: "issue",
    icon: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    lastAccessed: new Date("2025-11-14T09:30:00"),
  },
  {
    id: "issue-3",
    title: "Optimize database queries",
    type: "issue",
    icon: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    lastAccessed: new Date("2025-11-13T17:20:00"),
  }
];

// Worked on issues
export const mockWorkedOnItems: TabItem[] = [
  {
    id: "work-1",
    title: "Fix authentication bug",
    project: "Website Redesign",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "work-2",
    title: "Update user profile UI",
    project: "Mobile App Development",
    status: "in-progress",
    priority: "medium",
  },
  {
    id: "work-3",
    title: "Implement responsive layout",
    project: "Website Redesign",
    status: "in-progress",
    priority: "medium",
  },
  {
    id: "work-4",
    title: "Add loading states",
    project: "Marketing Campaign Q4",
    status: "in-progress",
    priority: "low",
  },
];

// Assigned to me issues
export const mockAssignedItems: TabItem[] = [
  {
    id: "assigned-1",
    title: "Implement payment gateway",
    project: "E-commerce Platform",
    status: "open",
    priority: "high",
  },
  {
    id: "assigned-2",
    title: "Fix email notifications",
    project: "Marketing Campaign Q4",
    status: "open",
    priority: "high",
  },
  {
    id: "assigned-3",
    title: "Add search functionality",
    project: "Website Redesign",
    status: "open",
    priority: "medium",
  },
  {
    id: "assigned-4",
    title: "Update documentation",
    project: "API Documentation",
    status: "open",
    priority: "low",
  },
];

// Starred issues
export const mockStarredItems: TabItem[] = [
  {
    id: "starred-1",
    title: "Improve performance metrics",
    project: "Mobile App Development",
    status: "open",
    priority: "high",
  },
  {
    id: "starred-2",
    title: "Setup CI/CD pipeline",
    project: "DevOps Infrastructure",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "starred-3",
    title: "Refactor API endpoints",
    project: "API Documentation",
    status: "open",
    priority: "medium",
  },
  {
    id: "starred-4",
    title: "Add unit tests",
    project: "Website Redesign",
    status: "open",
    priority: "medium",
  },
];

export const mockProjects:Project[]=[
  {
    id: "1",
    title: "Website Redesign",
    img: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    description: "A redesign of the website to improve the user experience",
    createdAt: new Date("2025-11-14T10:30:00"),
    updatedAt: new Date("2025-11-14T10:30:00"),
  },
  {
    id: "2",
    title: "Marketing Campaign Q4",
    img: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
    description: "A marketing campaign for the fourth quarter of the year",
    createdAt: new Date("2025-11-14T09:15:00"),
    updatedAt: new Date("2025-11-14T09:15:00"),
  }
]

export const mockTeams:Team[]=[
  {
    id: "1",
    name: "Team 1",
    members: [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        pic: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
      },
      {
        id: "2",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        pic: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
      },
    ],
    description: "Team 1 description",
    createdBy: {
      id: "1",
    },
    createdAt: new Date("2025-11-14T10:30:00"),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Team 2",
    members: [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        pic: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
      },
      {
        id: "2",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        pic: "https://images.squarespace-cdn.com/content/v1/5e10bdc20efb8f0d169f85f9/09943d85-b8c7-4d64-af31-1a27d1b76698/arrow.png",
      },
    ],
    description: "Team 2 description",
    createdBy: {
      id: "1",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]
// Mock issues for projects
export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    title: "Fix responsive layout on mobile devices",
    description: "The navigation menu breaks on small screens below 768px. Need to implement a mobile-friendly hamburger menu.",
    status: "in-progress",
    priority: "high",
    project: mockProjects[0],
    createdAt: new Date("2025-11-10T10:30:00"),
    updatedAt: new Date("2025-11-15T14:20:00"),
  },
  {
    id: "issue-2",
    title: "Add dark mode support",
    description: "Implement dark mode toggle and ensure all components support dark theme properly.",
    status: "open",
    priority: "medium",
    project: mockProjects[0],
    createdAt: new Date("2025-11-12T09:15:00"),
    updatedAt: new Date("2025-11-12T09:15:00"),
  },
  {
    id: "issue-3",
    title: "Optimize image loading performance",
    description: "Images are loading slowly. Need to implement lazy loading and optimize image sizes.",
    status: "open",
    priority: "high",
    project: mockProjects[0],
    createdAt: new Date("2025-11-14T11:00:00"),
    updatedAt: new Date("2025-11-14T11:00:00"),
  },
  {
    id: "issue-4",
    title: "Update footer design",
    description: "Refresh the footer with modern design elements and proper spacing.",
    status: "closed",
    priority: "low",
    project: mockProjects[0],
    createdAt: new Date("2025-11-08T08:00:00"),
    updatedAt: new Date("2025-11-13T16:45:00"),
  },
  {
    id: "issue-5",
    title: "Add accessibility features",
    description: "Ensure website meets WCAG 2.1 AA standards for accessibility.",
    status: "in-progress",
    priority: "high",
    project: mockProjects[0],
    createdAt: new Date("2025-11-09T10:00:00"),
    updatedAt: new Date("2025-11-16T12:30:00"),
  },
  {
    id: "issue-6",
    title: "Create email newsletter campaign",
    description: "Design and implement the email newsletter for Q4 marketing campaign.",
    status: "in-progress",
    priority: "high",
    project: mockProjects[1],
    createdAt: new Date("2025-11-11T09:00:00"),
    updatedAt: new Date("2025-11-16T10:15:00"),
  },
  {
    id: "issue-7",
    title: "Social media content calendar",
    description: "Plan and schedule social media posts for the entire quarter.",
    status: "open",
    priority: "medium",
    project: mockProjects[1],
    createdAt: new Date("2025-11-13T14:30:00"),
    updatedAt: new Date("2025-11-13T14:30:00"),
  },
  {
    id: "issue-8",
    title: "Update brand guidelines",
    description: "Revise brand guidelines document with new color schemes and typography.",
    status: "closed",
    priority: "medium",
    project: mockProjects[1],
    createdAt: new Date("2025-11-05T11:00:00"),
    updatedAt: new Date("2025-11-12T17:00:00"),
  },
];