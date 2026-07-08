"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Issue } from "@/types/issue";
import { MemberRole, ProjectMember } from "@/types/project";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet } from "@/lib/api/apiClient";
import { IssueTypeIcon } from "@/components/IssueTypeIcon";
import { IssueDetailDialog } from "@/components/IssueDetailDialog";

interface ProjectEpicsProps {
  projectId: string;
  isAdmin: boolean;
  userRole?: MemberRole;
  projectMembers: ProjectMember[];
}

interface EpicStatusGroup {
  statusName: string;
  statusColor?: string;
  issues: Issue[];
}

interface NormalizedEpic {
  epic: Issue;
  groups: EpicStatusGroup[];
  done: number;
  total: number;
}

const isIssueLike = (v: any): v is Issue =>
  !!v && typeof v === "object" && "_id" in v && "title" in v;

// The backend groups children by status + gives a { done, total } rollup, but
// the exact field names aren't guaranteed. Normalize defensively so the UI
// works across shapes (array-of-groups, keyed map, or a flat children array).
function normalizeGroups(raw: any): EpicStatusGroup[] {
  if (!raw) return [];

  // Case 1: array
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    // Array of group objects: { status, issues|children }
    if (!isIssueLike(raw[0]) && (raw[0]?.issues || raw[0]?.children || raw[0]?.status)) {
      return raw.map((g: any) => {
        const status = g.status ?? g.workflowStatus;
        const statusName =
          status && typeof status === "object"
            ? status.name
            : typeof status === "string"
            ? status
            : g.name || "No status";
        const statusColor =
          status && typeof status === "object" ? status.color : g.color;
        return {
          statusName,
          statusColor,
          issues: (g.issues || g.children || []) as Issue[],
        };
      });
    }
    // Flat array of issues — group by their workflowStatus
    return groupFlatIssues(raw as Issue[]);
  }

  // Case 2: object keyed by status name
  if (typeof raw === "object") {
    return Object.entries(raw).map(([key, value]: [string, any]) => ({
      statusName: key,
      issues: Array.isArray(value) ? (value as Issue[]) : [],
    }));
  }

  return [];
}

function groupFlatIssues(issues: Issue[]): EpicStatusGroup[] {
  const map = new Map<string, EpicStatusGroup>();
  for (const child of issues) {
    const ws = child.workflowStatus;
    const statusName =
      ws && typeof ws === "object"
        ? ws.name
        : typeof ws === "string"
        ? ws
        : "No status";
    const statusColor =
      ws && typeof ws === "object" ? (ws as any).color : undefined;
    const existing = map.get(statusName);
    if (existing) {
      existing.issues.push(child);
    } else {
      map.set(statusName, { statusName, statusColor, issues: [child] });
    }
  }
  return Array.from(map.values());
}

const isDoneStatus = (name?: string, category?: string) =>
  (category || "").toLowerCase() === "done" ||
  (name || "").toLowerCase().trim() === "done";

function normalizeEpic(item: any): NormalizedEpic {
  const epic: Issue = item?.epic ?? item;
  const rollup = item?.rollup ?? item?.progress ?? (epic as any)?.rollup ?? {};
  const groups = normalizeGroups(
    item?.groups ??
      item?.childrenByStatus ??
      item?.statusGroups ??
      item?.children ??
      epic?.children
  );

  const allChildren = groups.flatMap((g) => g.issues);
  const total =
    typeof rollup.total === "number" ? rollup.total : allChildren.length;
  const done =
    typeof rollup.done === "number"
      ? rollup.done
      : groups
          .filter((g) => isDoneStatus(g.statusName))
          .reduce((n, g) => n + g.issues.length, 0);

  return { epic, groups, done, total };
}

export default function ProjectEpics({
  projectId,
  isAdmin,
  userRole,
  projectMembers,
}: ProjectEpicsProps) {
  const { user } = useAuth();
  const [epics, setEpics] = useState<NormalizedEpic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const fetchEpics = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await apiGet(
        `/api/issues/epics?projectId=${projectId}`,
        idToken
      );
      const data = await res.json();
      if (data.success) {
        const list: any[] = Array.isArray(data.data) ? data.data : [];
        setEpics(list.map(normalizeEpic).filter((e) => e.epic));
      } else {
        setError(data.error || "Failed to load epics");
      }
    } catch (err) {
      console.error("Error fetching epics:", err);
      setError("Failed to load epics");
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchEpics();
  }, [fetchEpics]);

  if (loading) {
    return (
      <div className="w-full h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[40vh] flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (epics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Zap className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Epics Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Create an issue with the type set to <strong>Epic</strong> to group
          related stories, tasks, and bugs here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {epics.map(({ epic, groups, done, total }, index) => {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <motion.div
            key={epic._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
          >
            <Card className="gap-4 py-5">
              <div className="px-6">
                {/* Epic header */}
                <button
                  type="button"
                  onClick={() => setSelectedIssueId(epic._id)}
                  className="flex items-center gap-2.5 text-left group"
                >
                  <IssueTypeIcon type="epic" className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {epic.issueCode}
                  </span>
                  <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {epic.title}
                  </h3>
                </button>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                    {done}/{total} done
                  </span>
                </div>
              </div>

              {/* Children grouped by status */}
              {groups.length > 0 && (
                <div className="px-6 space-y-4">
                  {groups.map((group) => (
                    <div key={group.statusName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: group.statusColor || "#3b82f6" }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.statusName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({group.issues.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-4">
                        {group.issues.map((child) => (
                          <button
                            key={child._id}
                            type="button"
                            onClick={() => setSelectedIssueId(child._id)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors text-left"
                          >
                            <IssueTypeIcon type={child.type} className="shrink-0" />
                            <span className="text-xs font-mono text-muted-foreground shrink-0">
                              {child.issueCode}
                            </span>
                            <span className="text-sm font-medium truncate flex-1">
                              {child.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}

      <IssueDetailDialog
        open={selectedIssueId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIssueId(null);
            // Refresh rollups after any edits made in the dialog
            fetchEpics();
          }
        }}
        issueId={selectedIssueId}
        isAdmin={isAdmin}
        userRole={userRole}
        projectMembers={projectMembers.map((member) => ({
          uid: member.uid,
          name: member.name,
          email: member.email || "",
          avatar: member.avatar,
        }))}
        onIssueUpdated={() => fetchEpics()}
        onIssueDeleted={() => fetchEpics()}
      />
    </div>
  );
}
