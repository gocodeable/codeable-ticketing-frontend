import { Project } from "./project";
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high";
  project: Project;
  createdAt: Date;
  updatedAt: Date;
}