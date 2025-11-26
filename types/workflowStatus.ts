export interface WorkflowStatus {
  _id: string;
  name: string;
  description?: string;
  orderIndex: number;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

