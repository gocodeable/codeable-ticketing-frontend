"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";
import { Issue, Attachment } from "@/types/issue";
import { File, Download, User, UserCircle, Calendar as CalendarIcon, Clock, Loader2, Play, Search, X } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";
import { isImageFile, isVideoFile } from "@/utils/mediaUtils";
import { MediaViewerDialog } from "./MediaViewerDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { UserSuggestion } from "@/components/UserSelector";
import { PriorityIcon } from "@/components/PriorityIcon";
import { cn } from "@/lib/utils";

interface IssueViewModeProps {
  issue: Issue;
  downloadingAttachments: Set<string>;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
}

// Left Side Component - Description and Attachments
export function IssueViewModeLeft({
  issue,
  downloadingAttachments,
  onDownload,
}: IssueViewModeProps) {
  const { user } = useAuth();
  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    fileName: string;
    isImage: boolean;
    isVideo: boolean;
  } | null>(null);

  const handleMediaClick = (attachment: Attachment) => {
    const isImage = isImageFile(attachment.fileName);
    const isVideo = isVideoFile(attachment.fileName);
    
    if (isImage || isVideo) {
      setViewingMedia({
        url: attachment.link,
        fileName: attachment.fileName,
        isImage,
        isVideo,
      });
    }
  };

  const getThumbnailUrl = (attachment: Attachment): string | null => {
    if (isImageFile(attachment.fileName) || isVideoFile(attachment.fileName)) {
      return attachment.link;
    }
    return null;
  };

  // Handle image clicks in description content
  const handleDescriptionImageClick = useCallback((imageUrl: string) => {
    // Extract filename from URL or use a default
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image';
    const isImage = isImageFile(fileName) || imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)/i);
    
    if (isImage) {
      setViewingMedia({
        url: imageUrl,
        fileName: fileName,
        isImage: true,
        isVideo: false,
      });
    }
  }, []);

  const descriptionContentRef = useRef<HTMLDivElement>(null);

  // Add click handlers to images in description content
  useEffect(() => {
    const handleImageClickEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.issue-description-content')) {
        e.preventDefault();
        e.stopPropagation();
        const imgSrc = (target as HTMLImageElement).src;
        if (imgSrc) {
          handleDescriptionImageClick(imgSrc);
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleImageClickEvent);

    return () => {
      document.removeEventListener('click', handleImageClickEvent);
    };
  }, [handleDescriptionImageClick]);

  return (
    <>
      <div className="space-y-6">
        {/* Description */}
        {issue.description && (
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold text-foreground">Description</Label>
            <div className="rounded-lg bg-muted/30 border border-border/40 dark:border-border/60 p-4">
              <div
                ref={descriptionContentRef}
                className="text-sm text-foreground leading-relaxed issue-description-content"
                dangerouslySetInnerHTML={{ __html: issue.description }}
              />
              <style jsx global>{`
                .issue-description-content {
                  word-wrap: break-word;
                }
                .issue-description-content p {
                  margin: 0.5rem 0;
                }
                .issue-description-content p:first-child {
                  margin-top: 0;
                }
                .issue-description-content p:last-child {
                  margin-bottom: 0;
                }
                .issue-description-content img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 0.375rem;
                  margin: 0.5rem 0;
                  cursor: pointer;
                  transition: opacity 0.2s;
                }
                .issue-description-content img:hover {
                  opacity: 0.8;
                }
                .issue-description-content ul,
                .issue-description-content ol {
                  margin: 0.5rem 0;
                  padding-left: 1.5rem;
                  color: hsl(var(--foreground));
                  list-style-position: outside;
                }
                .issue-description-content ul {
                  list-style-type: disc;
                }
                .issue-description-content ol {
                  list-style-type: decimal;
                }
                .issue-description-content ul li,
                .issue-description-content ol li {
                  color: hsl(var(--foreground));
                  display: list-item;
                }
                .issue-description-content ul li::marker,
                .issue-description-content ol li::marker {
                  color: hsl(var(--foreground));
                }
                .issue-description-content a {
                  color: hsl(var(--primary));
                  text-decoration: underline;
                }
                .issue-description-content a:hover {
                  color: hsl(var(--primary) / 0.8);
                }
                .issue-description-content h1,
                .issue-description-content h2,
                .issue-description-content h3 {
                  margin: 1rem 0 0.5rem 0;
                  font-weight: 600;
                }
                .issue-description-content h1 {
                  font-size: 1.5rem;
                }
                .issue-description-content h2 {
                  font-size: 1.25rem;
                }
                .issue-description-content h3 {
                  font-size: 1.125rem;
                }
                .issue-description-content table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  margin: 0.75rem 0;
                  font-size: 0.8125rem;
                  border: 1px solid hsl(var(--border));
                  border-radius: 8px;
                  overflow: hidden;
                }
                .issue-description-content table th,
                .issue-description-content table td {
                  border-bottom: 1px solid hsl(var(--border));
                  border-right: 1px solid hsl(var(--border));
                  padding: 0.5rem 0.75rem;
                  text-align: left;
                }
                .issue-description-content table th:last-child,
                .issue-description-content table td:last-child {
                  border-right: none;
                }
                .issue-description-content table tr:last-child td {
                  border-bottom: none;
                }
                .issue-description-content table th {
                  background: hsl(var(--muted));
                  font-weight: 600;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.025em;
                  color: hsl(var(--muted-foreground));
                }
                .issue-description-content table tr:nth-child(even) td {
                  background: hsl(var(--muted) / 0.3);
                }
                .issue-description-content table tr:hover td {
                  background: hsl(var(--muted) / 0.5);
                }
                .issue-description-content code {
                  background: hsl(var(--muted));
                  padding: 0.125rem 0.375rem;
                  border-radius: 0.25rem;
                  font-size: 0.8125rem;
                  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
                }
                .issue-description-content blockquote {
                  border-left: 3px solid hsl(var(--border));
                  padding-left: 1rem;
                  margin: 0.75rem 0;
                  color: hsl(var(--muted-foreground));
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Attachments */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <File className="w-4 h-4" />
              Attachments ({issue.attachments.length})
            </Label>
            
            {/* Separate media files from non-media files */}
            {(() => {
              const mediaFiles = issue.attachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
              const nonMediaFiles = issue.attachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
              
              return (
                <>
                  {/* Media Files Grid - Smaller thumbnails */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                      {mediaFiles.map((attachment, index) => {
                        const attachmentId = (attachment as any)._id || attachment.link;
                        const isDownloading = downloadingAttachments.has(attachmentId);
                        const isImage = isImageFile(attachment.fileName);
                        const isVideo = isVideoFile(attachment.fileName);
                        const thumbnailUrl = getThumbnailUrl(attachment);

                        return (
                          <div
                            key={index}
                            className="relative group rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                            onClick={() => handleMediaClick(attachment)}
                          >
                            <div className="aspect-square relative w-full">
                              {isImage ? (
                                <Image
                                  src={thumbnailUrl || attachment.link}
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
                                    src={thumbnailUrl || attachment.link}
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
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="text-white text-[10px] font-medium bg-black/60 px-1.5 py-0.5 rounded">
                                {isImage ? 'View' : 'Play'}
                              </div>
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
                                onDownload(attachment, attachmentId);
                              }}
                              disabled={isDownloading}
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

                  {/* Non-Media Files List */}
                  {nonMediaFiles.length > 0 && (
                    <div className="space-y-2">
                      {nonMediaFiles.map((attachment, index) => {
                        const attachmentId = (attachment as any)._id || attachment.link;
                        const isDownloading = downloadingAttachments.has(attachmentId);
                        return (
                          <div
                            key={`non-media-${index}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 hover:bg-muted/40 transition-colors"
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
                              onClick={() => onDownload(attachment, attachmentId)}
                              disabled={isDownloading}
                              className="gap-1.5 rounded-lg shrink-0 h-8 px-2"
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span className="hidden sm:inline text-xs">Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-xs">Download</span>
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
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
    </>
  );
}

// Right Side Component - Details Grid
export function IssueViewModeRight({
  issue,
  canEdit = false,
  workflowStatuses = [],
  projectMembers = [],
  onTypeChange,
  onPriorityChange,
  onAssigneeChange,
  onAssigneeRemove,
  onDueDateChange,
  onWorkflowStatusChange,
}: {
  issue: Issue;
  canEdit?: boolean;
  workflowStatuses?: Array<{ _id: string; name: string; color?: string }>;
  projectMembers?: Array<{ uid: string; name: string; email: string; avatar?: string }>;
  onTypeChange?: (value: "task" | "bug" | "story" | "epic") => void;
  onPriorityChange?: (value: "highest" | "high" | "medium" | "low" | "lowest") => void;
  onAssigneeChange?: (assignee: UserSuggestion | null) => void;
  onAssigneeRemove?: () => void;
  onDueDateChange?: (date: Date | undefined) => void;
  onWorkflowStatusChange?: (value: string) => void;
}) {
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
  const [isAssigneeRemoved, setIsAssigneeRemoved] = useState(false);
  const assigneeSearchRef = useRef<HTMLDivElement>(null);
  const assigneeInputRef = useRef<HTMLInputElement>(null);

  // Convert project members to user suggestions format
  const memberSuggestions: UserSuggestion[] = projectMembers.map((member) => ({
    uid: member.uid,
    name: member.name,
    email: member.email,
    avatar: member.avatar,
  }));

  // Filter members based on search query
  const filteredMembers = memberSuggestions.filter((member) => {
    if (!assigneeSearchQuery.trim()) return true;
    const query = assigneeSearchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  // Get current workflow status ID
  const currentWorkflowStatusId = typeof issue.workflowStatus === "object" && issue.workflowStatus?._id
    ? issue.workflowStatus._id
    : typeof issue.workflowStatus === "string"
    ? issue.workflowStatus
    : "";

  // Get current assignee as UserSuggestion
  const currentAssignee: UserSuggestion | null = !isAssigneeRemoved && issue.assignee && typeof issue.assignee === "object"
    ? {
        uid: issue.assignee.uid,
        name: issue.assignee.name,
        email: "",
        avatar: issue.assignee.avatar,
      }
    : null;

  // Reset removed state when issue changes
  useEffect(() => {
    setIsAssigneeRemoved(false);
  }, [issue._id]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeSearchRef.current &&
        !assigneeSearchRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {/* Type and Workflow Status in one row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Type
            </Label>
            {canEdit && onTypeChange ? (
              <Select
                value={issue.type || "task"}
                onValueChange={(value: any) => onTypeChange(value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        issue.type === "task" && "bg-blue-500",
                        issue.type === "bug" && "bg-red-500",
                        issue.type === "story" && "bg-green-500",
                        issue.type === "epic" && "bg-purple-500"
                      )} />
                      {issue.type ? issue.type.charAt(0).toUpperCase() + issue.type.slice(1) : "Task"}
                    </span>
                  </SelectValue>
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
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  issue.type === "task" && "bg-blue-500",
                  issue.type === "bug" && "bg-red-500",
                  issue.type === "story" && "bg-green-500",
                  issue.type === "epic" && "bg-purple-500"
                )} />
                <span className="text-sm font-medium">
                  {issue.type ? issue.type.charAt(0).toUpperCase() + issue.type.slice(1) : "Task"}
                </span>
              </div>
            )}
          </div>

          {/* Workflow Status */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Workflow Status
            </Label>
            {canEdit && onWorkflowStatusChange && workflowStatuses.length > 0 ? (
              <Select
                value={currentWorkflowStatusId}
                onValueChange={onWorkflowStatusChange}
              >
                <SelectTrigger className="h-11">
                  <SelectValue>
                    {currentWorkflowStatusId && workflowStatuses.find(s => s._id === currentWorkflowStatusId) ? (
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ 
                            backgroundColor: workflowStatuses.find(s => s._id === currentWorkflowStatusId)?.color || '#3b82f6' 
                          }}
                        />
                        {workflowStatuses.find(s => s._id === currentWorkflowStatusId)?.name}
                      </span>
                    ) : (
                      "Select status"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {workflowStatuses.map((status) => (
                    <SelectItem key={status._id} value={status._id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: status.color || '#3b82f6' }}
                        />
                        {status.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
                {currentWorkflowStatusId && workflowStatuses.find(s => s._id === currentWorkflowStatusId) ? (
                  <>
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ 
                        backgroundColor: workflowStatuses.find(s => s._id === currentWorkflowStatusId)?.color || '#3b82f6' 
                      }}
                    />
                    <span className="text-sm font-medium">
                      {workflowStatuses.find(s => s._id === currentWorkflowStatusId)?.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No status</span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Workflow Status helper text */}
        {canEdit && onWorkflowStatusChange && workflowStatuses.length > 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            Changing workflow will move the issue to the top of the new status
          </p>
        )}

        {/* Priority */}
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Priority
          </Label>
          {canEdit && onPriorityChange ? (
            <Select
              value={issue.priority || "medium"}
              onValueChange={(value: any) => onPriorityChange(value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue>
                  {issue.priority ? (
                    <span className="flex items-center gap-2 capitalize">
                      <PriorityIcon priority={issue.priority} />
                      {issue.priority}
                    </span>
                  ) : (
                    "Medium"
                  )}
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
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <PriorityIcon priority={issue.priority || "medium"} />
              <span className="text-sm font-medium capitalize">
                {issue.priority || "Medium"}
              </span>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Assign To
          </Label>
          {canEdit && (onAssigneeChange || onAssigneeRemove) ? (
            currentAssignee ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg h-11">
                <div className="relative h-6 w-6 rounded-full overflow-hidden ring-2 ring-background">
                  <Image
                    src={currentAssignee.avatar || DEFAULT_AVATAR}
                    alt={currentAssignee.name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium truncate flex-1">
                  {currentAssignee.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // Just remove from UI, don't trigger API call
                    setIsAssigneeRemoved(true);
                    setAssigneeSearchQuery("");
                    setShowAssigneeSuggestions(true);
                    // Call remove handler if provided (for optimistic UI update)
                    if (onAssigneeRemove) {
                      onAssigneeRemove();
                    }
                    // Focus the input after a brief delay
                    setTimeout(() => {
                      assigneeInputRef.current?.focus();
                    }, 100);
                  }}
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
                      setShowAssigneeSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowAssigneeSuggestions(true);
                    }}
                    className="pl-9 h-11"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showAssigneeSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member.uid}
                          type="button"
                          onClick={() => {
                            // Reset removed state and trigger API call with new assignee
                            setIsAssigneeRemoved(false);
                            if (onAssigneeChange) {
                              onAssigneeChange(member);
                            }
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
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        No members found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          ) : issue.assignee && typeof issue.assignee === "object" ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={issue.assignee.avatar || DEFAULT_AVATAR}
                  alt={issue.assignee.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">{issue.assignee.name}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 dark:border-border/60 border-dashed">
              <span className="text-sm text-muted-foreground">Unassigned</span>
            </div>
          )}
        </div>

        {/* Reporter */}
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" />
            Reporter
          </Label>
          {issue.reporter && typeof issue.reporter === "object" ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={issue.reporter.avatar || DEFAULT_AVATAR}
                  alt={issue.reporter.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-sm font-medium">{issue.reporter.name}</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 dark:border-border/60 border-dashed">
              <span className="text-sm text-muted-foreground">No reporter</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            Due Date
          </Label>
          {canEdit && onDueDateChange ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !issue.estimatedCompletionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issue.estimatedCompletionDate ? (
                    format(new Date(issue.estimatedCompletionDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={issue.estimatedCompletionDate ? new Date(issue.estimatedCompletionDate) : undefined}
                  onSelect={(date) => onDueDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : issue.estimatedCompletionDate ? (
            (() => {
              const dueDate = new Date(issue.estimatedCompletionDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              dueDate.setHours(0, 0, 0, 0);
              const isOverdue = today > dueDate;
              
              return (
                <div className={`p-2.5 rounded-lg border ${
                  isOverdue 
                    ? "bg-destructive/10 border-destructive/50 dark:bg-destructive/20 dark:border-destructive/60" 
                    : "bg-muted/30 border-border/40 dark:border-border/60"
                }`}>
                  <p className={`text-sm font-medium ${
                    isOverdue ? "text-destructive dark:text-destructive" : ""
                  }`}>
                    {format(new Date(issue.estimatedCompletionDate), "PPP")}
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 dark:border-border/60 border-dashed">
              <span className="text-sm text-muted-foreground">No due date</span>
            </div>
          )}
        </div>

        {/* Created At */}
        {issue.createdAt && (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Created
            </Label>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <p className="text-sm font-medium">
                {format(new Date(issue.createdAt), "PPP")}
              </p>
            </div>
          </div>
        )}

        {/* Updated At */}
        {issue.updatedAt && (
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Updated
            </Label>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 dark:border-border/60">
              <p className="text-sm font-medium">
                {format(new Date(issue.updatedAt), "PPP")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy component for backward compatibility
export function IssueViewMode({
  issue,
  downloadingAttachments,
  onDownload,
}: IssueViewModeProps) {
  return (
    <>
      <IssueViewModeLeft issue={issue} downloadingAttachments={downloadingAttachments} onDownload={onDownload} />
      <IssueViewModeRight issue={issue} />
    </>
  );
}
