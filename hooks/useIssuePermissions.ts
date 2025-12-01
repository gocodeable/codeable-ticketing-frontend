"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Issue } from "@/types/issue";

interface UseIssuePermissionsProps {
  issue: Issue | null;
  isAdmin: boolean;
  userRole?: "admin" | "developer" | "qa";
}

export function useIssuePermissions({
  issue,
  isAdmin,
  userRole,
}: UseIssuePermissionsProps) {
  const { user } = useAuth();

  const canEditIssue = (): boolean => {
    if (!user || !issue) return false;
    if (isAdmin || userRole === "qa") return true;
    // Check if user is the reporter
    return user.uid === issue.reporter;
  };

  const canDeleteIssue = (): boolean => {
    if (!user || !issue) return false;
    if (isAdmin || userRole === "qa") return true;
    // Check if user is the reporter
    return user.uid === issue.reporter;
  };

  return {
    canEditIssue,
    canDeleteIssue,
  };
}

