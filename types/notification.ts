export interface Notification {
  _id: string;
  userId: string;
  type: 'issue_assigned' | 'issue_updated' | 'issue_comment' | 'issue_status_changed' | 'comment_reply';
  title: string;
  message: string;
  issueId?: string;
  projectId?: string;
  read: boolean;
  metadata?: {
    assignerName?: string;
    assignerUid?: string;
    issueCode?: string;
    issueTitle?: string;
    commenterName?: string;
    commenterUid?: string;
    isReply?: boolean;
    parentCommentId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

