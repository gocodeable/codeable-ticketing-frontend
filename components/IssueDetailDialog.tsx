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
import { apiGet, apiPatch, apiDelete } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { UserSuggestion } from "@/components/UserSelector";

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
  userRole?: "admin" | "developer" | "qa";
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
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<"task" | "bug" | "story" | "epic">("task");
  const [editPriority, setEditPriority] = useState<"highest" | "high" | "medium" | "low" | "lowest">("medium");
  const [editAssignee, setEditAssignee] = useState<UserSuggestion | null>(null);
  const [editDueDate, setEditDueDate] = useState<Date | undefined>();
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
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
  const assigneeSearchRef = useRef<HTMLDivElement>(null);
  const assigneeInputRef = useRef<HTMLInputElement>(null);

  // Use permissions hook
  const { canEditIssue, canDeleteIssue } = useIssuePermissions({
    issue: issue as Issue | null,
    isAdmin,
    userRole,
  });

  useEffect(() => {
    if (open && issueId && user) {
      fetchIssue();
      setIsEditing(false);
    } else {
      setIssue(null);
      setIsEditing(false);
    }
  }, [open, issueId, user]);

  // Initialize edit form when issue is loaded or editing mode changes
  useEffect(() => {
    if (issue && isEditing) {
      setEditTitle(issue.title || "");
      setEditDescription(issue.description || "");
      setEditType(issue.type || "task");
      setEditPriority(issue.priority || "medium");
      setEditDueDate(issue.estimatedCompletionDate ? new Date(issue.estimatedCompletionDate) : undefined);
      setEditAttachments(issue.attachments || []);
      setNewAttachments([]);
      
      // Set assignee
      if (issue.assignee && typeof issue.assignee === "object") {
        setEditAssignee({
          uid: issue.assignee.uid,
          name: issue.assignee.name,
          email: "",
          avatar: issue.assignee.avatar,
        });
      } else {
        setEditAssignee(null);
      }
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (issue) {
      setEditTitle(issue.title || "");
      setEditDescription(issue.description || "");
      setEditType(issue.type || "task");
      setEditPriority(issue.priority || "medium");
      setEditDueDate(issue.estimatedCompletionDate ? new Date(issue.estimatedCompletionDate) : undefined);
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
        type: editType,
        priority: editPriority,
        assignee: editAssignee?.uid || undefined,
        estimatedCompletionDate: editDueDate ? editDueDate.toISOString() : undefined,
        attachments: allAttachments,
      };

      const response = await apiPatch(`/api/issues/${issue._id}`, updateData, idToken);
      const data = await response.json();

      if (data.success) {
        toast.success("Issue updated successfully");
        setIsEditing(false);
        // Refresh issue data
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

  // Convert project members to user suggestions format
  const memberSuggestions: UserSuggestion[] = projectMembers.map((member) => ({
    uid: member.uid,
    name: member.name,
    email: member.email,
    avatar: member.avatar,
  }));

  // Filter members based on search query
  const filteredMembers = memberSuggestions.filter((member) => {
    if (!assigneeSearchQuery.trim()) return false;
    const query = assigneeSearchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

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
                        editType={editType}
                        editPriority={editPriority}
                        editAssignee={editAssignee}
                        editDueDate={editDueDate}
                        editAttachments={editAttachments}
                        newAttachments={newAttachments}
                        assigneeSearchQuery={assigneeSearchQuery}
                        showAssigneeSuggestions={showAssigneeSuggestions}
                        isSaving={isSaving}
                        isDragActive={isDragActive}
                        onTitleChange={setEditTitle}
                        onDescriptionChange={setEditDescription}
                        onTypeChange={setEditType}
                        onPriorityChange={setEditPriority}
                        onAssigneeChange={setEditAssignee}
                        onDueDateChange={setEditDueDate}
                        onAssigneeSearchChange={setAssigneeSearchQuery}
                        onShowSuggestionsChange={setShowAssigneeSuggestions}
                        onRemoveExistingAttachment={removeExistingAttachment}
                        onRemoveNewAttachment={removeNewAttachment}
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                        filteredMembers={filteredMembers}
                        assigneeSearchRef={assigneeSearchRef as React.RefObject<HTMLDivElement>}
                        assigneeInputRef={assigneeInputRef as React.RefObject<HTMLInputElement>}
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
                            onCommentAdded={fetchIssue}
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
                      <IssueViewModeRight issue={issue as Issue} />
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

