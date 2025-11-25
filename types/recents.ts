export interface Recents {
  resourceId: string;
  title: string;
  img?: string;
  type: "project" | "issue";
  lastAccessed?: Date;
}

