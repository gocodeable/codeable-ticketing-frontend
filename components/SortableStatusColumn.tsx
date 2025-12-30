import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { ProjectMember, MemberRole } from "@/types/project";
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
import { getStatusColor } from "@/utils/issueUtils";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { IssueDetailDialog } from "@/components/IssueDetailDialog";

// Droppable wrapper for status column to accept issues from other columns
function StatusDroppable({ 
  statusId, 
  children, 
  disabled = false 
}: { 
  statusId: string; 
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors rounded-lg ${isOver && !disabled ? "bg-primary/5 border-2 border-primary/20 border-dashed" : ""} ${disabled ? "opacity-50" : ""}`}
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
  onStatusUpdate,
  onStatusDelete,
  onIssueCreated,
  onIssueUpdated,
  onIssueDeleted,
  initialIssueId,
}: {
  status: WorkflowStatus;
  statusIssues: Issue[];
  isAdmin: boolean;
  userRole?: MemberRole;
  projectId: string;
  projectMembers: ProjectMember[];
  getTypeIcon: (type: string) => string;
  onStatusUpdate?: (status: WorkflowStatus) => void;
  onStatusDelete?: (statusId: string) => void;
  onIssueCreated?: (issue: Issue) => void;
  onIssueUpdated?: (issue: Issue) => void;
  onIssueDeleted?: (issueId: string) => void;
  onIssuesReordered?: (statusId: string, reorderedIssues: Issue[]) => void;
  initialIssueId?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [localIssues, setLocalIssues] = useState<Issue[]>(statusIssues);

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
  } = useSortable({ id: status._id, disabled: !isAdmin && userRole !== 'pm' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if user can edit workflow status (admin, PM, or QA)
  const canEdit = isAdmin || userRole === "qa" || userRole === "pm";
  
  // Check if user can reorder/move issues (admin, PM, QA, assignee, or reporter)
  const canReorderIssue = (issue: Issue): boolean => {
    if (isAdmin || userRole === "qa" || userRole === "pm") {
      return true;
    }
    // Check if user is assignee or reporter
    const isAssignee = typeof issue.assignee === "string" 
      ? issue.assignee === user?.uid 
      : issue.assignee?.uid === user?.uid;
    const isReporter = typeof issue.reporter === "string" 
      ? issue.reporter === user?.uid 
      : issue.reporter?.uid === user?.uid;
    return isAssignee || isReporter;
  };

  // Open issue dialog if initialIssueId matches an issue in this column
  useEffect(() => {
    if (initialIssueId && statusIssues.some(issue => issue._id === initialIssueId)) {
      setSelectedIssueId(initialIssueId);
    }
  }, [initialIssueId, statusIssues]);

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
                {(isAdmin || userRole === 'pm') && (
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
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border",
                  getStatusColor(status.color)
                )}>
                  {status.name}
                </span>
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

      <div className="sticky top-0 z-10 border-b border-border/40 dark:border-border/60 px-3 py-2">
        <Button
          variant="outline"
          className="w-full cursor-pointer border-dashed hover:border-primary/50 hover:bg-accent/50 gap-2 text-black dark:text-white hover:text-primary dark:hover:text-primary"
          onClick={() => setShowAddIssueDialog(true)}
        >
          <Plus className="w-4 h-4" />
          Add Issue
        </Button>
      </div>

      {/* Issues List - Droppable area for cross-column dragging */}
      <StatusDroppable 
        statusId={status._id}
        disabled={status.name.toLowerCase() === 'done' && !isAdmin && userRole !== 'qa' && userRole !== 'pm'}
      >
        <div className="p-3 space-y-3 min-h-[200px] overflow-x-visible">
          <SortableContext
            items={localIssues.map((issue) => issue._id)}
            strategy={verticalListSortingStrategy}
          >
            {localIssues.map((issue) => (
              <SortableIssueCard
                key={issue._id}
                issue={issue}
                disabled={!canReorderIssue(issue)}
                onClick={() => setSelectedIssueId(issue._id)}
              />
            ))}
          </SortableContext>
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

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        open={selectedIssueId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIssueId(null);
            if (pathname) {
              router.replace(pathname, { scroll: false });
            }
          }
        }}
        issueId={selectedIssueId}
        isAdmin={isAdmin}
        userRole={userRole}
        projectMembers={projectMembers.map((member) => ({
          uid: typeof member === "string" ? member : member.uid,
          name: typeof member === "string" ? "" : member.name,
          email: typeof member === "string" ? "" : member.email || "",
          avatar: typeof member === "string" ? undefined : member.avatar,
        }))}
        onIssueUpdated={(updatedIssue) => {
          if (onIssueUpdated) {
            onIssueUpdated(updatedIssue);
          }
        }}
        onIssueDeleted={(deletedIssueId) => {
          if (onIssueDeleted) {
            onIssueDeleted(deletedIssueId);
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
