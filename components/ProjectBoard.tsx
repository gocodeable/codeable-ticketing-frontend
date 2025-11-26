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
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import SortableStatusColumn from "./SortableStatusColumn";

interface ProjectBoardProps {
  projectId: string;
  isAdmin: boolean;
}

// Sortable Status Column Component


export default function ProjectBoard({ projectId, isAdmin }: ProjectBoardProps) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/issues/project/${projectId}`,
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
    return issues.filter((issue) => {
      const workflowStatusId =
        typeof issue.workflowStatus === "string"
          ? issue.workflowStatus
          : issue.workflowStatus?._id;
      return workflowStatusId === statusId;
    });
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = statuses.findIndex((status) => status._id === active.id);
    const newIndex = statuses.findIndex((status) => status._id === over.id);

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
        collisionDetection={closestCenter}
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
                    getTypeIcon={getTypeIcon}
                    getPriorityColor={getPriorityColor}
                  />
                );
              })}
            </div>
          </SortableContext>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DndContext>
    </div>
  );
}