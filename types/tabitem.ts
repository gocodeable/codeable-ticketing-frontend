export interface TabItem {
  id: string;
  title: string;
  project: string;
  priority?: "low" | "medium" | "high";
  issueCode?: string;
  commentCount?: number;
  projectId?: string;
}

