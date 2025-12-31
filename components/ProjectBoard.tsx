"use client";

import { WorkflowStatus } from "@/types/workflowStatus";
import { Issue } from "@/types/issue";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { apiGet, apiPatch } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Loader2 } from "lucide-react";
import IssuesFilterBar from "@/components/IssuesFilterBar";
import { filterIssues } from "@/utils/issueUtils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import SortableStatusColumn from "./SortableStatusColumn";
import AddWorkflowStatus from "./AddWorkflowStatus";
import IssueCard from "./IssueCard";

import { ProjectMember, MemberRole } from "@/types/project";

interface ProjectBoardProps {
  projectId: string;
  isAdmin: boolean;
  userRole?: MemberRole;
  projectMembers: ProjectMember[];
  initialIssueId?: string;
  onIssuesCountChange?: (count: number) => void;
}

// Sortable Status Column Component


interface AssigneeInfo {
  uid: string;
  name: string;
  avatar?: string;
}

export default function ProjectBoard({ projectId, isAdmin, userRole, projectMembers, initialIssueId, onIssuesCountChange }: ProjectBoardProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [assignees, setAssignees] = useState<Map<string, AssigneeInfo>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>(undefined);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const autoScrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Increased distance to prevent accidental dialog opening when grabbing
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // Filter issues based on search, priority, status, assignee, and due date
  const filteredIssues = useMemo(() => {
    return filterIssues({
      issues,
      searchQuery,
      priorityFilter,
      statusFilter,
      assigneeFilter,
      dueDateFilter,
      statuses,
    });
  }, [issues, searchQuery, priorityFilter, statusFilter, assigneeFilter, dueDateFilter, statuses]);

  const getIssuesByStatus = (statusId: string) => {
    return filteredIssues
      .filter((issue) => {
        const workflowStatusId =
          typeof issue.workflowStatus === "string"
            ? issue.workflowStatus
            : issue.workflowStatus?._id;
        return workflowStatusId === statusId;
      })
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const fetchData = async () => {
    if (!user || !projectId) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();

      // Fetch workflow statuses
      const statusesRes = await apiGet(
        `/api/workflow-statuses/${projectId}`,
        idToken
      );
      const statusesData = await statusesRes.json();

      if (statusesData.success) {
        setStatuses(statusesData.data);
      }

      // Fetch issues
      const issuesRes = await apiGet(
        `/api/issues?projectId=${projectId}`,
        idToken
      );
      const issuesData = await issuesRes.json();

      if (issuesData.success) {
        const fetchedIssues = issuesData.data || [];
        setIssues(fetchedIssues);
        if (onIssuesCountChange) {
          onIssuesCountChange(fetchedIssues.length);
        }

        // Build assignees map
        const assigneeMap = new Map<string, AssigneeInfo>();
        fetchedIssues.forEach((issue: Issue) => {
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
      }
    } catch (err) {
      console.error("Error fetching board data:", err);
      setError("Failed to load board data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, user]);


  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "story":
        return "📖";
      case "epic":
        return "⚡";
      case "task":
      default:
        return "✓";
    }
  };

  // Check if user can move an issue between statuses
  const canMoveIssue = (issue: Issue): boolean => {
    if (!user) return false;
    if (isAdmin || userRole === "qa" || userRole === "pm") return true;
    // Check if user is assignee or reporter
    const isAssignee = typeof issue.assignee === "string" 
      ? issue.assignee === user.uid 
      : issue.assignee?.uid === user.uid;
    const isReporter = typeof issue.reporter === "string" 
      ? issue.reporter === user.uid 
      : issue.reporter?.uid === user.uid;
    return isAssignee || isReporter;
  };

  // Auto-scroll when dragging near edges using requestAnimationFrame for smooth performance
  const handleAutoScroll = useCallback((clientX: number) => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollViewport) return;

    const viewportRect = scrollViewport.getBoundingClientRect();
    const scrollThreshold = 150; // Distance from edge to trigger scroll
    const maxScrollSpeed = 20; // Maximum pixels to scroll per frame

    // Calculate distance from edges
    const distanceFromLeft = clientX - viewportRect.left;
    const distanceFromRight = viewportRect.right - clientX;

    let scrollSpeed = 0;

    // Check if near left edge
    if (distanceFromLeft < scrollThreshold && distanceFromLeft > 0) {
      // Scroll speed increases as you get closer to the edge
      const intensity = 1 - (distanceFromLeft / scrollThreshold);
      scrollSpeed = -maxScrollSpeed * intensity;
    }
    // Check if near right edge
    else if (distanceFromRight < scrollThreshold && distanceFromRight > 0) {
      // Scroll speed increases as you get closer to the edge
      const intensity = 1 - (distanceFromRight / scrollThreshold);
      scrollSpeed = maxScrollSpeed * intensity;
    }

    // Cancel any existing animation frame
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }

    // Only scroll if there's a speed
    if (scrollSpeed !== 0) {
      const animate = () => {
        const now = Date.now();
        const delta = now - lastScrollTimeRef.current;
        
        if (delta > 0) {
          // Smooth scroll with timing
          const scroll = scrollSpeed * Math.min(delta / 16, 2); // Normalize to ~60fps
          scrollViewport.scrollLeft += scroll;
          lastScrollTimeRef.current = now;
        }

        // Continue animation
        autoScrollAnimationRef.current = requestAnimationFrame(animate);
      };

      lastScrollTimeRef.current = Date.now();
      autoScrollAnimationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
  }, []);

  // Clean up auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
      }
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Set the active issue for drag overlay
    const draggedIssue = issues.find((issue) => issue._id === active.id);
    if (draggedIssue) {
      setActiveIssue(draggedIssue);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { activatorEvent } = event;
    
    // Get mouse position from the activator event
    if (activatorEvent && 'clientX' in activatorEvent) {
      handleAutoScroll(activatorEvent.clientX as number);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Stop auto-scrolling
    stopAutoScroll();
    
    // Always clear the active issue overlay
    setActiveIssue(null);

    // If no valid drop target or dropped on itself, do nothing (issue stays in place)
    if (!over || active.id === over.id) {
      return;
    }

    // Check if dragging an issue (issue IDs are in the issues array)
    const draggedIssue = issues.find((issue) => issue._id === active.id);
    
    if (draggedIssue) {
      // Check if user can move this issue
      if (!canMoveIssue(draggedIssue)) {
        toast.error("You don't have permission to move this issue");
        return;
      }

      const currentStatusId = typeof draggedIssue.workflowStatus === "string"
        ? draggedIssue.workflowStatus
        : draggedIssue.workflowStatus?._id;

      // Check if over.id is a status ID, droppable zone ID, or an issue ID
      const isValidStatus = statuses.some((status) => status._id === over.id);
      const isDroppableZone = typeof over.id === 'string' && over.id.startsWith('droppable-');
      const targetIssue = issues.find((issue) => issue._id === over.id);
      
      let targetStatusId: string;
      let targetPosition: number;

      if (isValidStatus) {
        // Dropped directly on a status column
        targetStatusId = over.id as string;
        const targetStatusIssues = getIssuesByStatus(targetStatusId);
        targetPosition = targetStatusIssues.length;
      } else if (isDroppableZone) {
        // Dropped on a droppable zone - extract the status ID
        targetStatusId = (over.id as string).replace('droppable-', '');
        const targetStatusIssues = getIssuesByStatus(targetStatusId);
        targetPosition = targetStatusIssues.length;
      } else if (targetIssue) {
        // Dropped on another issue - determine if it's same column or different
        const targetIssueStatusId = typeof targetIssue.workflowStatus === "string"
          ? targetIssue.workflowStatus
          : targetIssue.workflowStatus?._id;
        
        if (currentStatusId === targetIssueStatusId) {
          // Same column - reorder within the column
          const statusIssues = getIssuesByStatus(currentStatusId);
          const oldIndex = statusIssues.findIndex((issue) => issue._id === active.id);
          const newIndex = statusIssues.findIndex((issue) => issue._id === over.id);
          
          if (oldIndex === -1 || newIndex === -1) return;
          
          const reorderedIssues = arrayMove(statusIssues, oldIndex, newIndex);
          
          // Optimistically update UI
          setIssues((prevIssues) => {
            const otherIssues = prevIssues.filter((issue) => {
              const workflowStatusId =
                typeof issue.workflowStatus === "string"
                  ? issue.workflowStatus
                  : issue.workflowStatus?._id;
              return workflowStatusId !== currentStatusId;
            });
            return [...otherIssues, ...reorderedIssues.map((issue, index) => ({
              ...issue,
              position: index,
            }))];
          });

          // Update backend
          setIsSaving(true);
          try {
            const idToken = await user?.getIdToken();
            if (!idToken) throw new Error("Unauthorized");

            const issueIds = reorderedIssues.map((issue) => issue._id);

            const response = await apiPatch(
              `/api/issues/positions/${currentStatusId}`,
              { issueIds },
              idToken
            );

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || "Failed to update issue positions");
            }

            toast.success("Issue order updated successfully");
          } catch (err) {
            console.error("Error updating issue positions:", err);
            toast.error(
              err instanceof Error ? err.message : "Failed to update issue positions"
            );
            // Revert on error - refetch issues
            const idToken = await user?.getIdToken();
            if (idToken) {
              const issuesRes = await apiGet(`/api/issues?projectId=${projectId}`, idToken);
              const issuesData = await issuesRes.json();
              if (issuesData.success) {
                setIssues(issuesData.data);
              }
            }
          } finally {
            setIsSaving(false);
          }
          return;
        } else {
          // Different column - move to that column at the position of the target issue
          targetStatusId = targetIssueStatusId;
          const targetStatusIssues = getIssuesByStatus(targetStatusId);
          const targetIndex = targetStatusIssues.findIndex((issue) => issue._id === over.id);
          targetPosition = targetIndex >= 0 ? targetIndex : targetStatusIssues.length;
        }
      } else {
        // Dropped on something invalid - do nothing
        return;
      }

      // Moving to a different status
      if (currentStatusId === targetStatusId) {
        // Already handled above for same-column reordering
        return;
      }

      // Check if moving to "Done" status - only admin, PM, and QA can move to Done
      const targetStatus = statuses.find((status) => status._id === targetStatusId);
      if (targetStatus && targetStatus.name.toLowerCase().trim() === 'done') {
        if (!isAdmin && userRole !== 'qa' && userRole !== 'pm') {
          toast.error("Only admins, PMs, and QA members can move issues to Done status");
          const idToken = await user?.getIdToken();
          if (idToken) {
            const issuesRes = await apiGet(`/api/issues?projectId=${projectId}`, idToken);
            const issuesData = await issuesRes.json();
            if (issuesData.success) {
              setIssues(issuesData.data);
            }
          }
          return;
        }
      }

      setIsSaving(true);
      // Store original issues state for potential rollback
      const originalIssues = [...issues];
      
      try {
        const idToken = await user?.getIdToken();
        if (!idToken) throw new Error("Unauthorized");

        // Optimistically update UI
        const updatedIssue = {
          ...draggedIssue,
          workflowStatus: targetStatusId,
          position: targetPosition,
        };
        setIssues((prevIssues) => {
          const otherIssues = prevIssues.filter((issue) => issue._id !== draggedIssue._id);
          const targetStatusIssues = otherIssues
            .filter((issue) => {
              const workflowStatusId =
                typeof issue.workflowStatus === "string"
                  ? issue.workflowStatus
                  : issue.workflowStatus?._id;
              return workflowStatusId === targetStatusId;
            })
            .sort((a, b) => (a.position || 0) - (b.position || 0));
          
          // Insert at the correct position
          const beforeIssues = targetStatusIssues.slice(0, targetPosition);
          const afterIssues = targetStatusIssues.slice(targetPosition);
          
          return [
            ...otherIssues.filter((issue) => {
              const workflowStatusId =
                typeof issue.workflowStatus === "string"
                  ? issue.workflowStatus
                  : issue.workflowStatus?._id;
              return workflowStatusId !== targetStatusId;
            }),
            ...beforeIssues,
            updatedIssue,
            ...afterIssues.map((issue, idx) => ({
              ...issue,
              position: targetPosition + 1 + idx,
            })),
          ];
        });

        const response = await apiPatch(
          `/api/issues/${draggedIssue._id}/move`,
          { workflowStatusId: targetStatusId, position: targetPosition },
          idToken
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Revert optimistic update on error
          setIssues(originalIssues);
          const errorMessage = data.message || data.error || "Failed to move issue";
          throw new Error(errorMessage);
        }

        // Update with server response
        if (data.data) {
          setIssues((prevIssues) => {
            const otherIssues = prevIssues.filter((issue) => issue._id !== draggedIssue._id);
            return [...otherIssues, data.data];
          });
        }

        toast.success("Issue moved successfully");
      } catch (err) {
        console.error("Error moving issue:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to move issue"
        );
        // Revert on error - refetch issues
        const idToken = await user?.getIdToken();
        if (idToken) {
          const issuesRes = await apiGet(`/api/issues?projectId=${projectId}`, idToken);
          const issuesData = await issuesRes.json();
          if (issuesData.success) {
            setIssues(issuesData.data);
          }
        }
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Otherwise, it's a status being dragged
    const oldIndex = statuses.findIndex((status) => status._id === active.id);
    const newIndex = statuses.findIndex((status) => status._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Check if user can reorder workflow columns (admin or PM only)
    if (!isAdmin && userRole !== 'pm') {
      toast.error("Only admins and PMs can reorder workflow columns");
      return;
    }

    const newStatuses = arrayMove(statuses, oldIndex, newIndex);
    
    // Optimistically update UI
    setStatuses(newStatuses);

    // Update backend
    setIsSaving(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Unauthorized");

      const statusesWithOrder = newStatuses.map((status, index) => ({
        id: status._id,
        orderIndex: index,
      }));

      const response = await apiPatch(
        `/api/workflow-statuses/${projectId}/order`,
        { statuses: statusesWithOrder },
        idToken
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update status order");
      }

      toast.success("Workflow order updated successfully");
    } catch (err) {
      console.error("Error updating workflow order:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update workflow order"
      );
      // Revert on error
      setStatuses(statuses);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
    setAssigneeFilter([]);
    setDueDateFilter(undefined);
  };

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
        showStatusFilter={false}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        assignees={assignees}
        dueDateFilter={dueDateFilter}
        onDueDateChange={setDueDateFilter}
        onRefresh={fetchData}
        loading={loading}
        showClearFilters={true}
        onClearFilters={clearFilters}
      />

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              Board
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin || userRole === "pm"
                ? "Drag workflow columns to reorder • Drag issues to move them"
                : "View and track project issues"}
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>

      <div className="-mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea ref={scrollAreaRef} className="w-full">
          <SortableContext
            items={statuses.map((s) => s._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 pb-4 px-3 sm:px-4 md:px-8 lg:px-12">
              {statuses.map((status) => {
                const statusIssues = getIssuesByStatus(status._id);
                return (
                  <SortableStatusColumn
                    key={status._id}
                    status={status}
                    statusIssues={statusIssues}
                    isAdmin={isAdmin}
                    userRole={userRole}
                    projectId={projectId}
                    projectMembers={projectMembers}
                    getTypeIcon={getTypeIcon}
                    initialIssueId={initialIssueId}
                    onStatusUpdate={(updatedStatus) => {
                      setStatuses(statuses.map(s => 
                        s._id === updatedStatus._id ? updatedStatus : s
                      ));
                    }}
                    onStatusDelete={(statusId) => {
                      // Remove the deleted status from the list
                      setStatuses(statuses.filter(s => s._id !== statusId));
                      // Remove issues that were in that status
                      setIssues(issues.filter(issue => {
                        const workflowStatusId =
                          typeof issue.workflowStatus === "string"
                            ? issue.workflowStatus
                            : issue.workflowStatus?._id;
                        return workflowStatusId !== statusId;
                      }));
                    }}
                    onIssueCreated={(newIssue) => {
                      // Add the new issue to the issues list
                      const updatedIssues = [...issues, newIssue];
                      setIssues(updatedIssues);
                      if (onIssuesCountChange) {
                        onIssuesCountChange(updatedIssues.length);
                      }
                    }}
                    onIssueUpdated={(updatedIssue) => {
                      // Update the issue in the issues list
                      setIssues(issues.map(issue => 
                        issue._id === updatedIssue._id ? updatedIssue : issue
                      ));
                    }}
                    onIssueDeleted={(deletedIssueId) => {
                      // Remove the deleted issue from the issues list
                      setIssues(issues.filter(issue => issue._id !== deletedIssueId));
                    }}
                    onIssuesReordered={(statusId, reorderedIssues) => {
                      // Update issues with new positions
                      setIssues((prevIssues) => {
                        const otherIssues = prevIssues.filter((issue) => {
                          const workflowStatusId =
                            typeof issue.workflowStatus === "string"
                              ? issue.workflowStatus
                              : issue.workflowStatus?._id;
                          return workflowStatusId !== statusId;
                        });
                        return [...otherIssues, ...reorderedIssues];
                      });
                    }}
                  />
                );
              })}
              
              {/* Add Workflow Status Component */}
              <AddWorkflowStatus
                projectId={projectId}
                canEdit={isAdmin || userRole === "qa" || userRole === "pm"}
                onStatusCreated={(newStatus) => {
                  setStatuses([...statuses, newStatus]);
                }}
              />
            </div>
          </SortableContext>
          <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DragOverlay>
            {activeIssue ? (
              <div className="rotate-3 opacity-90" style={{ width: '280px' }}>
                <IssueCard issue={activeIssue} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}