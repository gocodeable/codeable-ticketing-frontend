import { Project } from "./project";
import { WorkflowStatus } from "./workflowStatus";

export interface Issue {
  _id: string;
  title: string;
  description: string;
  workflowStatus: WorkflowStatus | string;
  type: "task" | "bug" | "story" | "epic";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  assignees?: string[];
  reporter: string[];
  project: Project | string;
  img?: string;
  estimate?: number;
  attachments?: string[];
  comments?: string[];
  createdAt?: string;
  updatedAt?: string;
}