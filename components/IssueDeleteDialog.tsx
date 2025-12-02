"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Issue } from "@/types/issue";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiDelete } from "@/lib/api/apiClient";
import { toast } from "sonner";

interface IssueDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue | null;
  onIssueDeleted?: (issueId: string) => void;
  onClose?: () => void;
}

export function IssueDeleteDialog({
  open,
  onOpenChange,
  issue,
  onIssueDeleted,
  onClose,
}: IssueDeleteDialogProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleDeleteDialogClose = () => {
    if (!isDeleting) {
      setDeleteConfirmName("");
      onOpenChange(false);
      if (onClose) {
        onClose();
      }
    }
  };

  const handleDeleteIssue = async () => {
    if (!user || !issue) return;

    if (deleteConfirmName !== issue.title) {
      toast.error("Issue title does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiDelete(`/api/issues/${issue._id}`, idToken);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to delete issue";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (parseError) {
          // If parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        toast.error(errorMessage);
        return;
      }

      // Response is ok, try to parse JSON
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success) {
            toast.success("Issue deleted successfully");
            setDeleteConfirmName("");
            onOpenChange(false);
            if (onIssueDeleted) {
              onIssueDeleted(issue._id);
            }
            if (onClose) {
              onClose();
            }
          } else {
            toast.error(data.message || "Failed to delete issue");
          }
        } else {
          // No JSON content, but status is ok, assume success
          toast.success("Issue deleted successfully");
          setDeleteConfirmName("");
          onOpenChange(false);
          if (onIssueDeleted) {
            onIssueDeleted(issue._id);
          }
          if (onClose) {
            onClose();
          }
        }
      } catch (parseError) {
        // If JSON parsing fails but status is ok, assume success
        console.warn("Could not parse response as JSON, but status is ok:", parseError);
        toast.success("Issue deleted successfully");
        setDeleteConfirmName("");
        onOpenChange(false);
        if (onIssueDeleted) {
          onIssueDeleted(issue._id);
        }
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete issue"
      );
    } finally {
      setIsDeleting(false);
      setDeleteConfirmName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDeleteDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Delete Issue
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            issue &quot;{issue?.title}&quot; and all associated comments and
            attachments.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Please type{" "}
              <span className="font-bold text-foreground">{issue?.title}</span>{" "}
              to confirm:
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter issue title"
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
            onClick={handleDeleteIssue}
            disabled={isDeleting || deleteConfirmName !== issue?.title}
            className="gap-2"
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Issue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

