"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiDelete } from "@/lib/api/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Project } from "@/types/project";

interface ProjectSettingsProps {
  project: Project;
}

export default function ProjectSettings({ project }: ProjectSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  const handleDeleteProject = async () => {
    if (!user || !project) return;

    // Verify project title matches
    if (deleteConfirmName !== project.title) {
      toast.error("Project name does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiDelete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${project._id}`,
        idToken
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      router.push("/projects");
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmName("");
    }
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmName("");
  };

  return (
    <>
      <div className="w-full bg-card rounded-lg border shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-6">
          Project Settings
        </h2>

        <div className="space-y-6">
          {/* Danger Zone */}
          <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
            <h3 className="text-sm font-semibold text-destructive mb-3">
              Danger Zone
            </h3>

            <div className="space-y-3">
              <p className="text-sm">
                Permanently delete this project and all associated Issues,
                Attachments, and Comments. This action cannot be undone.
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Project
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              project and remove all associated data including issues, comments,
              and attachments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Please type{" "}
                <span className="font-bold text-foreground">
                  {project?.title}
                </span>{" "}
                to confirm:
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter project name"
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
              onClick={handleDeleteProject}
              disabled={isDeleting || deleteConfirmName !== project?.title}
              className="gap-2"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

