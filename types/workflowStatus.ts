export interface WorkflowStatus {
  _id: string;
  name: string;
  description?: string;
  orderIndex: number;
  color?: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

