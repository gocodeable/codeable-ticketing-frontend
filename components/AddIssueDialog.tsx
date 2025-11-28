"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserSuggestion } from "@/components/UserSelector";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiPost, apiDelete } from "@/lib/api/apiClient";
import { toast } from "sonner";
import {
  Loader2,
  Calendar as CalendarIcon,
  Search,
  X,
  Upload,
  File,
  Trash2,
} from "lucide-react";
import { ProjectMember } from "@/types/project";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
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
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";

interface AddIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workflowStatusId: string;
  projectMembers: ProjectMember[];
  onIssueCreated?: (issue: any) => void;
}

export function AddIssueDialog({
  open,
  onOpenChange,
  projectId,
  workflowStatusId,
  projectMembers,
  onIssueCreated,
}: AddIssueDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"task" | "bug" | "story" | "epic">("task");
  const [priority, setPriority] = useState<
    "highest" | "high" | "medium" | "low" | "lowest"
  >("medium");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<
    Date | undefined
  >();
  const [selectedAssignee, setSelectedAssignee] =
    useState<UserSuggestion | null>(null);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
  const assigneeSearchRef = useRef<HTMLDivElement>(null);
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      deleting?: boolean;
      error?: string;
    }>
  >([]);

  // Check if any attachment is currently uploading
  const isUploadingAttachments = attachments.some((att) => att.uploading);

  const resetForm = async () => {
    // Clean up uploaded attachments from Firebase Storage
    if (attachments.length > 0 && user) {
      const uploadedAttachments = attachments.filter(
        (att) => att.url && !att.error
      );

      if (uploadedAttachments.length > 0) {
        try {
          const idToken = await user.getIdToken();
          // Delete all uploaded attachments
          await Promise.allSettled(
            uploadedAttachments.map((att) =>
              apiDelete("/api/media", idToken, {
                body: JSON.stringify({ url: att.url }),
              }).catch((err) => {
                console.error(`Failed to delete ${att.file.name}:`, err);
              })
            )
          );
        } catch (error) {
          console.error("Error cleaning up attachments:", error);
        }
      }
    }

    setTitle("");
    setDescription("");
    setType("task");
    setPriority("medium");
    setEstimatedCompletionDate(undefined);
    setSelectedAssignee(null);
    setAssigneeSearchQuery("");
    setShowAssigneeSuggestions(false);
    setAttachments([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeSearchRef.current &&
        !assigneeSearchRef.current.contains(event.target as Node) &&
        assigneeInputRef.current &&
        !assigneeInputRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle file drop/selection
  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    const idToken = await user.getIdToken();

    // Add files to attachments with uploading state
    const startIndex = attachments.length;
    const newAttachments = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setAttachments((prev) =>
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
        setAttachments((prev) =>
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
    disabled: isSubmitting,
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  const removeAttachment = async (index: number) => {
    const attachment = attachments[index];

    // Set deleting state
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, deleting: true } : att))
    );

    // If the file was successfully uploaded (has a URL), delete it from Firebase Storage
    if (attachment.url && !attachment.error) {
      try {
        if (!user) {
          toast.error("You must be logged in to delete files");
          // Remove deleting state and attachment
          setAttachments((prev) => prev.filter((_, i) => i !== index));
          return;
        }

        const idToken = await user.getIdToken();
        const response = await apiDelete("/api/media", idToken, {
          body: JSON.stringify({ url: attachment.url }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(`Failed to delete ${attachment.file.name} from storage`);
          // Still remove from UI even if deletion fails
        }
      } catch (error) {
        console.error("Error deleting file from storage:", error);
        toast.error(`Failed to delete ${attachment.file.name} from storage`);
        // Still remove from UI even if deletion fails
      }
    }

    // Remove from attachments list
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter an issue title");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create an issue");
      return;
    }

    setIsSubmitting(true);

    try {
      const idToken = await user.getIdToken();

      // Prepare issue data
      const issueData = {
        project: projectId,
        workflowStatus: workflowStatusId,
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        assignee: selectedAssignee?.uid || undefined,
        estimatedCompletionDate: estimatedCompletionDate
          ? estimatedCompletionDate.toISOString()
          : undefined,
        attachments: attachments
          .filter((att) => att.url && !att.error)
          .map((att) => att.url!),
      };

      const response = await apiPost("/api/issues", issueData, idToken);

      const data = await response.json();

      if (data.success) {
        toast.success("Issue created successfully");
        // Don't delete attachments on success - they're now part of the issue
        // Just reset form fields without deleting uploaded files
        setTitle("");
        setDescription("");
        setType("task");
        setPriority("medium");
        setEstimatedCompletionDate(undefined);
        setSelectedAssignee(null);
        setAssigneeSearchQuery("");
        setShowAssigneeSuggestions(false);
        setAttachments([]);
        onOpenChange(false);
        if (onIssueCreated) {
          onIssueCreated(data.data);
        }
      } else {
        toast.error(data.message || "Failed to create issue");
      }
    } catch (error) {
      console.error("Error creating issue:", error);
      toast.error("Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    await resetForm();
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Create New Issue
          </DialogTitle>
          <DialogDescription className="text-sm">
            Add a new issue to your project workflow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter issue title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-semibold">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(value: any) => setType(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="type" className="h-11">
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
              <Label htmlFor="priority" className="text-sm font-semibold">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(value: any) => setPriority(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="priority" className="h-11">
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

          {/* Estimated Completion Date and Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estimated Completion Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !estimatedCompletionDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {estimatedCompletionDate ? (
                      format(estimatedCompletionDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={estimatedCompletionDate}
                    onSelect={setEstimatedCompletionDate}
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assign to User */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Assign To <span className="text-destructive">*</span>
              </Label>
              {selectedAssignee ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg h-11">
                  <div className="relative h-6 w-6 rounded-full overflow-hidden ring-2 ring-background">
                    <Image
                      src={selectedAssignee.avatar || DEFAULT_AVATAR}
                      alt={selectedAssignee.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium truncate flex-1">
                    {selectedAssignee.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssignee(null);
                      setAssigneeSearchQuery("");
                      setShowAssigneeSuggestions(false);
                    }}
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                            setSelectedAssignee(member);
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

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30",
                isSubmitting && "opacity-50 cursor-not-allowed"
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

            {/* Uploaded Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
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
                        onClick={() => removeAttachment(index)}
                        disabled={isSubmitting || isUploadingAttachments}
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

          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 -mx-6 -mb-5 mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isUploadingAttachments ||
                !title.trim() ||
                !selectedAssignee
              }
              className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
            >
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
