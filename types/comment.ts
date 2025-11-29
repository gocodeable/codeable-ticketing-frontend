import { Attachment } from "./issue";

export interface CommentAuthor {
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  _id: string;
  issueId: string;
  authorId: string | CommentAuthor;
  message: string;
  attachments?: Attachment[];
  author?: CommentAuthor;
  createdAt?: string;
  updatedAt?: string;
}

