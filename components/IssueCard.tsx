"use client";

import { Issue } from "@/types/issue";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { getPriorityColor, getInitials } from "@/utils/issueUtils";

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

export default function IssueCard({
  issue,
  onClick,
}: IssueCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              {issue.issueCode}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(
                issue.priority
              )}`}
            >
              {issue.priority || "medium"}
            </span>
          </div>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {issue.title}
          </h4>
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
