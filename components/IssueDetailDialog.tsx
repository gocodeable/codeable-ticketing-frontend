"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Issue, Attachment } from "@/types/issue";
import { Comment } from "@/types/comment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet, apiPatch } from "@/lib/api/apiClient";
import { toast } from "sonner";
import {
  Loader2,
  Calendar as CalendarIcon,
  File,
  Download,
  MessageCircle,
  User,
  Clock,
  Pencil,
  X,
  Check,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { UserSuggestion } from "@/components/UserSelector";
import { apiDelete } from "@/lib/api/apiClient";

interface IssueDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string | null;
  getPriorityColor: (priority: string) => string;
  isAdmin?: boolean;
  userRole?: "admin" | "developer" | "qa";
  projectMembers?: Array<{ uid: string; name: string; email: string; avatar?: string }>;
  onIssueUpdated?: (issue: Issue) => void;
}

interface PopulatedIssue extends Omit<Issue, 'comments'> {
  comments?: Comment[];
}

export function IssueDetailDialog({
  open,
  onOpenChange,
  issueId,
  getPriorityColor,
  isAdmin = false,
  userRole,
  projectMembers = [],
  onIssueUpdated,
}: IssueDetailDialogProps) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<PopulatedIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "bug":
        return "bg-red-500";
      case "story":
        return "bg-green-500";
      case "epic":
        return "bg-purple-500";
      default:
        return "bg-blue-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Check if user can edit this issue
  const canEditIssue = (): boolean => {
    if (!user || !issue) return false;
    if (isAdmin || userRole === "qa") return true;
    // Check if user is the reporter
    return user.uid === issue.reporter;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {loading ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle>Loading Issue</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : issue ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {!isEditing ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          {issue.issueCode}
                        </span>
                        {issue.type && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full text-white",
                              getTypeColor(issue.type)
                            )}
                          >
                            {issue.type}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full border",
                            getPriorityColor(issue.priority || "medium")
                          )}
                        >
                          {issue.priority || "medium"}
                        </span>
                      </div>
                      <DialogTitle className="text-2xl font-bold tracking-tight mb-2">
                        {issue.title}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        {typeof issue.workflowStatus === "object" && issue.workflowStatus
                          ? issue.workflowStatus.name
                          : "Unknown Status"}
                      </DialogDescription>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          {issue.issueCode}
                        </span>
                      </div>
                      <DialogTitle className="text-2xl font-bold tracking-tight mb-2">
                        Edit Issue
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Update issue details and attachments
                      </DialogDescription>
                    </>
                  )}
                </div>
                {!isEditing && canEditIssue() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editTitle.trim()}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="px-6 py-5 space-y-6">
              {isEditing ? (
                // Edit Form
                <>
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="text-sm font-semibold">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      placeholder="Enter issue title..."
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={isSaving}
                      required
                      className="h-11"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-sm font-semibold">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Describe the issue in detail..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      disabled={isSaving}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Type and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-type" className="text-sm font-semibold">
                        Type
                      </Label>
                      <Select
                        value={editType}
                        onValueChange={(value: any) => setEditType(value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="edit-type" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Task
                            </span>
                          </SelectItem>
                          <SelectItem value="bug">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Bug
                            </span>
                          </SelectItem>
                          <SelectItem value="story">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Story
                            </span>
                          </SelectItem>
                          <SelectItem value="epic">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Epic
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-priority" className="text-sm font-semibold">
                        Priority
                      </Label>
                      <Select
                        value={editPriority}
                        onValueChange={(value: any) => setEditPriority(value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="edit-priority" className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highest">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-600" />
                              Highest
                            </span>
                          </SelectItem>
                          <SelectItem value="high">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              High
                            </span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value="low">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              Low
                            </span>
                          </SelectItem>
                          <SelectItem value="lowest">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              Lowest
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Due Date and Assignee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11",
                              !editDueDate && "text-muted-foreground"
                            )}
                            disabled={isSaving}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editDueDate ? (
                              format(editDueDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editDueDate}
                            onSelect={setEditDueDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Assign To</Label>
                      {editAssignee ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg h-11">
                          <div className="relative h-6 w-6 rounded-full overflow-hidden ring-2 ring-background">
                            <Image
                              src={editAssignee.avatar || DEFAULT_AVATAR}
                              alt={editAssignee.name}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium truncate flex-1">
                            {editAssignee.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditAssignee(null);
                              setAssigneeSearchQuery("");
                              setShowAssigneeSuggestions(false);
                            }}
                            disabled={isSaving}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative" ref={assigneeSearchRef}>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              ref={assigneeInputRef}
                              type="text"
                              placeholder="Search members..."
                              value={assigneeSearchQuery}
                              onChange={(e) => {
                                setAssigneeSearchQuery(e.target.value);
                                setShowAssigneeSuggestions(
                                  e.target.value.trim().length > 0
                                );
                              }}
                              onFocus={() => {
                                if (assigneeSearchQuery.trim().length > 0) {
                                  setShowAssigneeSuggestions(true);
                                }
                              }}
                              disabled={isSaving}
                              className="pl-9 h-11"
                            />
                          </div>

                          {/* Suggestions Dropdown */}
                          {showAssigneeSuggestions && filteredMembers.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredMembers.map((member) => (
                                <button
                                  key={member.uid}
                                  type="button"
                                  onClick={() => {
                                    setEditAssignee(member);
                                    setAssigneeSearchQuery("");
                                    setShowAssigneeSuggestions(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                                >
                                  <div className="shrink-0 relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-border">
                                    <Image
                                      src={member.avatar || DEFAULT_AVATAR}
                                      alt={member.name}
                                      width={32}
                                      height={32}
                                      className="rounded-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {member.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.email}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* No Results Message */}
                          {showAssigneeSuggestions &&
                            assigneeSearchQuery.trim().length > 0 &&
                            filteredMembers.length === 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                                No members found matching &quot;{assigneeSearchQuery}
                                &quot;
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Attachments</Label>

                    {/* Existing Attachments */}
                    {editAttachments.length > 0 && (
                      <div className="space-y-2">
                        {editAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <File className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.fileName}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExistingAttachment(index)}
                              disabled={isSaving}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dropzone for new attachments */}
                    <div
                      {...getRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                        isDragActive
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30",
                        isSaving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      {isDragActive ? (
                        <p className="text-sm font-medium text-primary">
                          Drop files here...
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground mb-1">
                            Drag & drop files here, or click to select
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Maximum file size: 50MB
                          </p>
                        </>
                      )}
                    </div>

                    {/* New Attachments List */}
                    {newAttachments.length > 0 && (
                      <div className="space-y-2">
                        {newAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              attachment.error
                                ? "border-destructive/50 bg-destructive/10"
                                : "border-border bg-muted/30"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <File className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.file.size)}
                                {attachment.uploading && " • Uploading..."}
                                {attachment.deleting && " • Deleting..."}
                                {attachment.error && ` • ${attachment.error}`}
                              </p>
                            </div>
                            {attachment.uploading || attachment.deleting ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => removeNewAttachment(index)}
                                disabled={isSaving}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  {/* Description */}
                  {issue.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Description</Label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {issue.description}
                      </p>
                    </div>
                  )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assignee
                  </Label>
                  {issue.assignee && typeof issue.assignee === "object" ? (
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-background">
                        <Image
                          src={issue.assignee.avatar || DEFAULT_AVATAR}
                          alt={issue.assignee.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span className="text-sm">{issue.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>

                {/* Due Date */}
                {issue.estimatedCompletionDate && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Due Date
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(issue.estimatedCompletionDate), "PPP")}
                    </p>
                  </div>
                )}

                {/* Created At */}
                {issue.createdAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Created
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(issue.createdAt), "PPP")}
                    </p>
                  </div>
                )}

                {/* Updated At */}
                {issue.updatedAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Updated
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(issue.updatedAt), "PPP")}
                    </p>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {issue.attachments && issue.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <File className="w-4 h-4" />
                    Attachments ({issue.attachments.length})
                  </Label>
                  <div className="space-y-2">
                    {issue.attachments.map((attachment, index) => {
                      const attachmentId = (attachment as any)._id || attachment.link;
                      const isDownloading = downloadingAttachments.has(attachmentId);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <File className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.fileName}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(attachment, attachmentId)}
                            disabled={isDownloading}
                            className="gap-2"
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                  {/* Comments */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Comments ({issue.comments?.length || issue.commentCount || 0})
                    </Label>
                    {issue.comments && issue.comments.length > 0 ? (
                      <div className="space-y-3">
                        {issue.comments.map((comment) => (
                          <div
                            key={comment._id}
                            className="p-4 rounded-lg border border-border bg-muted/30"
                          >
                            <div className="flex items-start gap-3 mb-2">
                              {(() => {
                                const author =
                                  comment.author ||
                                  (typeof comment.authorId === "object"
                                    ? comment.authorId
                                    : null);
                                return author ? (
                                  <>
                                    <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-background shrink-0">
                                      <Image
                                        src={author.avatar || DEFAULT_AVATAR}
                                        alt={author.name || "User"}
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">
                                        {author.name || "Unknown User"}
                                      </p>
                                      {comment.createdAt && (
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(comment.createdAt), "PPP 'at' p")}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">
                                      Unknown Author
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap ml-11">
                              {comment.message}
                            </p>
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-3 ml-11 space-y-2">
                                {comment.attachments.map((attachment, index) => {
                                  const attachmentId = `${comment._id}-${index}`;
                                  const isDownloading = downloadingAttachments.has(attachmentId);
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 p-2 rounded border border-border bg-background"
                                    >
                                      <File className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs truncate flex-1">
                                        {attachment.fileName}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(attachment, attachmentId)}
                                        disabled={isDownloading}
                                        className="h-6 px-2"
                                      >
                                        {isDownloading ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Download className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle>Issue Not Found</DialogTitle>
              <DialogDescription>
                The issue you're looking for could not be found.
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

