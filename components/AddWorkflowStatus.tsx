"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiPost } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { WorkflowStatus } from "@/types/workflowStatus";

interface AddWorkflowStatusProps {
  projectId: string;
  canEdit: boolean;
  onStatusCreated?: (status: WorkflowStatus) => void;
}

export default function AddWorkflowStatus({
  projectId,
  canEdit,
  onStatusCreated,
}: AddWorkflowStatusProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCancel = () => {
    setName("");
    setDescription("");
    setIsCreating(false);
  };

  const handleCreate = async () => {
    if (!user) return;

    // Validate name
    if (!name.trim()) {
      toast.error("Workflow status name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiPost(
        `/api/workflow-statuses`,
        {
          projectId,
          name: name.trim(),
          description: description.trim(),
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Workflow status created successfully");
        setName("");
        setDescription("");
        setIsCreating(false);
        if (onStatusCreated) {
          onStatusCreated(data.data);
        }
      } else {
        toast.error(data.error || "Failed to create workflow status");
      }
    } catch (error) {
      console.error("Error creating workflow status:", error);
      toast.error("Failed to create workflow status");
    } finally {
      setIsSaving(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  if (isCreating) {
    return (
      <div className="shrink-0 w-80 bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm font-semibold"
                placeholder="Workflow status name"
                disabled={isSaving}
                autoFocus
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-none"
                placeholder="Description (optional)"
                rows={2}
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCreate}
                disabled={isSaving}
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <Check className="w-3 h-3" />
                {isSaving ? "Creating..." : "Create"}
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
        </div>
        <div className="p-3 min-h-[200px]">
          <p className="text-xs text-muted-foreground text-center py-8">
            Create workflow status to add issues
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-80 group">
      <Button
        onClick={() => setIsCreating(true)}
        variant="outline"
        className="w-full h-full min-h-[300px] border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-all opacity-60 hover:opacity-100"
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Add Workflow Status
          </span>
        </div>
      </Button>
    </div>
  );
}

