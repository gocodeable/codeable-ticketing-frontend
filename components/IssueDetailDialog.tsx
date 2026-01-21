"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Issue, Attachment } from "@/types/issue";
import { Comment } from "@/types/comment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet, apiPatch, apiDelete, apiPost } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { UserSuggestion } from "@/components/UserSelector";
import { MemberRole } from "@/types/project";

// Import new components
import { IssueDetailHeader } from "./IssueDetailHeader";
import { IssueEditForm } from "./IssueEditForm";
import { IssueViewModeLeft, IssueViewModeRight } from "./IssueViewMode";
import { IssueCommentsSection } from "./IssueCommentsSection";
import { IssueDeleteDialog } from "./IssueDeleteDialog";
import { useIssuePermissions } from "../hooks/useIssuePermissions";
import { IssueDetailDialogSkeleton } from "./IssueDetailDialogSkeleton";

interface IssueDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string | null;
  isAdmin?: boolean;
  userRole?: MemberRole;
  projectMembers?: Array<{ uid: string; name: string; email: string; avatar?: string }>;
  onIssueUpdated?: (issue: Issue) => void;
  onIssueDeleted?: (issueId: string) => void;
}

interface PopulatedIssue extends Omit<Issue, 'comments'> {
  comments?: Comment[];
}

