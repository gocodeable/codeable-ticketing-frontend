/**
 * Utility functions for issue-related operations
 */

import { Issue, IssueReporter, IssueAssignee } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";

export const getTypeColor = (type?: string): string => {
  switch (type) {
    case "bug":
      return "bg-red-500";
    case "story":
      return "bg-green-500";
    case "epic":
      return "bg-purple-500";
    default:
      return "bg-blue-500";
  }
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const getPriorityColor = (priority: string): string => {
  const p = priority || "medium";
  switch (p.toLowerCase()) {
    case "highest":
      return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 dark:border-red-500/30";
    case "high":
      return "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30";
    case "medium":
      return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/30";
    case "low":
      return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30";
    case "lowest":
      return "bg-muted/50 text-muted-foreground border-border/40 dark:border-border/60";
    default:
      return "bg-muted/50 text-muted-foreground border-border/40 dark:border-border/60";
  }
};

export const getPriorityIconName = (priority: string): "ChevronsUp" | "ChevronUp" | "Equal" | "ChevronDown" | "ChevronsDown" => {
  const p = priority || "medium";
  switch (p.toLowerCase()) {
    case "highest":
      return "ChevronsUp";
    case "high":
      return "ChevronUp";
    case "medium":
      return "Equal";
    case "low":
      return "ChevronDown";
    case "lowest":
      return "ChevronsDown";
    default:
      return "Equal";
  }
};

export const getPriorityLabel = (priority: string): string => {
  const p = priority || "medium";
  switch (p.toLowerCase()) {
    case "highest":
      return "Highest";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    case "lowest":
      return "Lowest";
    default:
      return "Medium";
  }
};

export const getStatusColor = (statusColor?: string): string => {
  const color = statusColor || "gray";
  switch (color.toLowerCase()) {
    case "blue":
      return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30";
    case "purple":
      return "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30";
    case "yellow":
      return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/30";
    case "orange":
      return "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30";
    case "red":
      return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20 dark:border-red-500/30";
    case "green":
      return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20 dark:border-green-500/30";
    case "gray":
    default:
      return "bg-muted/50 text-muted-foreground border-border/40 dark:border-border/60";
  }
};

/**
 * Get the status name from an issue
 */
export const getStatusName = (issue: Issue, statuses: WorkflowStatus[]): string => {
  if (typeof issue.workflowStatus === "string") {
    // Try to find status name from statuses array
    const status = statuses.find((s) => s._id === issue.workflowStatus);
    return status?.name || issue.workflowStatus;
  }
  return issue.workflowStatus?.name || "Unknown";
};

/**
 * Get the status object from an issue
 */
export const getStatusObject = (issue: Issue, statuses: WorkflowStatus[]): WorkflowStatus | undefined => {
  if (typeof issue.workflowStatus === "string") {
    return statuses.find((s) => s._id === issue.workflowStatus);
  }
  const statusId = issue.workflowStatus?._id || issue.workflowStatus?.toString();
  if (statusId) {
    return statuses.find((s) => s._id === statusId);
  }
  return undefined;
};

/**
 * Get the status ID from an issue
 */
export const getStatusId = (issue: Issue): string | null => {
  if (typeof issue.workflowStatus === "string") {
    return issue.workflowStatus;
  }
  return issue.workflowStatus?._id || null;
};

/**
 * Get the reporter UID from an issue reporter
 */
export const getReporterUid = (reporter: string | IssueReporter | null | undefined): string | null => {
  if (!reporter) return null;
  if (typeof reporter === "object" && reporter.uid) {
    return reporter.uid;
  }
  if (typeof reporter === "string") {
    return reporter;
  }
  return null;
};

/**
 * Get the assignee UID from an issue assignee
 */
export const getAssigneeUid = (assignee: string | IssueAssignee | null | undefined): string | null => {
  if (!assignee) return null;
  if (typeof assignee === "object" && assignee.uid) {
    return assignee.uid;
  }
  if (typeof assignee === "string") {
    return assignee;
  }
  return null;
};

/**
 * Get initials from a name (2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name) return "U";
  const words = name.trim().split(' ').filter(w => w.length > 0);
  if (words.length === 0) return "U";
  if (words.length === 1) {
    // Single word - take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  }
  // Multiple words - take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
};

