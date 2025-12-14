"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { WorkflowStatus } from "@/types/workflowStatus";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Search, X, Check, RefreshCw, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/issueUtils";
import { PriorityIcon } from "@/components/PriorityIcon";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface AssigneeInfo {
  uid: string;
  name: string;
  avatar?: string;
}

interface IssuesFilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Priority
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  
  // Status
  statusFilter: string;
  onStatusChange: (status: string) => void;
  statuses: WorkflowStatus[];
  showStatusFilter?: boolean; // Optional: hide status filter (default: true)
  
  // Assignee
  assigneeFilter: string[];
  onAssigneeChange: (assignees: string[]) => void;
  assignees: Map<string, AssigneeInfo>;
  
  // Due Date
  dueDateFilter?: Date | undefined;
  onDueDateChange?: (date: Date | undefined) => void;
  
  // Refresh
  onRefresh: () => void;
  loading?: boolean;
  
  // Optional: show clear filters button
  showClearFilters?: boolean;
  onClearFilters?: () => void;
}

export default function IssuesFilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  statuses,
  showStatusFilter = true,
  assigneeFilter,
  onAssigneeChange,
  assignees,
  dueDateFilter,
  onDueDateChange,
  onRefresh,
  loading = false,
  showClearFilters = false,
  onClearFilters,
}: IssuesFilterBarProps) {
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

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

  const hasActiveFilters = searchQuery.trim() !== "" || priorityFilter !== "all" || (showStatusFilter && statusFilter !== "all") || assigneeFilter.length > 0 || dueDateFilter !== undefined;

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/30 dark:bg-muted/20 rounded-xl p-4 border border-border/40 dark:border-border/60">
      {/* Search Bar */}
      <div className="relative flex-1 w-full sm:max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by title or code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-10 bg-background border-border/60 dark:border-border/40 shadow-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-md hover:bg-muted"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Priority Filter */}
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border/60 dark:border-border/40 shadow-sm">
          <SelectValue placeholder="All Priorities">
            {priorityFilter === "all" ? (
              "All Priorities"
            ) : (
              <span className="flex items-center gap-2 capitalize">
                <PriorityIcon priority={priorityFilter} />
                {priorityFilter}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="highest">
            <span className="flex items-center gap-2">
              <PriorityIcon priority="highest" className="text-red-500" />
              Highest
            </span>
          </SelectItem>
          <SelectItem value="high">
            <span className="flex items-center gap-2">
              <PriorityIcon priority="high" className="text-orange-500" />
              High
            </span>
          </SelectItem>
          <SelectItem value="medium">
            <span className="flex items-center gap-2">
              <PriorityIcon priority="medium" className="text-yellow-600 dark:text-yellow-500" />
              Medium
            </span>
          </SelectItem>
          <SelectItem value="low">
            <span className="flex items-center gap-2">
              <PriorityIcon priority="low" className="text-blue-500" />
              Low
            </span>
          </SelectItem>
          <SelectItem value="lowest">
            <span className="flex items-center gap-2">
              <PriorityIcon priority="lowest" className="text-gray-500" />
              Lowest
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      {showStatusFilter && (
        <Select value={statusFilter} onValueChange={onStatusChange}>
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
      )}

      {/* Due Date Filter */}
      {onDueDateChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[180px] h-10 justify-start text-left font-normal bg-background border-border/60 dark:border-border/40 shadow-sm",
                !dueDateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDateFilter ? (
                format(dueDateFilter, "PPP")
              ) : (
                <span>Due Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDateFilter}
              onSelect={onDueDateChange}
              initialFocus
            />
            {dueDateFilter && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onDueDateChange(undefined)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Assignee Filter */}
      <div className="relative w-full sm:w-auto" ref={assigneeDropdownRef}>
        {/* Avatar Display */}
        <div className="flex items-center gap-1.5 -space-x-2">
          {(() => {
            const assigneesList = Array.from(assignees.values());
            if (assigneesList.length === 0) {
              return (
                <span className="text-sm text-muted-foreground px-2">No assignees</span>
              );
            }
            const visibleAssignees = assigneesList.slice(0, 5);
            const remainingCount = assigneesList.length - 5;
            
            return (
              <>
                {visibleAssignees.map((assignee, index) => (
                  <div
                    key={assignee.uid}
                    className={cn(
                      "relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-background shrink-0 cursor-pointer transition-transform hover:scale-110",
                      assigneeFilter.includes(assignee.uid) && "ring-primary ring-2"
                    )}
                    style={{ zIndex: visibleAssignees.length - index }}
                    onClick={() => {
                      onAssigneeChange(
                        assigneeFilter.includes(assignee.uid)
                          ? assigneeFilter.filter((uid) => uid !== assignee.uid)
                          : [...assigneeFilter, assignee.uid]
                      );
                    }}
                    title={assignee.name}
                  >
                    {assignee.avatar ? (
                      <Image
                        src={assignee.avatar}
                        alt={assignee.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-primary">
                          {getInitials(assignee.name)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div
                    className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-background shrink-0 bg-muted hover:bg-muted/80 cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAssigneeDropdown(true);
                      setAssigneeSearchQuery("");
                    }}
                    title={`${remainingCount} more assignees`}
                  >
                    <span className="text-[11px] font-semibold text-foreground">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {showAssigneeDropdown && (
          <div className="absolute z-50 right-0 mt-2 w-[280px] bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
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
                  onAssigneeChange([]);
                  setShowAssigneeDropdown(false);
                  setAssigneeSearchQuery("");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border",
                  assigneeFilter.length === 0 && "bg-muted"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                  assigneeFilter.length === 0 ? "bg-primary border-primary" : "border-border"
                )}>
                  {assigneeFilter.length === 0 && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">All Assignees</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAssigneeChange(
                    assigneeFilter.includes("unassigned")
                      ? assigneeFilter.filter((uid) => uid !== "unassigned")
                      : [...assigneeFilter, "unassigned"]
                  );
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border",
                  assigneeFilter.includes("unassigned") && "bg-muted"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                  assigneeFilter.includes("unassigned") ? "bg-primary border-primary" : "border-border"
                )}>
                  {assigneeFilter.includes("unassigned") && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground italic">Unassigned</span>
              </button>
              {filteredAssignees.length > 0 ? (
                filteredAssignees.map((assignee) => (
                  <button
                    key={assignee.uid}
                    type="button"
                    onClick={() => {
                      onAssigneeChange(
                        assigneeFilter.includes(assignee.uid)
                          ? assigneeFilter.filter((uid) => uid !== assignee.uid)
                          : [...assigneeFilter, assignee.uid]
                      );
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border last:border-0",
                      assigneeFilter.includes(assignee.uid) && "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                      assigneeFilter.includes(assignee.uid) ? "bg-primary border-primary" : "border-border"
                    )}>
                      {assigneeFilter.includes(assignee.uid) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="shrink-0 relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-border">
                      {assignee.avatar ? (
                        <Image
                          src={assignee.avatar}
                          alt={assignee.name}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-primary">
                            {getInitials(assignee.name)}
                          </span>
                        </div>
                      )}
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
      {showClearFilters && hasActiveFilters && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="w-full sm:w-auto h-10 gap-2 border-border/60 dark:border-border/40 hover:bg-muted shadow-sm"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="w-full sm:w-auto h-10 gap-2 border-border/60 dark:border-border/40 hover:bg-muted shadow-sm ml-auto"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </Button>
    </div>
  );
}

