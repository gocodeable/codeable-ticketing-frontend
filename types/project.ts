import { Issue } from "./issue";

export interface ProjectMember {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ProjectTeam {
  _id: string;
  name: string;
  img?: string;
}

export interface Project {
  _id: string;
  title: string;
  code: string;
  img: string;
  description: string;
  admin: string[];
  members?: (string | ProjectMember)[];
  issues?: Issue[];
  team?: ProjectTeam | null;
  issueCount?: number;
  createdAt?: string;
  updatedAt?: string;
}