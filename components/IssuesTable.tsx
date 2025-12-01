"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Issue, IssueAssignee } from "@/types/issue";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { Loader2, AlertCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IssueDetailDialog } from "@/components/IssueDetailDialog";

interface IssuesTableProps {
  projectId: string;
  onIssuesCountChange?: (count: number) => void;
  isAdmin?: boolean;
  userRole?: "admin" | "developer" | "qa";
  projectMembers?: Array<{ uid: string; name: string; email: string; avatar?: string }>;
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
  const [error, setError] = useState<string | null>(null);
  const [reporters, setReporters] = useState<Map<string, ReporterInfo>>(new Map());
  const [assignees, setAssignees] = useState<Map<string, AssigneeInfo>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
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

  const fetchIssues = async () => {
    if (!user || !projectId) return;

    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      
      // Fetch workflow statuses
      const statusesRes = await apiGet(
        `/api/workflow-statuses/${projectId}`,
        idToken
      );
      const statusesData = await statusesRes.json();
      if (statusesData.success) {
        setStatuses(statusesData.data || []);
      }

      // Fetch issues
      const response = await apiGet(`/api/issues?projectId=${projectId}`, idToken);
      const data = await response.json();

      if (data.success) {
        const fetchedIssues = data.data || [];
        setIssues(fetchedIssues);
 
        if (onIssuesCountChange) {
          onIssuesCountChange(fetchedIssues.length);
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

        // Fetch assignee information for UIDs that don't have full info
        const assigneeUidsToFetch = Array.from(assigneeMap.values())
          .filter(a => !a.name)
          .map(a => a.uid);

        if (assigneeUidsToFetch.length > 0) {
          await Promise.all(
            assigneeUidsToFetch.map(async (uid) => {
              try {
                const userResponse = await apiGet(`/api/user?uid=${uid}`, idToken);
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
        
        setAssignees(assigneeMap);
        
        // Fetch reporter information for all unique reporters
        const reporterUids = [
          ...new Set(
            (data.data || [])
              .map((issue: Issue) => issue.reporter)
              .filter(Boolean)
          ),
        ] as string[];

        if (reporterUids.length > 0) {
          const reporterMap = new Map<string, ReporterInfo>();
          
          // Fetch each reporter's info
          await Promise.all(
            reporterUids.map(async (uid) => {
              try {
                const userResponse = await apiGet(`/api/user?uid=${uid}`, idToken);
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
          
          setReporters(reporterMap);
        }
      } else {
        setError(data.error || "Failed to fetch issues");
        setIssues([]);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError("Failed to load issues. Please try again.");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId, user]);

  const getStatusName = (issue: Issue): string => {
    if (typeof issue.workflowStatus === "string") {
      // Try to find status name from statuses array
      const status = statuses.find((s) => s._id === issue.workflowStatus);
      return status?.name || issue.workflowStatus;
    }
    return issue.workflowStatus?.name || "Unknown";
  };

  const getStatusId = (issue: Issue): string | null => {
    if (typeof issue.workflowStatus === "string") {
      return issue.workflowStatus;
    }
    return issue.workflowStatus?._id || null;
  };

  const getReporterInfo = (reporterUid: string | undefined): ReporterInfo | null => {
    if (!reporterUid) return null;
    return reporters.get(reporterUid) || null;
  };

  const getAssigneeUid = (assignee: string | IssueAssignee | null | undefined): string | null => {
    if (!assignee) return null;
    if (typeof assignee === "object" && assignee.uid) {
      return assignee.uid;
    }
    if (typeof assignee === "string") {
      return assignee;
    }
    return null;
  };

  // Filter issues based on search query, priority, status, and assignee
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

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
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        filtered = filtered.filter((issue) => !issue.assignee);
      } else {
        filtered = filtered.filter((issue) => {
          const assigneeUid = getAssigneeUid(issue.assignee);
          return assigneeUid === assigneeFilter;
        });
      }
    }

    return filtered;
  }, [issues, searchQuery, priorityFilter, statusFilter, assigneeFilter, statuses]);

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setAssigneeFilter("all");
    setAssigneeSearchQuery("");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || priorityFilter !== "all" || statusFilter !== "all" || assigneeFilter !== "all";

  // Filter assignees based on search query
  const filteredAssignees = useMemo(() => {
    const assigneesList = Array.from(assignees.values());
    if (!assigneeSearchQuery.trim()) {
      return assigneesList;
    }
    const query = assigneeSearchQuery.toLowerCase();
    return assigneesList.filter(
      (assignee) =>
        assignee.name.toLowerCase().includes(query) ||
        assignee.uid.toLowerCase().includes(query)
    );
  }, [assignees, assigneeSearchQuery]);

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeDropdown(false);
      }
    };

    if (showAssigneeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showAssigneeDropdown]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading issues...</p>
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Issues</h3>
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
        <h3 className="text-lg font-semibold text-foreground mb-2">No Issues Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">This project doesn't have any issues. Create your first issue to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Search and Filter Bar */}
      <div className="w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/30 dark:bg-muted/20 rounded-xl p-4 border border-border/40 dark:border-border/60">
        {/* Search Bar */}
        <div className="relative flex-1 w-full sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 bg-background border-border/60 dark:border-border/40 shadow-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-md hover:bg-muted"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border/60 dark:border-border/40 shadow-sm">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="highest">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Highest
              </span>
            </SelectItem>
            <SelectItem value="high">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                High
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium
              </span>
            </SelectItem>
            <SelectItem value="low">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Low
              </span>
            </SelectItem>
            <SelectItem value="lowest">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Lowest
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border/60 dark:border-border/40 shadow-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status._id} value={status._id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <div className="relative w-full sm:w-[180px]" ref={assigneeDropdownRef}>
          <div
            className="w-full h-10 bg-background border border-border/60 dark:border-border/40 rounded-md shadow-sm px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              setShowAssigneeDropdown(!showAssigneeDropdown);
              if (!showAssigneeDropdown) {
                setAssigneeSearchQuery("");
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {assigneeFilter === "all" ? (
                <span className="text-sm text-muted-foreground">All Assignees</span>
              ) : (
                (() => {
                  const selectedAssignee = assignees.get(assigneeFilter);
                  return selectedAssignee ? (
                    <>
                      <div className="relative h-5 w-5 rounded-full overflow-hidden ring-1 ring-background shrink-0">
                        <Image
                          src={selectedAssignee.avatar || DEFAULT_AVATAR}
                          alt={selectedAssignee.name}
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-foreground font-medium truncate">
                        {selectedAssignee.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  );
                })()
              )}
            </div>
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>

          {showAssigneeDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search assignees..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    className="pl-8 pr-4 h-9 text-sm"
                    autoFocus
                  />
                  {assigneeSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-md hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssigneeSearchQuery("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeFilter("all");
                    setShowAssigneeDropdown(false);
                    setAssigneeSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border",
                    assigneeFilter === "all" && "bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">All Assignees</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeFilter("unassigned");
                    setShowAssigneeDropdown(false);
                    setAssigneeSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border",
                    assigneeFilter === "unassigned" && "bg-muted"
                  )}
                >
                  <span className="text-sm text-muted-foreground italic">Unassigned</span>
                </button>
                {filteredAssignees.length > 0 ? (
                  filteredAssignees.map((assignee) => (
                    <button
                      key={assignee.uid}
                      type="button"
                      onClick={() => {
                        setAssigneeFilter(assignee.uid);
                        setShowAssigneeDropdown(false);
                        setAssigneeSearchQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border last:border-0",
                        assigneeFilter === assignee.uid && "bg-muted"
                      )}
                    >
                      <div className="shrink-0 relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-border">
                        <Image
                          src={assignee.avatar || DEFAULT_AVATAR}
                          alt={assignee.name}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium truncate">{assignee.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No assignees found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full sm:w-auto h-10 gap-2 border-border/60 dark:border-border/40 hover:bg-muted shadow-sm"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Count - Only show when filters are active */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="font-semibold text-foreground">{filteredIssues.length}</span> of{" "}
            <span className="font-semibold text-foreground">{issues.length}</span> {issues.length === 1 ? "issue" : "issues"}
          </p>
        </div>
      )}

      {/* Table */}
      {filteredIssues.length === 0 ? (
        <div className="w-full rounded-xl border border-border/40 dark:border-border/60 bg-linear-to-br from-muted/30 via-background to-muted/20 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Matching Issues</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">No issues match your current filters. Try adjusting your search or filter criteria.</p>
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
        <div className="w-full rounded-xl border border-border/40 dark:border-border/60 shadow-sm overflow-hidden bg-card">
          <Table>
        <TableHeader>
          <TableRow className="bg-linear-to-r from-muted/40 via-muted/30 to-muted/40 border-b border-border/40 dark:border-border/60 hover:bg-linear-to-r hover:from-muted/40 hover:via-muted/30 hover:to-muted/40">
            <TableHead className="w-[110px] font-semibold text-foreground/80 h-12">Code</TableHead>
            <TableHead className="min-w-[250px] font-semibold text-foreground/80">Title</TableHead>
            <TableHead className="w-[140px] font-semibold text-foreground/80">Status</TableHead>
            <TableHead className="w-[130px] font-semibold text-foreground/80">Priority</TableHead>
            <TableHead className="w-[170px] font-semibold text-foreground/80">Assignee</TableHead>
            <TableHead className="w-[170px] font-semibold text-foreground/80">Reporter</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredIssues.map((issue, index) => {
            const reporterInfo = getReporterInfo(issue.reporter);
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
                <TableCell className="font-mono text-xs font-semibold text-primary/70 dark:text-primary/60 py-4">
                  {issue.issueCode || "-"}
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-[300px] py-4">
                  <span className="line-clamp-2 leading-relaxed">{issue.title}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/50 text-foreground border border-border/40 dark:border-border/60">
                    {getStatusName(issue)}
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
                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
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
                      {issue.reporter}
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

      <IssueDetailDialog
        open={selectedIssueId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null);
        }}
        issueId={selectedIssueId}
        getPriorityColor={getPriorityColor}
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

