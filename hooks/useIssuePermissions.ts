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
    // Only admin or reporter can edit
    if (isAdmin) return true;
    // Check if user is the reporter
    const reporterUid = typeof issue.reporter === "object" && issue.reporter ? issue.reporter.uid : issue.reporter;
    return user.uid === reporterUid;
  };

  const canDeleteIssue = (): boolean => {
    if (!user || !issue) return false;
    // Only admin or reporter can delete
    if (isAdmin) return true;
    // Check if user is the reporter
    const reporterUid = typeof issue.reporter === "object" && issue.reporter ? issue.reporter.uid : issue.reporter;
    return user.uid === reporterUid;
  };

  return {
    canEditIssue,
    canDeleteIssue,
  };
}