export function IssueDetailDialog({
  open,
  onOpenChange,
  issueId,
  isAdmin = false,
  userRole,
  projectMembers = [],
  onIssueUpdated,
  onIssueDeleted,
}: IssueDetailDialogProps) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<PopulatedIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [togglingStar, setTogglingStar] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [workflowStatuses, setWorkflowStatuses] = useState<Array<{ _id: string; name: string; color?: string }>>([]);
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      deleting?: boolean;
      error?: string;
    }>
  >([]);

  // Use permissions hook
  const { canEditIssue, canDeleteIssue } = useIssuePermissions({
    issue: issue as Issue | null,
    isAdmin,
    userRole,
  });

  useEffect(() => {
    if (open && issueId && user) {
      fetchIssue();
      fetchStarStatus();
      setIsEditing(false);
    } else {
      setIssue(null);
      setIsEditing(false);
      setIsStarred(false);
    }
  }, [open, issueId, user]);

  // Fetch workflow statuses when issue is loaded
  useEffect(() => {
    if (issue && issue.project && user) {
      fetchWorkflowStatuses();
    }
  }, [issue, user]);

  // Initialize edit form when issue is loaded or editing mode changes
  useEffect(() => {
    if (issue && isEditing) {
      setEditTitle(issue.title || "");
      setEditDescription(issue.description || "");
      setEditAttachments(issue.attachments || []);
      setNewAttachments([]);
    }
  }, [issue, isEditing]);

  const fetchIssue = async () => {
    if (!issueId || !user) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(`/api/issues/${issueId}`, idToken);
      const data = await response.json();

      if (data.success) {
        setIssue(data.data);
      } else {
        toast.error(data.error || "Failed to fetch issue");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error fetching issue:", error);
      toast.error("Failed to fetch issue");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowStatuses = async () => {
    if (!issue || !user) return;

    const projectId = typeof issue.project === "string" ? issue.project : issue.project?._id;
    if (!projectId) return;

    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(`/api/workflow-statuses/${projectId}`, idToken);
      const data = await response.json();

      if (data.success) {
        setWorkflowStatuses(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching workflow statuses:", error);
    }
  };

  const fetchStarStatus = async () => {
    if (!issueId || !user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await apiGet(
        `/api/starred-issues/${issueId}/status`,
        idToken
      );
      const data = await response.json();

      if (data.success) {
        setIsStarred(data.data?.isStarred || false);
      }
    } catch (error) {
      console.error("Error fetching star status:", error);
      // Don't show error toast, just silently fail
    }
  };

  const handleToggleStar = async () => {
    if (!user || !issueId || togglingStar) return;

    setTogglingStar(true);

    try {
      const idToken = await user.getIdToken();

      if (isStarred) {
        // Unstar the issue
        const response = await apiDelete(`/api/starred-issues/${issueId}`, idToken);
        if (response.ok) {
          setIsStarred(false);
          toast.success("Issue unstarred");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Failed to unstar issue");
        }
      } else {
        // Star the issue
        const response = await apiPost(
          `/api/starred-issues`,
          { issueId },
          idToken
        );
        if (response.ok) {
          setIsStarred(true);
          toast.success("Issue starred");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Failed to star issue");
        }
      }
    } catch (err) {
      console.error("Error toggling star:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle star status"
      );
    } finally {
      setTogglingStar(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (issue) {
      setEditTitle(issue.title || "");
      setEditDescription(issue.description || "");
      setEditAttachments(issue.attachments || []);
      setNewAttachments([]);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!user || !issue) return;

    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      
      // Find removed attachments by comparing original with current
      const originalAttachments = issue.attachments || [];
      const removedAttachments = originalAttachments.filter(
        (originalAtt) =>
          !editAttachments.some(
            (editAtt) => editAtt.link === originalAtt.link
          )
      );

      // Delete removed attachments from Firebase Storage
      if (removedAttachments.length > 0) {
        for (const removedAtt of removedAttachments) {
          try {
            if (removedAtt.link && removedAtt.link.includes('storage.googleapis.com')) {
              const deleteResponse = await apiDelete("/api/media", idToken, {
                body: JSON.stringify({ url: removedAtt.link }),
              });
              const deleteData = await deleteResponse.json();
              if (!deleteData.success) {
                console.warn(`Failed to delete ${removedAtt.fileName} from storage:`, deleteData.error);
              }
            }
          } catch (deleteError) {
            console.error(`Error deleting ${removedAtt.fileName} from storage:`, deleteError);
            // Continue with update even if deletion fails
          }
        }
      }
      
      // Prepare updated attachments (existing + newly uploaded)
      const uploadedNewAttachments = newAttachments
        .filter((att) => att.url && !att.error)
        .map((att) => ({
          link: att.url!,
          fileName: att.file.name,
        }));
      
      const allAttachments = [...editAttachments, ...uploadedNewAttachments];

      const updateData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        attachments: allAttachments,
      };

      // Regular update
      const response = await apiPatch(`/api/issues/${issue._id}`, updateData, idToken);
      const data = await response.json();

      if (data.success) {
        toast.success("Issue updated successfully");
        setIsEditing(false);
        await fetchIssue();
        if (onIssueUpdated) {
          onIssueUpdated(data.data);
        }
      } else {
        toast.error(data.error || "Failed to update issue");
      }
    } catch (error) {
      console.error("Error updating issue:", error);
      toast.error("Failed to update issue");
    } finally {
      setIsSaving(false);
    }
  };

  // Optimistically update local issue state
  const updateIssueOptimistically = (updates: {
    type?: "task" | "bug" | "story" | "epic";
    priority?: "highest" | "high" | "medium" | "low" | "lowest";
    assignee?: string | undefined;
    estimatedCompletionDate?: Date | undefined;
    workflowStatus?: string;
  }) => {
    if (!issue) return;

    setIssue((prevIssue) => {
      if (!prevIssue) return prevIssue;

      const updatedIssue = { ...prevIssue };

      if (updates.type !== undefined) {
        updatedIssue.type = updates.type;
      }
      if (updates.priority !== undefined) {
        updatedIssue.priority = updates.priority;
      }
      if (updates.assignee !== undefined) {
        if (updates.assignee) {
          // Find the assignee from projectMembers
          const assigneeMember = projectMembers.find((m) => m.uid === updates.assignee);
          if (assigneeMember) {
            updatedIssue.assignee = {
              uid: assigneeMember.uid,
              name: assigneeMember.name,
              avatar: assigneeMember.avatar,
            };
          }
        } else {
          updatedIssue.assignee = undefined;
        }
      }
      if (updates.estimatedCompletionDate !== undefined) {
        updatedIssue.estimatedCompletionDate = updates.estimatedCompletionDate
          ? updates.estimatedCompletionDate.toISOString()
          : undefined;
      }
      if (updates.workflowStatus !== undefined) {
        // Use the workflow status ID as string for optimistic update
        // The full object will be populated when we fetch from server
        updatedIssue.workflowStatus = updates.workflowStatus;
      }

      return updatedIssue;
    });
  };

  // Quick update function for individual field changes (optimistic updates)
  const handleQuickUpdate = async (updates: {
    type?: "task" | "bug" | "story" | "epic";
    priority?: "highest" | "high" | "medium" | "low" | "lowest";
    assignee?: string | undefined;
    estimatedCompletionDate?: Date | undefined;
    workflowStatus?: string;
  }) => {
    if (!user || !issue) return;

    // Store original issue for rollback on error
    const originalIssue = { ...issue };

    // Optimistically update UI immediately
    updateIssueOptimistically(updates);

    // Make API call in background (don't await, but handle errors)
    (async () => {
      try {
        const idToken = await user.getIdToken();
        
        // Prepare update data
        const updateData: any = {};
        if (updates.type !== undefined) updateData.type = updates.type;
        if (updates.priority !== undefined) updateData.priority = updates.priority;
        if (updates.assignee !== undefined) updateData.assignee = updates.assignee;
        if (updates.estimatedCompletionDate !== undefined) {
          updateData.estimatedCompletionDate = updates.estimatedCompletionDate 
            ? updates.estimatedCompletionDate.toISOString() 
            : undefined;
        }

        // Check if workflow status changed
        const originalWorkflowStatusId = typeof originalIssue.workflowStatus === "object" && originalIssue.workflowStatus?._id
          ? originalIssue.workflowStatus._id
          : typeof originalIssue.workflowStatus === "string"
          ? originalIssue.workflowStatus
          : "";

        const workflowStatusChanged = updates.workflowStatus && updates.workflowStatus !== originalWorkflowStatusId;

        if (workflowStatusChanged) {
          // If workflow status changed, use the move API to position at top
          // First update the issue details (without workflow status)
          const updateResponse = await apiPatch(`/api/issues/${issue._id}`, updateData, idToken);
          const updateResponseData = await updateResponse.json();

          if (!updateResponse.ok || !updateResponseData.success) {
            // Rollback on error
            setIssue(originalIssue);
            toast.error(updateResponseData.error || "Failed to update issue");
            return;
          }

          // Then move the issue to the new workflow status at position 0 (top)
          const moveResponse = await apiPatch(
            `/api/issues/${issue._id}/move`,
            { workflowStatusId: updates.workflowStatus, position: 0 },
            idToken
          );
          const moveData = await moveResponse.json();

          if (moveData.success) {
            // Refresh to get latest data from server
            fetchIssue().then(() => {
              if (onIssueUpdated && moveData.data) {
                onIssueUpdated(moveData.data);
              }
            });
          } else {
            // Rollback on error
            setIssue(originalIssue);
            toast.error(moveData.error || "Failed to move issue to new workflow");
          }
        } else {
          // Regular update without workflow change
          const response = await apiPatch(`/api/issues/${issue._id}`, updateData, idToken);
          const data = await response.json();

          if (data.success) {
            // Refresh to get latest data from server (in background)
            fetchIssue().then(() => {
              if (onIssueUpdated && data.data) {
                onIssueUpdated(data.data);
              }
            });
          } else {
            // Rollback on error
            setIssue(originalIssue);
            toast.error(data.error || "Failed to update issue");
          }
        }
      } catch (error) {
        console.error("Error updating issue:", error);
        // Rollback on error
        setIssue(originalIssue);
        toast.error("Failed to update issue");
      }
    })();
  };

  // Quick update handlers
  const handleQuickTypeChange = (value: "task" | "bug" | "story" | "epic") => {
    handleQuickUpdate({ type: value });
  };

  const handleQuickPriorityChange = (value: "highest" | "high" | "medium" | "low" | "lowest") => {
    handleQuickUpdate({ priority: value });
  };

  const handleQuickAssigneeChange = (assignee: UserSuggestion | null) => {
    // Only trigger API call when assigning a new assignee (not when removing)
    if (assignee) {
      handleQuickUpdate({ assignee: assignee.uid });
    }
  };

  const handleQuickAssigneeRemove = () => {
    // Just update UI optimistically, no API call
    updateIssueOptimistically({ assignee: undefined });
  };

  const handleQuickDueDateChange = (date: Date | undefined) => {
    handleQuickUpdate({ estimatedCompletionDate: date });
  };

  const handleQuickWorkflowStatusChange = (value: string) => {
    handleQuickUpdate({ workflowStatus: value });
  };

  // Handle file drop/selection for new attachments
  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    const idToken = await user.getIdToken();

    // Add files to newAttachments with uploading state
    const startIndex = newAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setNewAttachments((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setNewAttachments((prev) =>
          prev.map((att, index) => {
            if (index === attachmentIndex) {
              return { ...att, url, uploading: false };
            }
            return att;
          })
        );
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading file:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setNewAttachments((prev) =>
          prev.map((att, index) => {
            if (index === attachmentIndex) {
              return {
                ...att,
                uploading: false,
                error: errorMessage,
              };
            }
            return att;
          })
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isSaving,
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  const removeNewAttachment = async (index: number) => {
    const attachment = newAttachments[index];

    // Set deleting state
    setNewAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, deleting: true } : att))
    );

    // If the file was successfully uploaded (has a URL), delete it from Firebase Storage
    if (attachment.url && !attachment.error) {
      try {
        if (!user) {
          setNewAttachments((prev) => prev.filter((_, i) => i !== index));
          return;
        }

        const idToken = await user.getIdToken();
        const response = await apiDelete("/api/media", idToken, {
          body: JSON.stringify({ url: attachment.url }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(`Failed to delete ${attachment.file.name} from storage`);
        }
      } catch (error) {
        console.error("Error deleting file from storage:", error);
        toast.error(`Failed to delete ${attachment.file.name} from storage`);
      }
    }

    // Remove from newAttachments list
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setEditAttachments((prev) => prev.filter((_, i) => i !== index));
  };


  const handleDownload = async (attachment: { link: string; fileName: string }, attachmentId?: string) => {
    if (!user) {
      toast.error("You must be logged in to download files");
      return;
    }

    // Validate that it's a valid URL
    if (!attachment.link || (!attachment.link.startsWith("http://") && !attachment.link.startsWith("https://"))) {
      toast.error("Invalid attachment URL");
      return;
    }

    // Use attachment link as unique ID if no ID provided
    const downloadId = attachmentId || attachment.link;
    
    // Set downloading state
    setDownloadingAttachments((prev) => new Set(prev).add(downloadId));

    try {
      const idToken = await user.getIdToken();
      
      // Use the API proxy endpoint for downloads
      const downloadUrl = `/api/media/download?url=${encodeURIComponent(attachment.link)}&fileName=${encodeURIComponent(attachment.fileName)}`;
      
      // Add authorization header by fetching first, then creating blob URL
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to download file");
        return;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success(`Downloaded ${attachment.fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      // Remove downloading state
      setDownloadingAttachments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[98vw] w-[98vw] h-[92vh] max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">
          <div className="relative w-full h-full flex flex-col overflow-hidden">
            {loading ? (
              <IssueDetailDialogSkeleton />
            ) : issue ? (
            <>
              {/* Header */}
              <div className="shrink-0">
                <IssueDetailHeader
                  issue={issue as Issue}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  canEdit={canEditIssue()}
                  canDelete={canDeleteIssue()}
                  onEdit={handleEdit}
                  onCancelEdit={handleCancelEdit}
                  onSave={handleSaveEdit}
                  onDelete={handleDeleteClick}
                  onClose={() => onOpenChange(false)}
                  editTitle={editTitle}
                  isStarred={isStarred}
                  togglingStar={togglingStar}
                  onToggleStar={handleToggleStar}
                />
              </div>

              {/* Two-Column Layout */}
              <div className="flex-1 min-h-0 overflow-hidden flex">
                {/* Left Column - Description, Attachments, and Comments */}
                <div className="flex-1 min-h-0 overflow-y-auto border-r border-border/40 dark:border-border/60">
                  <div className="px-6 sm:px-8 py-6 space-y-6 min-h-full">
                    {isEditing ? (
                      <IssueEditForm
                        editTitle={editTitle}
                        editDescription={editDescription}
                        editAttachments={editAttachments}
                        newAttachments={newAttachments}
                        isSaving={isSaving}
                        isDragActive={isDragActive}
                        onTitleChange={setEditTitle}
                        onDescriptionChange={setEditDescription}
                        onRemoveExistingAttachment={removeExistingAttachment}
                        onRemoveNewAttachment={removeNewAttachment}
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                      />
                    ) : (
                      <>
                        <IssueViewModeLeft
                          issue={issue as Issue}
                          downloadingAttachments={downloadingAttachments}
                          onDownload={handleDownload}
                        />
                        {/* Comments Section */}
                        <div>
                          <IssueCommentsSection
                            issueId={issue._id}
                            comments={issue.comments}
                            commentCount={issue.commentCount}
                            downloadingAttachments={downloadingAttachments}
                            onDownload={handleDownload}
                            onCommentAdded={(newComment) => {
                              if (newComment) {
                                // Update local state with new comment
                                setIssue((prevIssue) => {
                                  if (!prevIssue) return prevIssue;
                                  const updatedComments = prevIssue.comments ? [...prevIssue.comments, newComment] : [newComment];
                                  return {
                                    ...prevIssue,
                                    comments: updatedComments,
                                    commentCount: updatedComments.length,
                                  };
                                });
                              } else {
                                // For deletions/edits, refetch to ensure consistency
                                fetchIssue();
                              }
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column - Issue Details (Assignee, Reporter, Dates, etc.) */}
                <div className="w-[350px] min-w-[300px] min-h-0 overflow-y-auto bg-muted/10">
                  <div className="px-6 sm:px-8 py-6 min-h-full">
                    {!isEditing && (
                      <IssueViewModeRight 
                        issue={issue as Issue}
                        canEdit={canEditIssue()}
                        workflowStatuses={workflowStatuses}
                        projectMembers={projectMembers}
                        onTypeChange={handleQuickTypeChange}
                        onPriorityChange={handleQuickPriorityChange}
                        onAssigneeChange={handleQuickAssigneeChange}
                        onAssigneeRemove={handleQuickAssigneeRemove}
                        onDueDateChange={handleQuickDueDateChange}
                        onWorkflowStatusChange={handleQuickWorkflowStatusChange}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 dark:border-border/60 bg-muted/30">
                <DialogTitle className="text-xl">Issue Not Found</DialogTitle>
                <DialogDescription>
                  The issue you're looking for could not be found.
                </DialogDescription>
              </DialogHeader>
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <IssueDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        issue={issue as Issue | null}
        onIssueDeleted={(deletedIssueId) => {
          onOpenChange(false);
          if (onIssueDeleted) {
            onIssueDeleted(deletedIssueId);
          }
        }}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

