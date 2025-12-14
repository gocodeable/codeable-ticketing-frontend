"use client";

import { useMemo } from "react";
import Link from "next/link";
import { UserCheck, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Issue } from "@/types/issue";
import { ProjectMember } from "@/types/project";

interface WorkloadDistributionProps {
  issues: Issue[];
  members?: (string | ProjectMember)[];
  loading?: boolean;
}

interface WorkloadItem {
  member: ProjectMember;
  issueCount: number;
  percentage: number;
}

export function WorkloadDistribution({ issues, members, loading = false }: WorkloadDistributionProps) {
  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Calculate workload distribution
  const workloadDistribution = useMemo(() => {
    if (!issues || issues.length === 0 || !members) return [];

    // Get all project members with their details
    const membersMap = new Map<string, ProjectMember>();
    members.forEach((member: any) => {
      if (typeof member === 'string') {
        membersMap.set(member, { uid: member, name: 'Unknown', email: '', avatar: undefined });
      } else {
        membersMap.set(member.uid, member);
      }
    });

    // Count issues assigned to each member
    const issueCounts = new Map<string, number>();
    let totalAssignedIssues = 0;

    issues.forEach((issue) => {
      if (!issue.assignee) return;
      
      let assigneeUid: string | null = null;
      if (typeof issue.assignee === 'string') {
        assigneeUid = issue.assignee;
      } else if (issue.assignee.uid) {
        assigneeUid = issue.assignee.uid;
      }

      if (assigneeUid && membersMap.has(assigneeUid)) {
        const count = issueCounts.get(assigneeUid) || 0;
        issueCounts.set(assigneeUid, count + 1);
        totalAssignedIssues++;
      }
    });

    // Create workload data for each member
    const workloadData: WorkloadItem[] = Array.from(membersMap.entries())
      .map(([uid, member]) => {
        const issueCount = issueCounts.get(uid) || 0;
        const percentage = totalAssignedIssues > 0 
          ? Math.round((issueCount / totalAssignedIssues) * 100) 
          : 0;
        
        return {
          member,
          issueCount,
          percentage,
        };
      })
      .filter((item) => item.issueCount > 0) // Only show members with assigned issues
      .sort((a, b) => b.issueCount - a.issueCount); // Sort by issue count descending

    return workloadData;
  }, [issues, members]);

  return (
    <div className="rounded-lg bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Workload Distribution
          </h3>
        </div>
        {workloadDistribution.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {workloadDistribution.length} member{workloadDistribution.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : workloadDistribution.length > 0 ? (
        <div className="space-y-3">
          {workloadDistribution.map((item) => (
            <Link
              key={item.member.uid}
              href={`/profile/${item.member.uid}`}
              className="flex items-center gap-3 hover:bg-accent rounded-lg p-2.5 -ml-1 transition-all group"
            >
              <Avatar className="w-9 h-9 ring-2 ring-primary/20 shadow-sm shrink-0">
                <AvatarImage
                  src={item.member.avatar || ''}
                  alt={item.member.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(item.member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate w-[140px] shrink-0">
                {item.member.name}
              </span>
              <div className="ml-auto w-80 h-2.5 bg-muted rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {item.issueCount} issue{item.issueCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {item.percentage}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No issues assigned to members
        </p>
      )}
    </div>
  );
}

