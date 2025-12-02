"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Comment } from "@/types/comment";
import { MessageCircle, File, Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";

interface IssueCommentsSectionProps {
  comments?: Comment[];
  commentCount?: number;
  downloadingAttachments: Set<string>;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
}

export function IssueCommentsSection({
  comments,
  commentCount,
  downloadingAttachments,
  onDownload,
}: IssueCommentsSectionProps) {
  return (
    <div className="w-[40%] min-w-[400px] max-w-[550px] overflow-y-auto bg-muted/20">
      <div className="px-6 py-6 h-full">
        <div className="space-y-3 h-full flex flex-col">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments?.length || commentCount || 0})
          </Label>
          {comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="p-4 rounded-lg border border-border/40 dark:border-border/60 bg-muted/30"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {(() => {
                      const author =
                        comment.author ||
                        (typeof comment.authorId === "object"
                          ? comment.authorId
                          : null);
                      return author ? (
                        <>
                          <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-background shrink-0">
                            <Image
                              src={author.avatar || DEFAULT_AVATAR}
                              alt={author.name || "User"}
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">
                              {author.name || "Unknown User"}
                            </p>
                            {comment.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "PPP 'at' p")}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Unknown Author
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed ml-12">
                    {comment.message}
                  </p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 ml-12 space-y-2">
                      {comment.attachments.map((attachment, index) => {
                        const attachmentId = `${comment._id}-${index}`;
                        const isDownloading = downloadingAttachments.has(attachmentId);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                          >
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs truncate flex-1 font-medium">
                              {attachment.fileName}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload(attachment, attachmentId)}
                              disabled={isDownloading}
                              className="h-7 px-2 rounded-md"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

