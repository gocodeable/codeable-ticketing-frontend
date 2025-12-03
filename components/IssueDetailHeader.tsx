"use client";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Issue } from "@/types/issue";
import { Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTypeColor, getPriorityColor } from "../utils/issueUtils";

interface IssueDetailHeaderProps {
  issue: Issue;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  editTitle: string;
}

export function IssueDetailHeader({
  issue,
  isEditing,
  isSaving,
  canEdit,
  canDelete,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onClose,
  editTitle,
}: IssueDetailHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-muted/50 via-background to-muted/30 border-b border-border/40 dark:border-border/60">
      <div className="px-6 sm:px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-primary bg-primary/10 dark:bg-primary/15 px-2.5 py-1 rounded-md border border-primary/20">
                    {issue.issueCode}
                  </span>
                  {issue.type && (
                    <span
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-md text-white",
                        getTypeColor(issue.type)
                      )}
                    >
                      {issue.type.toUpperCase()}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-md border",
                      getPriorityColor(issue.priority || "medium")
                    )}
                  >
                    {(issue.priority || "medium").toUpperCase()}
                  </span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-foreground">
                  {issue.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />
                  {typeof issue.workflowStatus === "object" && issue.workflowStatus
                    ? issue.workflowStatus.name
                    : "Unknown Status"}
                </DialogDescription>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-primary bg-primary/10 dark:bg-primary/15 px-2.5 py-1 rounded-md border border-primary/20">
                    {issue.issueCode}
                  </span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-foreground">
                  Edit Issue
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Update issue details and attachments
                </DialogDescription>
              </>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="gap-2 rounded-lg"
              >
                <span className="hidden sm:inline">Close</span>
              </Button>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2 rounded-lg"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="gap-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                disabled={isSaving}
                className="gap-2 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving || !editTitle.trim()}
                className="gap-2 rounded-lg bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

