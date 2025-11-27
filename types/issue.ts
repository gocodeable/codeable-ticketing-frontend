import { Project } from "./project";
import { WorkflowStatus } from "./workflowStatus";

export interface IssueAssignee {
  uid: string;
  name: string;
  avatar?: string;
}

export interface Issue {
  _id: string;
  title: string;
  description?: string;
  workflowStatus: WorkflowStatus | string;
  type?: "task" | "bug" | "story" | "epic";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  assignee?: string | IssueAssignee | null;
  reporter?: string;
  project?: Project | string;
  estimatedCompletionDate?: string;
  attachments?: string[];
  comments?: string[];
  commentCount?: number;
  issueCode?: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}