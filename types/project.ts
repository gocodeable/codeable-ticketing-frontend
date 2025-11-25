import { Issue } from "./issue";

export interface ProjectMember {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Project {
  _id: string;
  title: string;
  img: string;
  description: string;
  members?: (string | ProjectMember)[];
  issues?: Issue[];
  createdAt?: String;
  updatedAt?: String;
}