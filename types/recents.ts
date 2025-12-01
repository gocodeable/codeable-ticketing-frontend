export interface Recents {
  resourceId: string;
  title: string;
  img?: string;
  type: "project" | "issue";
  projectId?: string; // Project ID for issues (to navigate to project page)
  lastAccessed?: Date;
}

