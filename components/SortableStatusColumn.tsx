import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { ProjectMember } from "@/types/project";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  GripVertical,
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
} from "lucide-react";
import SortableIssueCard from "./SortableIssueCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiPatch, apiDelete } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddIssueDialog } from "@/components/AddIssueDialog";

// Droppable wrapper for status column to accept issues from other columns
function StatusDroppable({ statusId, children }: { statusId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-lg ${isOver ? "bg-primary/5 border-2 border-primary/20 border-dashed" : ""}`}
    >
      {children}
    </div>
  );
}

export default function SortableStatusColumn({
  status,
  statusIssues,
  isAdmin,
  userRole,
  projectId,
  projectMembers,
  getPriorityColor,
  onStatusUpdate,
  onStatusDelete,
  onIssueCreated,
}: {
  status: WorkflowStatus;
  statusIssues: Issue[];
  isAdmin: boolean;
  userRole?: "admin" | "developer" | "qa";
  projectId: string;
  projectMembers: ProjectMember[];
  getTypeIcon: (type: string) => string;
  getPriorityColor: (priority: string) => string;
  onStatusUpdate?: (status: WorkflowStatus) => void;
  onStatusDelete?: (statusId: string) => void;
  onIssueCreated?: (issue: Issue) => void;
  onIssuesReordered?: (statusId: string, reorderedIssues: Issue[]) => void;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);
  const [editDescription, setEditDescription] = useState(
    status.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddIssueDialog, setShowAddIssueDialog] = useState(false);
  const [localIssues, setLocalIssues] = useState<Issue[]>(statusIssues);
  const [isReordering, setIsReordering] = useState(false);

  // Update local issues when statusIssues prop changes
  useEffect(() => {
    setLocalIssues(statusIssues);
  }, [statusIssues]);

  // Sensors for issue drag and drop
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


  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status._id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if user can edit (admin or QA)
  const canEdit = isAdmin || userRole === "qa";
  
  const canReorderIssue = (issue: Issue): boolean => {
    if (isAdmin || userRole === "qa") {
      return true;
    }
    // Check if user is assignee or reporter
    const isAssignee = typeof issue.assignee === "string" 
      ? issue.assignee === user?.uid 
      : issue.assignee?.uid === user?.uid;
    const isReporter = user?.uid === issue.reporter;
    return isAssignee || isReporter;
  };

  const handleEdit = () => {
    setEditName(status.name);
    setEditDescription(status.description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditName(status.name);
    setEditDescription(status.description || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate name
    if (!editName.trim()) {
      toast.error("Status name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiPatch(
        `/api/workflow-statuses/update/${status._id}`,
        {
          name: editName.trim(),
          description: editDescription.trim(),
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Workflow status updated successfully");
        setIsEditing(false);
        if (onStatusUpdate) {
          onStatusUpdate(data.data);
        }
      } else {
        toast.error(data.error || "Failed to update workflow status");
      }
    } catch (error) {
      console.error("Error updating workflow status:", error);
      toast.error("Failed to update workflow status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmName("");
  };

  const handleDelete = async () => {
    if (!user) return;

    // Verify status name matches
    if (deleteConfirmName !== status.name) {
      toast.error("Workflow status name does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiDelete(
        `/api/workflow-statuses/update/${status._id}`,
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Workflow status deleted successfully. ${data.data.deletedIssuesCount} issue(s) removed.`
        );
        setShowDeleteDialog(false);
        if (onStatusDelete) {
          onStatusDelete(status._id);
        }
      } else {
        toast.error(data.error || "Failed to delete workflow status");
      }
    } catch (error) {
      console.error("Error deleting workflow status:", error);
      toast.error("Failed to delete workflow status");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmName("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 bg-card rounded-lg border shadow-sm group"
    >
      {/* Status Header */}
      <div className="p-4 border-b">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-sm font-semibold"
                placeholder="Status name"
                disabled={isSaving}
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs resize-none"
                placeholder="Status description (optional)"
                rows={2}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <Check className="w-3 h-3" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-1">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-transparent"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="w-4 h-4" />
                  </Button>
                )}
                <h3 className="font-semibold text-foreground">{status.name}</h3>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-auto p-1 text-muted-foreground hover:text-foreground"
                      title="Edit status"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="h-auto p-1 text-muted-foreground hover:text-destructive"
                      title="Delete status"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {statusIssues.length}
              </span>
            </div>
            {status.description && (
              <p className="text-xs text-muted-foreground ml-6">
                {status.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Issues List - Droppable area for cross-column dragging */}
      <StatusDroppable statusId={status._id}>
        <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto overflow-x-visible">
          <SortableContext
            items={localIssues.map((issue) => issue._id)}
            strategy={verticalListSortingStrategy}
          >
            {localIssues.map((issue) => (
              <SortableIssueCard
                key={issue._id}
                issue={issue}
                getPriorityColor={getPriorityColor}
                disabled={!canReorderIssue(issue)}
              />
            ))}
          </SortableContext>

          {/* Add Issue Button */}
          <Button
            variant="outline"
            className="w-full cursor-pointer border-dashed hover:border-primary/50 hover:bg-accent/50 gap-2 text-muted-foreground hover:text-primary"
            onClick={() => setShowAddIssueDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Add Issue
          </Button>
        </div>
      </StatusDroppable>

      {/* Add Issue Dialog */}
      <AddIssueDialog
        open={showAddIssueDialog}
        onOpenChange={setShowAddIssueDialog}
        projectId={projectId}
        workflowStatusId={status._id}
        projectMembers={projectMembers}
        onIssueCreated={(newIssue) => {
          if (onIssueCreated) {
            onIssueCreated(newIssue);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Workflow Status
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              workflow status &quot;{status.name}&quot; and all{" "}
              <strong>{statusIssues.length} issue(s)</strong> in this status,
              including their comments and attachments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Please type{" "}
                <span className="font-bold text-foreground">{status.name}</span>{" "}
                to confirm:
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter workflow status name"
                disabled={isDeleting}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteDialogClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmName !== status.name}
              className="gap-2"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
