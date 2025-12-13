"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Comment } from "@/types/comment";
import { MessageCircle, File, Download, Loader2, Play, Upload, Trash2, X, Paperclip, Edit2, Reply } from "lucide-react";
import Image from "next/image";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { format } from "date-fns";
import { isImageFile, isVideoFile } from "@/utils/mediaUtils";
import { MediaViewerDialog } from "./MediaViewerDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useDropzone } from "react-dropzone";
import { uploadMediaToStorage } from "@/lib/firebase/uploadMedia";
import { apiPost } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditCommentForm } from "./EditCommentForm";

interface IssueCommentsSectionProps {
  issueId: string;
  comments?: Comment[];
  commentCount?: number;
  downloadingAttachments: Set<string>;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
  onCommentAdded?: () => void;
}

export function IssueCommentsSection({
  issueId,
  comments,
  commentCount,
  downloadingAttachments,
  onDownload,
  onCommentAdded,
}: IssueCommentsSectionProps) {
  const { user } = useAuth();
  const [commentMessage, setCommentMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      error?: string;
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    fileName: string;
    isImage: boolean;
    isVideo: boolean;
  } | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      error?: string;
    }>
  >([]);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplyAttachments, setShowReplyAttachments] = useState(false);
  const commentContentRef = useRef<HTMLDivElement>(null);

  const handleMediaClick = (attachment: { link: string; fileName: string }) => {
    const isImage = isImageFile(attachment.fileName);
    const isVideo = isVideoFile(attachment.fileName);
    
    if (isImage || isVideo) {
      // Open dialog immediately with the thumbnail URL
      // MediaViewerDialog will handle loading the full media
      setViewingMedia({
        url: attachment.link,
        fileName: attachment.fileName,
        isImage,
        isVideo,
      });
    }
  };

  // Handle image clicks in comment content
  const handleImageClick = useCallback((imageUrl: string) => {
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

  // Add click handlers to images in comment content
  useEffect(() => {
    const handleImageClickEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.rich-text-content')) {
        e.preventDefault();
        e.stopPropagation();
        const imgSrc = (target as HTMLImageElement).src;
        if (imgSrc) {
          handleImageClick(imgSrc);
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleImageClickEvent);

    return () => {
      document.removeEventListener('click', handleImageClickEvent);
    };
  }, [handleImageClick]);

  // Handle file drop/selection for comment attachments
  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    // Show attachment field when files are dropped
    setShowAttachments(true);

    const idToken = await user.getIdToken();

    // Add files to commentAttachments with uploading state
    const startIndex = commentAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setCommentAttachments((prev) => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setCommentAttachments((prev) =>
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
        setCommentAttachments((prev) =>
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

  const removeCommentAttachment = async (index: number) => {
    const attachment = commentAttachments[index];
    
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
    
    setCommentAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      // Hide attachment field if no attachments remain
      if (newAttachments.length === 0) {
        setShowAttachments(false);
      }
      return newAttachments;
    });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strip HTML tags to check if message is empty
    const textContent = commentMessage.replace(/<[^>]*>/g, "").trim();
    
    if (!textContent && commentAttachments.length === 0) {
      toast.error("Please enter a comment or attach a file");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      const idToken = await user.getIdToken();

      // Prepare attachments (only successfully uploaded ones)
      const attachments = commentAttachments
        .filter((att) => att.url && !att.error)
        .map((att) => ({
          link: att.url!,
          fileName: att.file.name,
        }));

      // Strip HTML tags to check if message is empty (for validation)
      const textContent = commentMessage.replace(/<[^>]*>/g, "").trim();
      
      const response = await apiPost(
        "/api/comments",
        {
          issueId,
          message: commentMessage.trim() || " ",
          attachments,
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Comment added successfully");
        setCommentMessage("");
        setCommentAttachments([]);
        setShowAttachments(false);
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        toast.error(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = (commentId: string) => {
    setReplyingToCommentId(commentId);
    setReplyMessage("");
    setReplyAttachments([]);
    setShowReplyAttachments(false);
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyMessage("");
    setReplyAttachments([]);
    setShowReplyAttachments(false);
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    const textContent = replyMessage.replace(/<[^>]*>/g, "").trim();
    
    if (!textContent && replyAttachments.length === 0) {
      toast.error("Please enter a reply or attach a file");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }

    setIsSubmittingReply(true);

    try {
      const idToken = await user.getIdToken();

      const attachments = replyAttachments
        .filter((att) => att.url && !att.error)
        .map((att) => ({
          link: att.url!,
          fileName: att.file.name,
        }));

      const response = await apiPost(
        "/api/comments",
        {
          issueId,
          message: replyMessage.trim() || " ",
          attachments,
          parentCommentId,
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Reply added successfully");
        setReplyingToCommentId(null);
        setReplyMessage("");
        setReplyAttachments([]);
        setShowReplyAttachments(false);
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        toast.error(data.error || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete comments");
      return;
    }
    setDeleteCommentId(commentId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCommentId || !user) {
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/comments/${deleteCommentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete comment");
        return;
      }

      toast.success("Comment deleted successfully");
      setDeleteCommentId(null);
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteCommentId(null);
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
  };

  const handleEditSave = () => {
    setEditingCommentId(null);
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
  };

  const mediaFiles = commentAttachments.filter(
    (att) => isImageFile(att.file.name) || isVideoFile(att.file.name)
  );
  const nonMediaFiles = commentAttachments.filter(
    (att) => !isImageFile(att.file.name) && !isVideoFile(att.file.name)
  );

  return (
    <>
      <div className="w-full">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments?.length || commentCount || 0})
          </Label>

          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <RichTextEditor
                  value={commentMessage}
                  onChange={setCommentMessage}
                  placeholder="Add a comment..."
                  disabled={isSubmitting}
                />
                {/* Paperclip button to toggle attachments */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                  onClick={() => setShowAttachments(!showAttachments)}
                  disabled={isSubmitting}
                  title={showAttachments ? "Hide attachments" : "Add attachments"}
                >
                  <Paperclip className={`h-4 w-4 ${showAttachments ? "text-primary" : ""}`} />
                </Button>
              </div>
              
              {/* File Upload Area - Only show when showAttachments is true or when there are attachments */}
              {(showAttachments || commentAttachments.length > 0) && (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
                    ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border/40 dark:border-border/60 hover:border-primary/50"
                    }
                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive
                        ? "Drop files here"
                        : "Drag & drop files here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 50MB per file
                    </p>
                  </div>
                </div>
              )}

              {/* Comment Attachments Preview */}
              {commentAttachments.length > 0 && (
                <div className="space-y-2">
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-1.5">
                      {mediaFiles.map((attachment, index) => {
                        const actualIndex = commentAttachments.findIndex(
                          (att) => att === attachment
                        );
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
                                  playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-5 h-5 text-white" />
                                </div>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCommentAttachment(actualIndex);
                              }}
                              disabled={attachment.uploading}
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-1.5">
                              <p className="text-[10px] text-white truncate font-medium leading-tight">
                                {attachment.file.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {nonMediaFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {nonMediaFiles.map((attachment, index) => {
                        const actualIndex = commentAttachments.findIndex(
                          (att) => att === attachment
                        );
                        return (
                          <div
                            key={actualIndex}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                          >
                            <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate flex-1 font-medium">
                              {attachment.file.name}
                            </span>
                            {attachment.uploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCommentAttachment(actualIndex)}
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || (!commentMessage.replace(/<[^>]*>/g, "").trim() && commentAttachments.length === 0)}
                  size="sm"
                >
                  {isSubmitting ? "Adding" : "Add Comment"}
                </Button>
              </div>
            </div>
          </form>
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.filter(c => !c.parentCommentId).map((comment) => {
                const replyCount = comments.filter(c => c.parentCommentId === comment._id).length;
                return (
                <div key={comment._id} className="space-y-0">
                  {/* Main Comment - More prominent styling */}
                  <div className="p-4 rounded-lg border-2 border-border/50 dark:border-border/70 bg-card shadow-sm">
                
                  <div className="flex items-start gap-3 mb-3">
                    {(() => {
                      const author =
                        comment.author ||
                        (typeof comment.authorId === "object"
                          ? comment.authorId
                          : null);
                      const isOwner = user && author && 'uid' in author && author.uid === user.uid;
                      return author ? (
                        <>
                          <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-background shrink-0">
                            <Image
                              src={author.avatar || DEFAULT_AVATAR}
                              alt={author.name || "User"}
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">
                              {author.name || "Unknown User"}
                            </p>
                            {comment.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "PPP 'at' p")}
                              </p>
                            )}
                          </div>
                          {isOwner && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditComment(comment)}
                                title="Edit comment"
                                disabled={editingCommentId === comment._id}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteComment(comment._id)}
                                title="Delete comment"
                                disabled={editingCommentId === comment._id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
                  {editingCommentId === comment._id ? (
                    <EditCommentForm
                      comment={comment}
                      onSave={handleEditSave}
                      onCancel={handleEditCancel}
                    />
                  ) : (
                    // Normal Comment Display
                    <>
                      <div
                        className="text-sm text-foreground leading-relaxed ml-12 rich-text-content"
                        dangerouslySetInnerHTML={{ __html: comment.message }}
                      />
                      <style jsx global>{`
                    .rich-text-content {
                      word-wrap: break-word;
                    }
                    .rich-text-content p {
                      margin: 0.5rem 0;
                    }
                    .rich-text-content p:first-child {
                      margin-top: 0;
                    }
                    .rich-text-content p:last-child {
                      margin-bottom: 0;
                    }
                    .rich-text-content img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.375rem;
                      margin: 0.5rem 0;
                      cursor: pointer;
                      transition: opacity 0.2s;
                    }
                    .rich-text-content img:hover {
                      opacity: 0.8;
                    }
                    .rich-text-content ul,
                    .rich-text-content ol {
                      margin: 0.5rem 0;
                      padding-left: 1.5rem;
                      color: hsl(var(--foreground));
                      list-style-position: outside;
                    }
                    .rich-text-content ul {
                      list-style-type: disc;
                    }
                    .rich-text-content ol {
                      list-style-type: decimal;
                    }
                    .rich-text-content ul li,
                    .rich-text-content ol li {
                      color: hsl(var(--foreground));
                      display: list-item;
                    }
                    .rich-text-content ul li::marker,
                    .rich-text-content ol li::marker {
                      color: hsl(var(--foreground));
                    }
                    .rich-text-content a {
                      color: hsl(var(--primary));
                      text-decoration: underline;
                    }
                    .rich-text-content a:hover {
                      color: hsl(var(--primary) / 0.8);
                    }
                    .rich-text-content h1,
                    .rich-text-content h2,
                    .rich-text-content h3 {
                      margin: 1rem 0 0.5rem 0;
                      font-weight: 600;
                    }
                    .rich-text-content h1 {
                      font-size: 1.5rem;
                    }
                    .rich-text-content h2 {
                      font-size: 1.25rem;
                    }
                    .rich-text-content h3 {
                      font-size: 1.125rem;
                    }
                  `}</style>
                      {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 ml-12 space-y-2">
                      {(() => {
                        const mediaFiles = comment.attachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
                        const nonMediaFiles = comment.attachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
                        
                        return (
                          <>
                            {/* Media Files Grid - Smaller thumbnails */}
                            {mediaFiles.length > 0 && (
                              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-1.5">
                                {mediaFiles.map((attachment, index) => {
                                  const attachmentId = `${comment._id}-media-${index}`;
                                  const isDownloading = downloadingAttachments.has(attachmentId);
                                  const isImage = isImageFile(attachment.fileName);
                                  const isVideo = isVideoFile(attachment.fileName);

                                  return (
                                    <div
                                      key={index}
                                      className="relative group rounded-lg border border-border/40 dark:border-border/60 bg-muted/30 overflow-hidden cursor-pointer hover:border-primary/50 transition-all aspect-square"
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
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="text-white text-[10px] font-medium bg-black/60 px-1.5 py-0.5 rounded">
                                          {isImage ? 'View' : 'Play'}
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-1.5">
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
                              <div className="space-y-1.5">
                                {nonMediaFiles.map((attachment, index) => {
                                  const attachmentId = `${comment._id}-file-${index}`;
                                  const isDownloading = downloadingAttachments.has(attachmentId);
                                  return (
                                    <div
                                      key={`non-media-${index}`}
                                      className="flex items-center gap-2 p-2 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                                    >
                                      <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="text-xs truncate flex-1 font-medium">
                                        {attachment.fileName}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDownload(attachment, attachmentId)}
                                        disabled={isDownloading}
                                        className="h-7 px-2 rounded-md shrink-0"
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
                          </>
                        );
                      })()}
                    </div>
                      )}
                      {/* Reply Button with count */}
                      {!editingCommentId && (
                        <div className="ml-12 mt-3 flex items-center gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleReplyToComment(comment._id)}
                            disabled={replyingToCommentId === comment._id}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          {replyCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  </div>

                  {/* Reply Form */}
                  {replyingToCommentId === comment._id && (
                    <div className="ml-12 mt-3 p-3 rounded-lg border border-border/40 dark:border-border/60 bg-background">
                      <div className="space-y-2">
                        <div className="relative">
                          <RichTextEditor
                            value={replyMessage}
                            onChange={setReplyMessage}
                            placeholder="Write a reply..."
                            disabled={isSubmittingReply}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelReply}
                            disabled={isSubmittingReply}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSubmitReply(comment._id)}
                            disabled={isSubmittingReply || !replyMessage.replace(/<[^>]*>/g, "").trim()}
                          >
                            {isSubmittingReply ? "Replying..." : "Reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies - Enhanced Visual Hierarchy */}
                  {replyCount > 0 && (
                    <div className="relative">
                      {/* Visual Thread Connector */}
                      <div className="absolute left-[42px] top-0 bottom-0 w-0.5 bg-linear-to-b from-primary/40 via-primary/20 to-transparent" />
                      
                      <div className="ml-12 mt-0 pt-3 space-y-3 pl-6 relative">
                        {/* Replies Header */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>

                        {comments.filter(c => c.parentCommentId === comment._id).map((reply, index) => {
                          const parentAuthor = comment.author || (typeof comment.authorId === "object" ? comment.authorId : null);
                          const isLastReply = index === replyCount - 1;
                          return (
                          <div key={reply._id} className="relative">
                            {/* Thread connector line to reply */}
                            <div className="absolute -left-6 top-5 w-6 h-0.5 bg-primary/30" />
                            
                            <div
                              className="p-3 rounded-lg border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/5 hover:border-primary/40 transition-colors"
                            >
                              {/* Reply Context Badge - More prominent */}
                              <div className="mb-2 flex items-center gap-2 pb-2 border-b border-border/30">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                                  <Reply className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-medium text-primary">
                                    Reply to
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative h-5 w-5 rounded-full overflow-hidden ring-1 ring-primary/30">
                                    <Image
                                      src={parentAuthor?.avatar || DEFAULT_AVATAR}
                                      alt={parentAuthor?.name || "User"}
                                      width={20}
                                      height={20}
                                      className="rounded-full object-cover"
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground">
                                    {parentAuthor?.name || "Unknown User"}
                                  </span>
                                </div>
                              </div>

                          <div className="flex items-start gap-3 mb-2">
                            {(() => {
                              const author =
                                reply.author ||
                                (typeof reply.authorId === "object"
                                  ? reply.authorId
                                  : null);
                              const isOwner = user && author && 'uid' in author && author.uid === user.uid;
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
                                    <p className="text-sm font-semibold">
                                      {author.name || "Unknown User"}
                                    </p>
                                    {reply.createdAt && (
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(reply.createdAt), "PPP 'at' p")}
                                      </p>
                                    )}
                                  </div>
                                  {isOwner && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleEditComment(reply)}
                                        title="Edit reply"
                                        disabled={editingCommentId === reply._id}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteComment(reply._id)}
                                        title="Delete reply"
                                        disabled={editingCommentId === reply._id}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              ) : null;
                            })()}
                          </div>
                          
                          {editingCommentId === reply._id ? (
                            <EditCommentForm
                              comment={reply}
                              onSave={handleEditSave}
                              onCancel={handleEditCancel}
                            />
                          ) : (
                            <>
                              <div
                                className="text-sm text-foreground leading-relaxed ml-11 rich-text-content"
                                dangerouslySetInnerHTML={{ __html: reply.message }}
                              />
                              {reply.attachments && reply.attachments.length > 0 && (
                                <div className="mt-2 ml-11 space-y-2">
                                  {(() => {
                                    const mediaFiles = reply.attachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
                                    const nonMediaFiles = reply.attachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
                                    
                                    return (
                                      <>
                                        {mediaFiles.length > 0 && (
                                          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
                                            {mediaFiles.map((attachment, index) => {
                                              const attachmentId = `${reply._id}-media-${index}`;
                                              const isDownloading = downloadingAttachments.has(attachmentId);
                                              const isImage = isImageFile(attachment.fileName);

                                              return (
                                                <div
                                                  key={index}
                                                  className="relative group rounded-lg border border-border/30 bg-muted/20 overflow-hidden cursor-pointer hover:border-primary/50 transition-all aspect-square"
                                                  onClick={() => handleMediaClick(attachment)}
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
                                                        playsInline
                                                      />
                                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                        <Play className="w-4 h-4 text-white" />
                                                      </div>
                                                    </>
                                                  )}
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

                                        {nonMediaFiles.length > 0 && (
                                          <div className="space-y-1">
                                            {nonMediaFiles.map((attachment, index) => {
                                              const attachmentId = `${reply._id}-file-${index}`;
                                              const isDownloading = downloadingAttachments.has(attachmentId);
                                              return (
                                                <div
                                                  key={index}
                                                  className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-background/50"
                                                >
                                                  <File className="h-3 w-3 text-muted-foreground shrink-0" />
                                                  <span className="text-xs truncate flex-1 font-medium">
                                                    {attachment.fileName}
                                                  </span>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDownload(attachment, attachmentId)}
                                                    disabled={isDownloading}
                                                    className="h-6 px-2 rounded-md shrink-0"
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
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          )}
        </div>
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

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={!!deleteCommentId} onOpenChange={(open) => {
        if (!open) {
          handleCancelDelete();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Comment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

