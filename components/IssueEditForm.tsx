"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Attachment } from "@/types/issue";
import { UserSuggestion } from "@/components/UserSelector";
import { Calendar as CalendarIcon, File, Upload, Trash2, Search, X, Loader2, Play } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatFileSize, getPriorityColor } from "../utils/issueUtils";
import { isImageFile, isVideoFile } from "@/utils/mediaUtils";
import { PriorityIcon } from "@/components/PriorityIcon";
import { useState } from "react";
import { MediaViewerDialog } from "./MediaViewerDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { RichTextEditor } from "./RichTextEditor";

interface IssueEditFormProps {
  // Form values
  editTitle: string;
  editDescription: string;
  editType: "task" | "bug" | "story" | "epic";
  editPriority: "highest" | "high" | "medium" | "low" | "lowest";
  editAssignee: UserSuggestion | null;
  editDueDate: Date | undefined;
  editAttachments: Attachment[];
  newAttachments: Array<{
    file: File;
    url?: string;
    uploading: boolean;
    deleting?: boolean;
    error?: string;
  }>;
  assigneeSearchQuery: string;
  showAssigneeSuggestions: boolean;
  isSaving: boolean;
  isDragActive: boolean;
  
  // Handlers
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTypeChange: (value: "task" | "bug" | "story" | "epic") => void;
  onPriorityChange: (value: "highest" | "high" | "medium" | "low" | "lowest") => void;
  onAssigneeChange: (assignee: UserSuggestion | null) => void;
  onDueDateChange: (date: Date | undefined) => void;
  onAssigneeSearchChange: (query: string) => void;
  onShowSuggestionsChange: (show: boolean) => void;
  onRemoveExistingAttachment: (index: number) => void;
  onRemoveNewAttachment: (index: number) => void;
  getRootProps: () => any;
  getInputProps: () => any;
  
  // Project members
  filteredMembers: UserSuggestion[];
  
  // Refs
  assigneeSearchRef: React.RefObject<HTMLDivElement>;
  assigneeInputRef: React.RefObject<HTMLInputElement>;
}

