"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Comment } from "@/types/comment";
import { File, Loader2, Play, Upload, X, Paperclip } from "lucide-react";
import Image from "next/image";
import { isImageFile, isVideoFile } from "@/utils/mediaUtils";
import { RichTextEditor } from "./RichTextEditor";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { toast } from "sonner";

interface EditCommentFormProps {
  comment: Comment;
  onSave: () => void;
  onCancel: () => void;
}

export function EditCommentForm({ comment, onSave, onCancel }: EditCommentFormProps) {
  const { user } = useAuth();
  const [editMessage, setEditMessage] = useState(comment.message || "");
  const [editAttachments, setEditAttachments] = useState<Array<{ link: string; fileName: string }>>(
    comment.attachments || []
  );
  const [editNewAttachments, setEditNewAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      error?: string;
    }>
  >([]);
  const [showEditAttachments, setShowEditAttachments] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle file drop/selection for edit attachments
  const onEditDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setShowEditAttachments(true);
    const idToken = await user.getIdToken();

    // Add files to editNewAttachments with uploading state
    const startIndex = editNewAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setEditNewAttachments((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setEditNewAttachments((prev) =>
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
        setEditNewAttachments((prev) =>
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

  const { getRootProps: getEditRootProps, getInputProps: getEditInputProps, isDragActive: isEditDragActive } = useDropzone({
    onDrop: onEditDrop,
    disabled: isUpdating,
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  const handleSave = async () => {
    if (!user) {
      return;
    }

    // Strip HTML tags to check if message is empty
    const textContent = editMessage.replace(/<[^>]*>/g, "").trim();
    
    // Combine existing attachments and new uploaded attachments
    const newUploadedAttachments = editNewAttachments
      .filter((att) => att.url && !att.error)
      .map((att) => ({
        link: att.url!,
        fileName: att.file.name,
      }));
    
    const allAttachments = [...editAttachments, ...newUploadedAttachments];
    
    if (!textContent && allAttachments.length === 0) {
      toast.error("Please enter a comment or attach a file");
      return;
    }

    setIsUpdating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: editMessage.trim() || " ",
          attachments: allAttachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update comment");
        return;
      }

      toast.success("Comment updated successfully");
      onSave();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Clean up any blob URLs from new attachments
    editNewAttachments.forEach((att) => {
      if (att.url && att.url.startsWith('blob:')) {
        URL.revokeObjectURL(att.url);
      }
    });
    onCancel();
  };

  const removeEditAttachment = async (index: number) => {
    const attachment = editAttachments[index];
    
    // If it's a Firebase Storage URL, delete from storage
    if (attachment.link && (attachment.link.includes('storage.googleapis.com') || attachment.link.includes('firebasestorage.app')) && user) {
      try {
        const idToken = await user.getIdToken();
        const deleteResponse = await fetch("/api/media", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url: attachment.link }),
        });
        const deleteData = await deleteResponse.json();
        if (!deleteData.success) {
          console.warn(`Failed to delete ${attachment.fileName} from storage:`, deleteData.error);
        }
      } catch (deleteError) {
        console.error(`Error deleting ${attachment.fileName} from storage:`, deleteError);
      }
    }
    
    setEditAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeEditNewAttachment = async (index: number) => {
    const attachment = editNewAttachments[index];
    
    // Clean up blob URL if it exists
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
    // If file was uploaded, delete from storage
    if (attachment.url && !attachment.url.startsWith('blob:') && user) {
      try {
        const idToken = await user.getIdToken();
        const deleteResponse = await fetch("/api/media", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ url: attachment.url }),
        });
        const deleteData = await deleteResponse.json();
        if (!deleteData.success) {
          console.warn(`Failed to delete ${attachment.file.name} from storage:`, deleteData.error);
        }
      } catch (deleteError) {
        console.error(`Error deleting ${attachment.file.name} from storage:`, deleteError);
      }
    }
    
    setEditNewAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      if (newAttachments.length === 0) {
        setShowEditAttachments(false);
      }
      return newAttachments;
    });
  };

  const existingMediaFiles = editAttachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
  const existingNonMediaFiles = editAttachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
  const newMediaFiles = editNewAttachments.filter(att => isImageFile(att.file.name) || isVideoFile(att.file.name));
  const newNonMediaFiles = editNewAttachments.filter(att => !isImageFile(att.file.name) && !isVideoFile(att.file.name));

  return (
    <div className="space-y-3 ml-12">
      <div className="relative">
        <RichTextEditor
          value={editMessage}
          onChange={setEditMessage}
          placeholder="Edit your comment..."
          disabled={isUpdating}
        />
        {/* Paperclip button to toggle attachments */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
          onClick={() => setShowEditAttachments(!showEditAttachments)}
          disabled={isUpdating}
          title={showEditAttachments ? "Hide attachments" : "Add attachments"}
        >
          <Paperclip className={`h-4 w-4 ${showEditAttachments ? "text-primary" : ""}`} />
        </Button>
      </div>
      
      {/* File Upload Area for Edit */}
      {(showEditAttachments || editNewAttachments.length > 0) && (
        <div
          {...getEditRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
            ${
              isEditDragActive
                ? "border-primary bg-primary/5"
                : "border-border/40 dark:border-border/60 hover:border-primary/50"
            }
            ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getEditInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isEditDragActive
                ? "Drop files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">
              Max 50MB per file
            </p>
          </div>
        </div>
      )}

      {/* Existing Attachments */}
      {editAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Existing Attachments:</p>
          {existingMediaFiles.length > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-1.5">
              {existingMediaFiles.map((attachment, index) => {
                const actualIndex = editAttachments.findIndex(att => att === attachment);
                const isImage = isImageFile(attachment.fileName);
                const isVideo = isVideoFile(attachment.fileName);
                
                return (
                  <div
                    key={actualIndex}
                    className="relative group rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 overflow-hidden aspect-square"
                  >
                    {isImage ? (
                      <Image
                        src={attachment.link}
                        alt={attachment.fileName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        <video
                          src={attachment.link}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditAttachment(actualIndex);
                      }}
                      className="absolute top-1 right-1 h-6 w-6 bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {existingNonMediaFiles.length > 0 && (
            <div className="space-y-1.5">
              {existingNonMediaFiles.map((attachment, index) => {
                const actualIndex = editAttachments.findIndex(att => att === attachment);
                return (
                  <div
                    key={actualIndex}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                  >
                    <File className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate flex-1 font-medium">
                      {attachment.fileName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEditAttachment(actualIndex)}
                      className="h-7 px-2 rounded-md shrink-0"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Attachments Preview */}
      {editNewAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">New Attachments:</p>
          {newMediaFiles.length > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-1.5">
              {newMediaFiles.map((attachment, index) => {
                const actualIndex = editNewAttachments.findIndex(att => att === attachment);
                const isImage = isImageFile(attachment.file.name);
                const isVideo = isVideoFile(attachment.file.name);
                const previewUrl = attachment.url
                  ? attachment.url
                  : URL.createObjectURL(attachment.file);

                return (
                  <div
                    key={actualIndex}
                    className="relative group rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 overflow-hidden aspect-square"
                  >
                    {attachment.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : attachment.error ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                        <p className="text-xs text-destructive text-center px-2">
                          {attachment.error}
                        </p>
                      </div>
                    ) : isImage ? (
                      <Image
                        src={previewUrl}
                        alt={attachment.file.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <>
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditNewAttachment(actualIndex);
                      }}
                      disabled={attachment.uploading}
                      className="absolute top-1 right-1 h-6 w-6 bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {newNonMediaFiles.length > 0 && (
            <div className="space-y-1.5">
              {newNonMediaFiles.map((attachment, index) => {
                const actualIndex = editNewAttachments.findIndex(att => att === attachment);
                return (
                  <div
                    key={actualIndex}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                  >
                    <File className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate flex-1 font-medium">
                      {attachment.file.name}
                    </span>
                    {attachment.uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEditNewAttachment(actualIndex)}
                        disabled={attachment.uploading}
                        className="h-7 w-7 shrink-0"
                        type="button"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isUpdating || (!editMessage.replace(/<[^>]*>/g, "").trim() && editAttachments.length === 0 && editNewAttachments.length === 0)}
        >
          {isUpdating ? "Saving" : "Save"}
        </Button>
      </div>
    </div>
  );
}

