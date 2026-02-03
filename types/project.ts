import { Issue } from "./issue";

export type MemberRole = "backend" | "frontend" | "ui" | "qa" | "unassigned" | "admin" | "pm";

export interface MemberRoleInfo {
  uid: string;
  role: MemberRole;
}

export interface ProjectMember {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  updatedAt?: string;
  role?: MemberRole;
}

export interface ProjectTeam {
  _id: string;
  name: string;
  img?: string;
}

export type DocsType = "firebase" | "swagger";

export interface Project {
  _id: string;
  title: string;
  code: string;
  img: string;
  description: string;
  figmaLink?: string;
  swaggerLink?: string;
  docsType?: DocsType;
  devDocsLink?: string;
  prodDocsLink?: string;
  admin: string[];
  members?: (string | ProjectMember)[];
  memberRoles?: MemberRoleInfo[];
  issues?: Issue[];
  team?: ProjectTeam | null;
  issueCount?: number;
  createdAt?: string;
  updatedAt?: string;
}