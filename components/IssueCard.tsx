"use client";

import { Issue } from "@/types/issue";
import Image from "next/image";
import { MessageCircle, CornerDownRight } from "lucide-react";
import { getPriorityColor, getInitials } from "@/utils/issueUtils";
import { PriorityIcon } from "@/components/PriorityIcon";
import { IssueTypeIcon } from "@/components/IssueTypeIcon";

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

export default function IssueCard({
  issue,
  onClick,
}: IssueCardProps) {
  // Epic chip: only when the parent is populated and is an epic.
  const parentEpic =
    issue.parent && typeof issue.parent === "object" && issue.parent.type === "epic"
      ? issue.parent
      : null;
  const childCount = issue.childCount || 0;
  // An epic's direct children are stories/tasks/bugs, not subtasks — label by type.
  const childNoun = issue.type === "epic" ? "issue" : "subtask";

  return (
    <div
      onClick={onClick}
      className="p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IssueTypeIcon type={issue.type} className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-mono text-muted-foreground">
              {issue.issueCode}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getPriorityColor(
                issue.priority
              )}`}
            >
              <PriorityIcon priority={issue.priority || "medium"} className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {issue.title}
          </h4>
          {(parentEpic || childCount > 0) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {parentEpic && (
                <span className="inline-flex items-center gap-1 max-w-[140px] px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400">
                  <IssueTypeIcon type="epic" className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-medium truncate">
                    {parentEpic.issueCode || parentEpic.title}
                  </span>
                </span>
              )}
              {childCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 bg-muted/40 text-muted-foreground">
                  <CornerDownRight className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-medium">
                    {childCount} {childNoun}{childCount === 1 ? "" : "s"}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {issue.assignee && typeof issue.assignee === "object" ? (
          <div className="flex items-center gap-1.5">
            <div className="relative h-5 w-5 rounded-full overflow-hidden ring-1 ring-background">
              {issue.assignee.avatar ? (
                <Image
                  src={issue.assignee.avatar}
                  alt={issue.assignee.name}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-primary">
                    {getInitials(issue.assignee.name)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {issue.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}

        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {issue.commentCount}
        </span>
      </div>
    </div>
  );
}
