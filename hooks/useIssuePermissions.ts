"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Issue } from "@/types/issue";

import { MemberRole } from "@/types/project";

interface UseIssuePermissionsProps {
  issue: Issue | null;
  isAdmin: boolean;
  userRole?: MemberRole;
}

export function useIssuePermissions({
  issue,
  isAdmin,
  userRole,
}: UseIssuePermissionsProps) {
  const { user } = useAuth();

  const canEditIssue = (): boolean => {
    if (!user || !issue) return false;
    // Only admin, PM, or reporter can edit
    if (isAdmin || userRole === "pm") return true;
    // Check if user is the reporter
    const reporterUid = typeof issue.reporter === "object" && issue.reporter ? issue.reporter.uid : issue.reporter;
    return user.uid === reporterUid;
  };

  const canDeleteIssue = (): boolean => {
    if (!user || !issue) return false;
    // Only admin, PM, or reporter can delete
    if (isAdmin || userRole === "pm") return true;
    // Check if user is the reporter
    const reporterUid = typeof issue.reporter === "object" && issue.reporter ? issue.reporter.uid : issue.reporter;
    return user.uid === reporterUid;
  };

  /**
   * Who can set the build QA should test. Wider than canEditIssue on
   * purpose — it matches who can move a ticket on the server
   * (assignee, reporter, admin, PM, QA), because the QA member swapping in
   * a rebuilt APK is usually neither reporter nor admin.
   */
  const canSetBuild = (): boolean => {
    if (!user || !issue) return false;
    if (isAdmin || userRole === "pm" || userRole === "qa") return true;
    const reporterUid =
      typeof issue.reporter === "object" && issue.reporter ? issue.reporter.uid : issue.reporter;
    const assigneeUid =
      typeof issue.assignee === "object" && issue.assignee ? issue.assignee.uid : issue.assignee;
    return user.uid === reporterUid || user.uid === assigneeUid;
  };

  return {
    canEditIssue,
    canDeleteIssue,
    canSetBuild,
  };
}

