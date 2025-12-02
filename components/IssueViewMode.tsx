"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Issue, Attachment } from "@/types/issue";
import { File, Download, User, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";

interface IssueViewModeProps {
  issue: Issue;
  downloadingAttachments: Set<string>;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
}

export function IssueViewMode({
  issue,
  downloadingAttachments,
  onDownload,
}: IssueViewModeProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {issue.description && (
        <div className="space-y-2.5">
          <Label className="text-sm font-semibold text-foreground">Description</Label>
          <div className="rounded-lg bg-muted/30 border border-border/40 dark:border-border/60 p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </p>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Assignee */}
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Assignee
          </Label>
          {issue.assignee && typeof issue.assignee === "object" ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={issue.assignee.avatar || DEFAULT_AVATAR}
                  alt={issue.assignee.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">{issue.assignee.name}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 dark:border-border/60 border-dashed">
              <span className="text-sm text-muted-foreground">Unassigned</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {issue.estimatedCompletionDate && (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Due Date
            </Label>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <p className="text-sm font-medium">
                {format(new Date(issue.estimatedCompletionDate), "PPP")}
              </p>
            </div>
          </div>
        )}

        {/* Created At */}
        {issue.createdAt && (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Created
            </Label>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <p className="text-sm font-medium">
                {format(new Date(issue.createdAt), "PPP")}
              </p>
            </div>
          </div>
        )}

        {/* Updated At */}
        {issue.updatedAt && (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Updated
            </Label>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <p className="text-sm font-medium">
                {format(new Date(issue.updatedAt), "PPP")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attachments */}
      {issue.attachments && issue.attachments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <File className="w-4 h-4" />
            Attachments ({issue.attachments.length})
          </Label>
          <div className="space-y-2">
            {issue.attachments.map((attachment, index) => {
              const attachmentId = (attachment as any)._id || attachment.link;
              const isDownloading = downloadingAttachments.has(attachmentId);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                    <File className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.fileName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(attachment, attachmentId)}
                    disabled={isDownloading}
                    className="gap-2 rounded-lg shrink-0"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

