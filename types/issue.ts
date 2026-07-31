import { Project } from "./project";
import { WorkflowStatus } from "./workflowStatus";

export interface IssueAssignee {
  uid: string;
  name: string;
  avatar?: string;
}

export interface IssueReporter {
  uid: string;
  name: string;
  avatar?: string;
}

export interface Attachment {
  link: string;
  fileName: string;
}

export type IssueType = "task" | "bug" | "story" | "epic" | "subtask";

export interface Issue {
  _id: string;
  title: string;
  description?: string;
  workflowStatus: WorkflowStatus | string;
  type?: IssueType;
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  assignee?: string | IssueAssignee | null;
  reporter?: string | IssueReporter | null;
  project?: Project | string;
  estimatedCompletionDate?: string;
  attachments?: Attachment[];
  comments?: string[];
  commentCount?: number;
  issueCode?: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
  isStarred?: boolean;
  // Hierarchy (Epic -> Story/Task/Bug -> Subtask)
  parent?: string | Issue | null;
  children?: Issue[];
  childCount?: number;
  // The build this ticket was handed to QA on
  build?: IssueBuild | null;
}

export type BuildPlatform = "android" | "ios" | "web";

export interface IssueBuild {
  platform: BuildPlatform;
  url: string;
  label?: string;
  setBy?: string;
  setAt?: string;
}

/** A project's current build for a platform — prefills the RFQA prompt. */
export interface ProjectBuild extends IssueBuild {
  platform: BuildPlatform;
}