import { Project } from "./project";

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Team {
  _id: string;
  name: string;
  img?: string;
  description?: string;
  admin: string[];
  members: TeamMember[];
  projects?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeamProject = Pick<Project, "_id" | "title" | "img">;
