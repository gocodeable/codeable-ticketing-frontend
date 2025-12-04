"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet } from "@/lib/api/apiClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IssueDetailDialog } from "@/components/IssueDetailDialog";
import IssuesFilterBar from "@/components/IssuesFilterBar";
import {
  getPriorityColor,
  getStatusColor,
  getStatusName,
  getStatusObject,
  getStatusId,
  getReporterUid,
  getAssigneeUid,
} from "@/utils/issueUtils";

const INITIAL_LIMIT = 10;
const LOAD_MORE_LIMIT = 10;

interface IssuesTableProps {
  projectId: string;
  onIssuesCountChange?: (count: number) => void;
  isAdmin?: boolean;
  userRole?: "admin" | "developer" | "qa";
  projectMembers?: Array<{
    uid: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
}

interface ReporterInfo {
  uid: string;
  name: string;
  avatar?: string;
}

interface AssigneeInfo {
  uid: string;
  name: string;
  avatar?: string;
}

export default function IssuesTable({
  projectId,
  onIssuesCountChange,
  isAdmin = false,
  userRole,
  projectMembers = [],
}: IssuesTableProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporters, setReporters] = useState<Map<string, ReporterInfo>>(
    new Map()
  );
  const [assignees, setAssignees] = useState<Map<string, AssigneeInfo>>(
    new Map()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);
  const [allIssuesForFilters, setAllIssuesForFilters] = useState<Issue[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  const fetchIssues = useCallback(
    async (isInitial = false, skip = 0) => {
      if (!user || !projectId) return;

      if (isInitial) {
        setLoading(true);
        skipRef.current = 0;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const idToken = await user.getIdToken();

        // Fetch workflow statuses (only on initial load)
        if (isInitial) {
          const statusesRes = await apiGet(
            `/api/workflow-statuses/${projectId}`,
            idToken
          );
          const statusesData = await statusesRes.json();
          if (statusesData.success) {
            setStatuses(statusesData.data || []);
          }
        }

        // Fetch issues with pagination (no filters on backend)
        const limit = isInitial ? INITIAL_LIMIT : LOAD_MORE_LIMIT;
        const response = await apiGet(
          `/api/issues?projectId=${projectId}&limit=${limit}&skip=${skip}&table=true`,
          idToken
        );
        const data = await response.json();

        if (data.success) {
          const fetchedIssues = data.data || [];
          if (isInitial) {
            setIssues(fetchedIssues);
          } else {
            setIssues((prev) => [...prev, ...fetchedIssues]);
          }

          setHasMore(data.pagination?.hasMore ?? false);
          skipRef.current = skip + fetchedIssues.length;

          if (onIssuesCountChange && isInitial) {
            onIssuesCountChange(data.pagination?.total || fetchedIssues.length);
          }

          const assigneeMap = new Map<string, AssigneeInfo>();
          fetchedIssues.forEach((issue: Issue) => {
            if (issue.assignee) {
              if (typeof issue.assignee === "object" && issue.assignee.uid) {
                // Already populated assignee object
                assigneeMap.set(issue.assignee.uid, {
                  uid: issue.assignee.uid,
                  name: issue.assignee.name,
                  avatar: issue.assignee.avatar,
                });
              } else if (typeof issue.assignee === "string") {
                // Assignee is just a UID string, we'll fetch it
                if (!assigneeMap.has(issue.assignee)) {
                  assigneeMap.set(issue.assignee, {
                    uid: issue.assignee,
                    name: "",
                    avatar: undefined,
                  });
                }
              }
            }
          });

          // Only fetch assignee/reporter info on initial load or when needed
          if (isInitial || fetchedIssues.length > 0) {
            const issuesToProcess = isInitial ? fetchedIssues : fetchedIssues;

            const assigneeMap = new Map<string, AssigneeInfo>();
            issuesToProcess.forEach((issue: Issue) => {
              if (issue.assignee) {
                if (typeof issue.assignee === "object" && issue.assignee.uid) {
                  assigneeMap.set(issue.assignee.uid, {
                    uid: issue.assignee.uid,
                    name: issue.assignee.name,
                    avatar: issue.assignee.avatar,
                  });
                } else if (typeof issue.assignee === "string") {
                  if (!assigneeMap.has(issue.assignee)) {
                    assigneeMap.set(issue.assignee, {
                      uid: issue.assignee,
                      name: "",
                      avatar: undefined,
                    });
                  }
                }
              }
            });

            // Fetch assignee information for UIDs that don't have full info
            const assigneeUidsToFetch = Array.from(assigneeMap.values())
              .filter((a) => !a.name)
              .map((a) => a.uid);

            if (assigneeUidsToFetch.length > 0) {
              await Promise.all(
                assigneeUidsToFetch.map(async (uid) => {
                  try {
                    const userResponse = await apiGet(
                      `/api/user?uid=${uid}`,
                      idToken
                    );
                    const userData = await userResponse.json();
                    if (userData.success && userData.data) {
                      assigneeMap.set(uid, {
                        uid: userData.data.uid,
                        name: userData.data.name,
                        avatar: userData.data.avatar,
                      });
                    }
                  } catch (err) {
                    console.error(`Error fetching assignee ${uid}:`, err);
                  }
                })
              );
            }

            if (isInitial) {
              setAssignees(assigneeMap);
            } else {
              setAssignees((prev) => {
                const merged = new Map(prev);
                assigneeMap.forEach((value, key) => merged.set(key, value));
                return merged;
              });
            }

            // Fetch reporter information for all unique reporters
            const reporterUids: string[] = Array.from(
              new Set(
                issuesToProcess
                  .map((issue: Issue) => getReporterUid(issue.reporter))
                  .filter((uid: string | null): uid is string => Boolean(uid))
              )
            );

            if (reporterUids.length > 0) {
              const reporterMap = new Map<string, ReporterInfo>();

              // Fetch each reporter's info
              await Promise.all(
                reporterUids.map(async (uid: string) => {
                  try {
                    const userResponse = await apiGet(
                      `/api/user?uid=${uid}`,
                      idToken
                    );
                    const userData = await userResponse.json();
                    if (userData.success && userData.data) {
                      reporterMap.set(uid, {
                        uid: userData.data.uid,
                        name: userData.data.name,
                        avatar: userData.data.avatar,
                      });
                    }
                  } catch (err) {
                    console.error(`Error fetching reporter ${uid}:`, err);
                  }
                })
              );

              if (isInitial) {
                setReporters(reporterMap);
              } else {
                setReporters((prev) => {
                  const merged = new Map(prev);
                  reporterMap.forEach((value, key) => merged.set(key, value));
                  return merged;
                });
              }
            }
          }
        } else {
          setError(data.error || "Failed to fetch issues");
          if (isInitial) {
            setIssues([]);
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("Error fetching issues:", err);
        setError("Failed to load issues. Please try again.");
        if (isInitial) {
          setIssues([]);
          setHasMore(false);
        }
      } finally {
        if (isInitial) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [user, projectId, onIssuesCountChange]
  );

  useEffect(() => {
    fetchIssues(true, 0);
  }, [projectId, user, fetchIssues]);


  useEffect(() => {
    const hasActiveFilters =
      searchQuery.trim() !== "" ||
      priorityFilter !== "all" ||
      statusFilter !== "all" ||
      assigneeFilter.length > 0;

    const fetchAllIssuesForFilters = async () => {
      if (!user || !projectId || !hasActiveFilters) {
        setAllIssuesForFilters([]);
        return;
      }

      setFilterLoading(true);
      try {
        const idToken = await user.getIdToken();
        // Fetch a large number for filtering
        const response = await apiGet(
          `/api/issues?projectId=${projectId}&limit=1000&skip=0&table=true`,
          idToken
        );
        const data = await response.json();
        if (data.success) {
          setAllIssuesForFilters(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching issues for filters:", error);
        setAllIssuesForFilters([]);
      } finally {
        setFilterLoading(false);
      }
    };

    // Debounce filter changes
    const timeoutId = setTimeout(() => {
      fetchAllIssuesForFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    user,
    projectId,
  ]);

  // Intersection Observer for infinite scroll (only when no filters)
  useEffect(() => {
    const hasActiveFilters =
      searchQuery.trim() !== "" ||
      priorityFilter !== "all" ||
      statusFilter !== "all" ||
      assigneeFilter.length > 0;

    // Don't set up observer if filters are active or already loading
    if (hasActiveFilters || loading || loadingMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading
        ) {
          const currentSkip = skipRef.current;
          fetchIssues(false, currentSkip);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    hasMore,
    loadingMore,
    loading,
    searchQuery,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    fetchIssues,
  ]);


  const getReporterInfo = (
    reporterUid: string | undefined
  ): ReporterInfo | null => {
    if (!reporterUid) return null;
    return reporters.get(reporterUid) || null;
  };

  // Filter issues based on search query, priority, status, and assignee (frontend filtering)
  const filteredIssues = useMemo(() => {
    // Use allIssuesForFilters when filters are active, otherwise use paginated issues
    const hasActiveFilters =
      searchQuery.trim() !== "" ||
      priorityFilter !== "all" ||
      statusFilter !== "all" ||
      assigneeFilter.length > 0;

    const issuesToFilter =
      hasActiveFilters && allIssuesForFilters.length > 0
        ? allIssuesForFilters
        : issues;
    let filtered = [...issuesToFilter];

    // Filter by search query (title or code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          (issue.issueCode?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (issue) => (issue.priority || "medium") === priorityFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => {
        const statusId = getStatusId(issue);
        return statusId === statusFilter;
      });
    }

    // Filter by assignee
    if (assigneeFilter.length > 0) {
      filtered = filtered.filter((issue) => {
        const assigneeUid = getAssigneeUid(issue.assignee);
        const isUnassigned = !issue.assignee;

        // If "unassigned" is selected and issue is unassigned, include it
        if (assigneeFilter.includes("unassigned") && isUnassigned) {
          return true;
        }

        // If assignee UID is in the selected filters, include it
        if (assigneeUid && assigneeFilter.includes(assigneeUid)) {
          return true;
        }

        return false;
      });
    }

    return filtered;
  }, [
    issues,
    searchQuery,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    statuses,
    allIssuesForFilters,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setAssigneeFilter([]);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    priorityFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter.length > 0;

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading issues...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-border/40 dark:border-border/60 bg-card shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to Load Issues
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="w-full rounded-xl border border-border/40 dark:border-border/60 bg-card shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Issues Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          This project doesn't have any issues. Create your first issue to get
          started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Search and Filter Bar */}
      <IssuesFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={statuses}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        assignees={assignees}
        onRefresh={fetchIssues}
        loading={loading}
        showClearFilters={true}
        onClearFilters={clearFilters}
      />

      {/* Results Count - Show when filters are active */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground font-medium">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredIssues.length}
            </span>{" "}
            {filteredIssues.length === 1 ? "issue" : "issues"}
            {!hasMore && " (all loaded)"}
          </p>
        </div>
      )}

      {/* Table */}
      {filteredIssues.length === 0 ? (
        <div className="w-full rounded-xl border border-border/40 dark:border-border/60 bg-linear-to-br from-muted/30 via-background to-muted/20 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Matching Issues
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            No issues match your current filters. Try adjusting your search or
            filter criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="w-full rounded-md border border-border/40 dark:border-border/60 shadow-sm overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/40 via-muted/30 to-muted/40 border-b border-border/40 dark:border-border/60 hover:bg-linear-to-r hover:from-muted/40 hover:via-muted/30 hover:to-muted/40">
                <TableHead className="w-[110px] font-semibold text-foreground/80 h-12 pl-4">
                  Code
                </TableHead>
                <TableHead className="w-[200px] font-semibold text-foreground/80">
                  Title
                </TableHead>
                <TableHead className="w-[140px] font-semibold text-foreground/80">
                  Status
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-foreground/80">
                  Priority
                </TableHead>
                <TableHead className="w-[170px] font-semibold text-foreground/80">
                  Assignee
                </TableHead>
                <TableHead className="w-[170px] font-semibold text-foreground/80 pr-4">
                  Reporter
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue, index) => {
                const reporterUid = getReporterUid(issue.reporter);
                const reporterInfo = getReporterInfo(reporterUid || undefined);
                const isEven = index % 2 === 0;
                return (
                  <TableRow
                    key={issue._id}
                    onClick={() => setSelectedIssueId(issue._id)}
                    className={cn(
                      "border-b border-border/30 dark:border-border/40 transition-all duration-150",
                      "hover:bg-muted/40 hover:shadow-sm cursor-pointer",
                      isEven ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary/70 dark:text-primary/60 py-4 pl-4">
                      {issue.issueCode || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground w-[200px] py-4">
                      <span className="line-clamp-2 leading-relaxed">
                        {issue.title}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                          getStatusColor(
                            getStatusObject(issue, statuses)?.color
                          )
                        )}
                      >
                        {getStatusName(issue, statuses)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span
                        className={cn(
                          "inline-flex items-center text-xs px-2.5 py-1.5 rounded-md border font-semibold uppercase tracking-wide",
                          getPriorityColor(issue.priority || "medium")
                        )}
                      >
                        {issue.priority || "medium"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {issue.assignee && typeof issue.assignee === "object" ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-background shadow-sm shrink-0">
                            <Image
                              src={issue.assignee.avatar || DEFAULT_AVATAR}
                              alt={issue.assignee.name}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm text-foreground font-medium truncate">
                            {issue.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 pr-4">
                      {reporterInfo ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-background shadow-sm shrink-0">
                            <Image
                              src={reporterInfo.avatar || DEFAULT_AVATAR}
                              alt={reporterInfo.name}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm text-foreground font-medium truncate">
                            {reporterInfo.name}
                          </span>
                        </div>
                      ) : issue.reporter ? (
                        <span className="text-sm text-muted-foreground truncate">
                          {typeof issue.reporter === "object"
                            ? issue.reporter.name
                            : issue.reporter}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Loading indicator and observer target for infinite scroll */}
      {!hasActiveFilters && (
        <>
          <div ref={observerTarget} className="h-10" />
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading more issues...
              </span>
            </div>
          )}
          {!hasMore && issues.length >= INITIAL_LIMIT && (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">
                No more issues to load
              </span>
            </div>
          )}
        </>
      )}

      {/* Filter loading indicator */}
      {hasActiveFilters && filterLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading filtered issues...
          </span>
        </div>
      )}

      <IssueDetailDialog
        open={selectedIssueId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null);
        }}
        issueId={selectedIssueId}
        isAdmin={isAdmin}
        userRole={userRole}
        projectMembers={projectMembers}
        onIssueUpdated={(updatedIssue) => {
          setIssues((prevIssues) =>
            prevIssues.map((issue) =>
              issue._id === updatedIssue._id ? updatedIssue : issue
            )
          );
          fetchIssues();
        }}
      />
    </div>
  );
}
