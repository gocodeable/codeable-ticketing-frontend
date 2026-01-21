"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Attachment } from "@/types/issue";
import { File, Upload, Trash2, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "../utils/issueUtils";
import { isImageFile, isVideoFile } from "@/utils/mediaUtils";
import { useState } from "react";
import { MediaViewerDialog } from "./MediaViewerDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { RichTextEditor } from "./RichTextEditor";
import Image from "next/image";

interface IssueEditFormProps {
  // Form values
  editTitle: string;
  editDescription: string;
  editAttachments: Attachment[];
  newAttachments: Array<{
    file: File;
    url?: string;
    uploading: boolean;
    deleting?: boolean;
    error?: string;
  }>;
  isSaving: boolean;
  isDragActive: boolean;
  
  // Handlers
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRemoveExistingAttachment: (index: number) => void;
  onRemoveNewAttachment: (index: number) => void;
  getRootProps: () => any;
  getInputProps: () => any;
}

export function IssueEditForm({
  editTitle,
  editDescription,
  editAttachments,
  newAttachments,
  isSaving,
  isDragActive,
  onTitleChange,
  onDescriptionChange,
  onRemoveExistingAttachment,
  onRemoveNewAttachment,
  getRootProps,
  getInputProps,
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