export function IssueEditForm({
  editTitle,
  editDescription,
  editType,
  editPriority,
  editAssignee,
  editDueDate,
  editAttachments,
  newAttachments,
  assigneeSearchQuery,
  showAssigneeSuggestions,
  isSaving,
  isDragActive,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
  onAssigneeSearchChange,
  onShowSuggestionsChange,
  onRemoveExistingAttachment,
  onRemoveNewAttachment,
  getRootProps,
  getInputProps,
  filteredMembers,
  assigneeSearchRef,
  assigneeInputRef,
}: IssueEditFormProps) {
  const { user } = useAuth();
  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    fileName: string;
    isImage: boolean;
    isVideo: boolean;
  } | null>(null);

  const handleMediaClick = (attachment: { link?: string; fileName: string; file?: File }) => {
    const isImage = isImageFile(attachment.fileName);
    const isVideo = isVideoFile(attachment.fileName);
    
    if (isImage || isVideo) {
      let mediaUrl = attachment.link || '';
      
      // For new attachments (File objects), create object URL immediately
      if (attachment.file && !attachment.link) {
        mediaUrl = URL.createObjectURL(attachment.file);
      }
      
      // Open dialog immediately - MediaViewerDialog will handle loading
      setViewingMedia({
        url: mediaUrl || (attachment.file ? URL.createObjectURL(attachment.file) : ''),
        fileName: attachment.fileName,
        isImage,
        isVideo,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="edit-title" className="text-sm font-semibold text-foreground">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-title"
          placeholder="Enter issue title..."
          value={editTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isSaving}
          required
          className="h-11 rounded-lg"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-description" className="text-sm font-semibold text-foreground">
          Description
        </Label>
        <RichTextEditor
          value={editDescription}
          onChange={onDescriptionChange}
          placeholder="Describe the issue in detail..."
          disabled={isSaving}
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
            onValueChange={(value: any) => onTypeChange(value)}
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
            onValueChange={(value: any) => onPriorityChange(value)}
            disabled={isSaving}
          >
            <SelectTrigger id="edit-priority" className="h-11">
              <SelectValue placeholder="Select priority">
                {editPriority ? (
                  <span className="flex items-center gap-2 capitalize">
                    <PriorityIcon priority={editPriority} />
                    {editPriority}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="highest">
                <span className="flex items-center gap-2">
                  <PriorityIcon priority="highest" className="text-red-600" />
                  Highest
                </span>
              </SelectItem>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <PriorityIcon priority="high" className="text-orange-500" />
                  High
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <PriorityIcon priority="medium" className="text-yellow-600 dark:text-yellow-500" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <PriorityIcon priority="low" className="text-blue-500" />
                  Low
                </span>
              </SelectItem>
              <SelectItem value="lowest">
                <span className="flex items-center gap-2">
                  <PriorityIcon priority="lowest" className="text-gray-500" />
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
                onSelect={onDueDateChange}
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
                  onAssigneeChange(null);
                  onAssigneeSearchChange("");
                  onShowSuggestionsChange(false);
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
                    onAssigneeSearchChange(e.target.value);
                    onShowSuggestionsChange(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (assigneeSearchQuery.trim().length > 0) {
                      onShowSuggestionsChange(true);
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
                        onAssigneeChange(member);
                        onAssigneeSearchChange("");
                        onShowSuggestionsChange(false);
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
        {editAttachments.length > 0 && (() => {
          const mediaFiles = editAttachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
          const nonMediaFiles = editAttachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
          
          return (
            <>
              {/* Media Files Grid */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                  {mediaFiles.map((attachment, index) => {
                    const originalIndex = editAttachments.indexOf(attachment);
                    const isImage = isImageFile(attachment.fileName);
                    const isVideo = isVideoFile(attachment.fileName);
                    
                    return (
                      <div
                        key={originalIndex}
                        className="relative group rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 overflow-hidden"
                      >
                        <div 
                          className="aspect-square relative w-full cursor-pointer"
                          onClick={() => handleMediaClick(attachment)}
                        >
                          {isImage ? (
                            <Image
                              src={attachment.link}
                              alt={attachment.fileName}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <>
                              <video
                                src={attachment.link}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-5 h-5 text-white" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-[10px] text-white truncate font-medium leading-tight">
                            {attachment.fileName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveExistingAttachment(originalIndex);
                          }}
                          disabled={isSaving}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-Media Files List */}
              {nonMediaFiles.length > 0 && (
                <div className="space-y-1.5">
                  {nonMediaFiles.map((attachment, index) => {
                    const originalIndex = editAttachments.indexOf(attachment);
                    return (
                      <div
                        key={originalIndex}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 hover:bg-muted/40 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                          <File className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.fileName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveExistingAttachment(originalIndex)}
                          disabled={isSaving}
                          className="gap-1.5 rounded-lg shrink-0 h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

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
        {newAttachments.length > 0 && (() => {
          const mediaFiles = newAttachments.filter(att => isImageFile(att.file.name) || isVideoFile(att.file.name));
          const nonMediaFiles = newAttachments.filter(att => !isImageFile(att.file.name) && !isVideoFile(att.file.name));
          
          return (
            <>
              {/* Media Files Grid */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                  {mediaFiles.map((attachment, index) => {
                    const originalIndex = newAttachments.indexOf(attachment);
                    const isImage = isImageFile(attachment.file.name);
                    const isVideo = isVideoFile(attachment.file.name);
                    // Use uploaded URL if available, otherwise create object URL
                    const thumbnailUrl = attachment.url || URL.createObjectURL(attachment.file);
                    
                    return (
                      <div
                        key={originalIndex}
                        className={cn(
                          "relative group rounded-lg border overflow-hidden",
                          attachment.error
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border/40 dark:border-border/60 bg-muted/30"
                        )}
                      >
                        <div 
                          className="aspect-square relative w-full cursor-pointer"
                          onClick={() => handleMediaClick({ file: attachment.file, fileName: attachment.file.name, link: attachment.url })}
                        >
                          {isImage ? (
                            <Image
                              src={thumbnailUrl}
                              alt={attachment.file.name}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <>
                              <video
                                src={thumbnailUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-5 h-5 text-white" />
                              </div>
                            </>
                          )}
                          {(attachment.uploading || attachment.deleting) && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-[10px] text-white truncate font-medium leading-tight">
                            {attachment.file.name}
                          </p>
                          {attachment.error && (
                            <p className="text-[10px] text-red-300 truncate">
                              {attachment.error}
                            </p>
                          )}
                        </div>
                        {!(attachment.uploading || attachment.deleting) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!attachment.url && thumbnailUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(thumbnailUrl);
                              }
                              onRemoveNewAttachment(originalIndex);
                            }}
                            disabled={isSaving}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-Media Files List */}
              {nonMediaFiles.length > 0 && (
                <div className="space-y-1.5">
                  {nonMediaFiles.map((attachment, index) => {
                    const originalIndex = newAttachments.indexOf(attachment);
                    return (
                      <div
                        key={originalIndex}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border",
                          attachment.error
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border/40 dark:border-border/60 bg-muted/30"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                          <File className="h-3.5 w-3.5 text-primary" />
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
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRemoveNewAttachment(originalIndex)}
                            disabled={isSaving}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Media Viewer Dialog */}
      {viewingMedia && (
        <MediaViewerDialog
          open={!!viewingMedia}
          onOpenChange={(open) => {
            if (!open) {
              if (viewingMedia.url.startsWith('blob:')) {
                URL.revokeObjectURL(viewingMedia.url);
              }
              setViewingMedia(null);
            }
          }}
          mediaUrl={viewingMedia.url}
          fileName={viewingMedia.fileName}
          isImage={viewingMedia.isImage}
          isVideo={viewingMedia.isVideo}
        />
      )}
    </div>
  );
}

