"use client";

import { WorkflowStatus } from "@/types/workflowStatus";
import { Issue } from "@/types/issue";
import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Loader2 } from "lucide-react";
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

import { ProjectMember } from "@/types/project";

interface ProjectBoardProps {
  projectId: string;
  isAdmin: boolean;
  userRole?: "admin" | "developer" | "qa";
  projectMembers: ProjectMember[];
  initialIssueId?: string;
}

// Sortable Status Column Component


export default function ProjectBoard({ projectId, isAdmin, userRole, projectMembers, initialIssueId }: ProjectBoardProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
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
          setIssues(issuesData.data);
        }
      } catch (err) {
        console.error("Error fetching board data:", err);
        setError("Failed to load board data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, user]);

  const getIssuesByStatus = (statusId: string) => {
    return issues
      .filter((issue) => {
        const workflowStatusId =
          typeof issue.workflowStatus === "string"
            ? issue.workflowStatus
            : issue.workflowStatus?._id;
        return workflowStatusId === statusId;
      })
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const getPriorityColor = (priority: string) => {
    const p = priority || "medium";
    switch (p.toLowerCase()) {
      case "highest":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "lowest":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

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
    if (isAdmin || userRole === "qa") return true;
    // Check if user is assignee or reporter
    const isAssignee = typeof issue.assignee === "string" 
      ? issue.assignee === user.uid 
      : issue.assignee?.uid === user.uid;
    const isReporter = issue.reporter === user.uid;
    return isAssignee || isReporter;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Set the active issue for drag overlay
    const draggedIssue = issues.find((issue) => issue._id === active.id);
    if (draggedIssue) {
      setActiveIssue(draggedIssue);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
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

      // Check if over.id is a status ID or an issue ID
      const isValidStatus = statuses.some((status) => status._id === over.id);
      const targetIssue = issues.find((issue) => issue._id === over.id);
      
      let targetStatusId: string;
      let targetPosition: number;

      if (isValidStatus) {
        // Dropped directly on a status column
        targetStatusId = over.id as string;
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

      setIsSaving(true);
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

        if (!data.success) {
          throw new Error(data.error || "Failed to move issue");
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

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              Board
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <SortableContext
            items={statuses.map((s) => s._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 pb-4">
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
                    getPriorityColor={getPriorityColor}
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
                      setIssues([...issues, newIssue]);
                    }}
                    onIssueUpdated={(updatedIssue) => {
                      // Update the issue in the issues list
                      setIssues(issues.map(issue => 
                        issue._id === updatedIssue._id ? updatedIssue : issue
                      ));
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
                canEdit={isAdmin || userRole === "qa"}
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
              <IssueCard 
                issue={activeIssue} 
                getPriorityColor={getPriorityColor}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}