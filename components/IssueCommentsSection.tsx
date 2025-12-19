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
import { apiPost, apiDelete } from "@/lib/api/apiClient";
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
  onCommentAdded?: (newComment: Comment | null) => void;
}

// Types for comment variants
type CommentVariant = "main" | "reply" | "nested";

interface CommentAuthorProps {
  author: Comment["author"];
  authorId: Comment["authorId"];
  createdAt?: string;
  avatarSize?: number;
  nameSize?: "sm" | "xs";
  dateSize?: "xs" | "text-[10px]";
}

function CommentAuthor({ author, authorId, createdAt, avatarSize = 36, nameSize = "sm", dateSize = "xs" }: CommentAuthorProps) {
  const resolvedAuthor = author || (typeof authorId === "object" ? authorId : null);
  
  const avatarClass = avatarSize === 36 ? "h-9 w-9" : avatarSize === 32 ? "h-8 w-8" : "h-6 w-6";
  const nameClass = nameSize === "sm" ? "text-sm" : "text-xs";
  const dateClass = dateSize === "xs" ? "text-xs" : "text-[10px]";
  
  if (!resolvedAuthor) {
    return (
      <div className="flex-1">
        <p className={`${nameClass} text-muted-foreground`}>Unknown Author</p>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${avatarClass} rounded-full overflow-hidden ring-2 ring-background shrink-0`}>
        <Image
          src={resolvedAuthor.avatar || DEFAULT_AVATAR}
          alt={resolvedAuthor.name || "User"}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${nameClass} font-semibold`}>
          {resolvedAuthor.name || "Unknown User"}
        </p>
        {createdAt && (
          <p className={`${dateClass} text-muted-foreground`}>
            {format(new Date(createdAt), "PPP 'at' p")}
          </p>
        )}
      </div>
    </>
  );
}

interface CommentActionsProps {
  isOwner: boolean;
  commentId: string;
  editingCommentId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  buttonSize?: "icon" | "sm";
  iconSize?: string;
}

function CommentActions({ isOwner, commentId, editingCommentId, onEdit, onDelete, buttonSize = "icon", iconSize = "h-4 w-4" }: CommentActionsProps) {
  if (!isOwner) return null;

  const buttonClass = buttonSize === "icon" ? "h-8 w-8" : "h-7 w-7";
  
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className={`${buttonClass} text-muted-foreground hover:text-foreground`}
        onClick={onEdit}
        title="Edit comment"
        disabled={editingCommentId === commentId}
      >
        <Edit2 className={iconSize} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className={`${buttonClass} text-muted-foreground hover:text-destructive`}
        onClick={onDelete}
        title="Delete comment"
        disabled={editingCommentId === commentId}
      >
        <Trash2 className={iconSize} />
      </Button>
    </div>
  );
}

interface CommentAttachmentsProps {
  attachments: Comment["attachments"];
  commentId: string;
  downloadingAttachments: Set<string>;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
  onMediaClick: (attachment: { link: string; fileName: string }) => void;
  variant?: CommentVariant;
  marginLeft?: string;
}

function CommentAttachments({
  attachments,
  commentId,
  downloadingAttachments,
  onDownload,
  onMediaClick,
  variant = "main",
  marginLeft = "ml-12"
}: CommentAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const mediaFiles = attachments.filter(att => isImageFile(att.fileName) || isVideoFile(att.fileName));
  const nonMediaFiles = attachments.filter(att => !isImageFile(att.fileName) && !isVideoFile(att.fileName));
  
  const isNested = variant === "nested";
  const gridCols = isNested ? "grid-cols-5 sm:grid-cols-6 md:grid-cols-7" : "grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9";
  const attachmentSpacing = isNested ? "space-y-1.5" : "space-y-2";
  const attachmentMarginTop = isNested ? "mt-2" : "mt-3";

  return (
    <div className={`${attachmentMarginTop} ${marginLeft} ${attachmentSpacing}`}>
      {mediaFiles.length > 0 && (
        <div className={`grid ${gridCols} gap-1.5`}>
          {mediaFiles.map((attachment, index) => {
            const attachmentId = `${commentId}-media-${index}`;
            const isDownloading = downloadingAttachments.has(attachmentId);
            const isImage = isImageFile(attachment.fileName);
            const isVideo = isVideoFile(attachment.fileName);

            return (
              <div
                key={index}
                className={`relative group rounded-lg border ${isNested ? "border-border/30 bg-muted/20" : "border-border/40 dark:border-border/60 bg-muted/30"} overflow-hidden cursor-pointer hover:border-primary/50 transition-all aspect-square`}
                onClick={() => onMediaClick(attachment)}
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
                      <Play className={`${isNested ? "w-4 h-4" : "w-5 h-5"} text-white`} />
                    </div>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-1 right-1 ${isNested ? "h-5 w-5" : "h-6 w-6"} bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(attachment, attachmentId);
                  }}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className={`${isNested ? "w-3 h-3" : "w-3 h-3"} animate-spin`} />
                  ) : (
                    <Download className={`${isNested ? "w-3 h-3" : "w-3 h-3"}`} />
                  )}
                </Button>
                {!isNested && (
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-[10px] text-white truncate font-medium leading-tight">
                      {attachment.fileName}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {nonMediaFiles.length > 0 && (
        <div className={`space-y-${isNested ? "1" : "1.5"}`}>
          {nonMediaFiles.map((attachment, index) => {
            const attachmentId = `${commentId}-file-${index}`;
            const isDownloading = downloadingAttachments.has(attachmentId);
            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded-lg border ${isNested ? "border-border/30 bg-background/50" : "border-border/40 dark:border-border/60 bg-background"}`}
              >
                <File className={`${isNested ? "h-3 w-3" : "h-3.5 w-3.5"} text-muted-foreground shrink-0`} />
                <span className={`${isNested ? "text-[10px]" : "text-xs"} truncate flex-1 font-medium`}>
                  {attachment.fileName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(attachment, attachmentId)}
                  disabled={isDownloading}
                  className={`${isNested ? "h-6 px-2" : "h-7 px-2"} rounded-md shrink-0`}
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
  );
}

interface ReplyFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  marginLeft?: string;
  attachments?: Array<{
    file: File;
    url?: string;
    uploading: boolean;
    error?: string;
  }>;
  showAttachments?: boolean;
  onToggleAttachments?: () => void;
  onRemoveAttachment?: (index: number) => void;
  getRootProps?: () => any;
  getInputProps?: () => any;
  isDragActive?: boolean;
}

function ReplyForm({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  placeholder = "Write a reply...", 
  marginLeft = "ml-12",
  attachments = [],
  showAttachments = false,
  onToggleAttachments,
  onRemoveAttachment,
  getRootProps,
  getInputProps,
  isDragActive = false
}: ReplyFormProps) {
  const marginTop = marginLeft.includes("ml-11") || marginLeft.includes("ml-10") ? "mt-2" : "mt-3";
  const hasAttachments = attachments.length > 0;
  const mediaFiles = attachments.filter(
    (att) => isImageFile(att.file.name) || isVideoFile(att.file.name)
  );
  const nonMediaFiles = attachments.filter(
    (att) => !isImageFile(att.file.name) && !isVideoFile(att.file.name)
  );
  
  return (
    <div className={`${marginLeft} ${marginTop} p-3 rounded-lg border border-border/40 dark:border-border/60 bg-background`}>
      <div className="space-y-2">
        <div className="relative">
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={isSubmitting}
          />
          {onToggleAttachments && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
              onClick={onToggleAttachments}
              disabled={isSubmitting}
              title={showAttachments ? "Hide attachments" : "Add attachments"}
            >
              <Paperclip className={`h-4 w-4 ${showAttachments ? "text-primary" : ""}`} />
            </Button>
          )}
        </div>

        {/* File Upload Area */}
        {getRootProps && getInputProps && (showAttachments || hasAttachments) && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border/40 dark:border-border/60 hover:border-primary/50"
              }
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-1.5 text-center">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {isDragActive
                  ? "Drop files here"
                  : "Drag & drop files here, or click to select"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Max 50MB per file
              </p>
            </div>
          </div>
        )}

        {/* Attachments Preview */}
        {hasAttachments && (
          <div className="space-y-1.5">
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {mediaFiles.map((attachment, index) => {
                  const actualIndex = attachments.findIndex((att) => att === attachment);
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
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : attachment.error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                          <p className="text-[10px] text-destructive text-center px-1">
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
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </>
                      )}
                      {onRemoveAttachment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAttachment(actualIndex);
                          }}
                          disabled={attachment.uploading}
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {nonMediaFiles.length > 0 && (
              <div className="space-y-1">
                {nonMediaFiles.map((attachment, index) => {
                  const actualIndex = attachments.findIndex((att) => att === attachment);
                  return (
                    <div
                      key={actualIndex}
                      className="flex items-center gap-2 p-1.5 rounded-lg border border-border/40 dark:border-border/60 bg-background"
                    >
                      <File className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate flex-1 font-medium">
                        {attachment.file.name}
                      </span>
                      {attachment.uploading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      ) : onRemoveAttachment ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveAttachment(actualIndex)}
                          disabled={attachment.uploading}
                          className="h-6 w-6 shrink-0"
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      ) : null}
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
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || (!value.replace(/<[^>]*>/g, "").trim() && !hasAttachments)}
          >
            {isSubmitting ? "Replying..." : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReplyContextBadgeProps {
  parentAuthor: Comment["author"] | null;
  variant?: CommentVariant;
}

function ReplyContextBadge({ parentAuthor, variant = "reply" }: ReplyContextBadgeProps) {
  const isNested = variant === "nested";
  const badgePadding = isNested ? "px-1.5 py-0.5" : "px-2 py-1";
  const badgeGap = isNested ? "gap-1" : "gap-1.5";
  const iconSize = isNested ? "h-2.5 w-2.5" : "h-3 w-3";
  const textSize = isNested ? "text-[10px]" : "text-xs";
  const avatarSize = isNested ? "h-4 w-4" : "h-5 w-5";
  const avatarRing = isNested ? "ring-1 ring-primary/20" : "ring-1 ring-primary/30";
  const marginBottom = isNested ? "mb-1.5" : "mb-2";
  const paddingBottom = isNested ? "pb-1.5" : "pb-2";
  const borderBottom = isNested ? "border-border/20" : "border-border/30";
  const rounded = isNested ? "rounded" : "rounded-md";
  const avatarGap = isNested ? "gap-1.5" : "gap-2";

  return (
    <div className={`${marginBottom} flex items-center gap-2 ${paddingBottom} border-b ${borderBottom}`}>
      <div className={`flex items-center ${badgeGap} ${badgePadding} ${rounded} bg-primary/10`}>
        <Reply className={`${iconSize} text-primary`} />
        <span className={`${textSize} font-medium text-primary`}>
          Reply to
        </span>
      </div>
      <div className={`flex items-center ${avatarGap}`}>
        <div className={`relative ${avatarSize} rounded-full overflow-hidden ${avatarRing}`}>
          <Image
            src={parentAuthor?.avatar || DEFAULT_AVATAR}
            alt={parentAuthor?.name || "User"}
            width={isNested ? 16 : 20}
            height={isNested ? 16 : 20}
            className="rounded-full object-cover"
          />
        </div>
        <span className={`${textSize} font-semibold text-foreground`}>
          {parentAuthor?.name || "Unknown User"}
        </span>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  variant: CommentVariant;
  parentAuthor?: Comment["author"] | null;
  user: any;
  editingCommentId: string | null;
  replyingToId: string | null;
  downloadingAttachments: Set<string>;
  replyMessage: string;
  isSubmittingReply: boolean;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string) => void;
  onDownload: (attachment: { link: string; fileName: string }, attachmentId: string) => void;
  onMediaClick: (attachment: { link: string; fileName: string }) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  nestedReplyCount?: number;
}

function CommentItem({
  comment,
  variant,
  parentAuthor,
  user,
  editingCommentId,
  replyingToId,
  downloadingAttachments,
  replyMessage,
  isSubmittingReply,
  onEdit,
  onDelete,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDownload,
  onMediaClick,
  onEditSave,
  onEditCancel,
  nestedReplyCount = 0
}: CommentItemProps) {
  const author = comment.author || (typeof comment.authorId === "object" ? comment.authorId : null);
  const isOwner = user && author && 'uid' in author && author.uid === user.uid;
  const isMain = variant === "main";
  const isNested = variant === "nested";
  
  // Styling based on variant
  const containerClass = isMain 
    ? "p-4 rounded-lg border-2 border-border/50 dark:border-border/70 bg-card shadow-sm"
    : isNested
    ? "p-3 rounded-lg border border-primary/10 dark:border-primary/20 bg-primary/3 dark:bg-primary/3"
    : "p-3 rounded-lg border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/5 hover:border-primary/40 transition-colors";
  
  const contentMargin = isMain ? "ml-12" : isNested ? "ml-10" : "ml-11";
  const avatarSize = isMain ? 36 : 32;
  const nameSize = "sm";
  const dateSize = "xs";
  const actionsIconSize = isNested ? "h-3 w-3" : "h-3.5 w-3.5";
  const contentTextSize = "text-sm";

  return (
    <div className={containerClass}>
      {/* Reply Context Badge */}
      {!isMain && parentAuthor && (
        <ReplyContextBadge parentAuthor={parentAuthor} variant={variant} />
      )}

      {/* Author Info */}
      <div className={`flex items-start ${isMain ? "gap-3 mb-3" : "gap-2 mb-2"}`}>
        <CommentAuthor
          author={comment.author}
          authorId={comment.authorId}
          createdAt={comment.createdAt}
          avatarSize={avatarSize}
          nameSize={nameSize}
          dateSize={dateSize}
        />
        <CommentActions
          isOwner={isOwner}
          commentId={comment._id}
          editingCommentId={editingCommentId}
          onEdit={() => onEdit(comment)}
          onDelete={() => onDelete(comment._id)}
          iconSize={actionsIconSize}
        />
      </div>

      {/* Comment Content */}
      {editingCommentId === comment._id ? (
        <EditCommentForm
          comment={comment}
          onSave={onEditSave}
          onCancel={onEditCancel}
        />
      ) : (
        <>
          <div
            className={`${contentTextSize} text-foreground leading-relaxed ${contentMargin} rich-text-content`}
            dangerouslySetInnerHTML={{ __html: comment.message }}
          />
          
          <CommentAttachments
            attachments={comment.attachments}
            commentId={comment._id}
            downloadingAttachments={downloadingAttachments}
            onDownload={onDownload}
            onMediaClick={onMediaClick}
            variant={variant}
            marginLeft={contentMargin}
          />

          {/* Reply Button */}
          {!editingCommentId && (
            <div className={`${contentMargin} mt-2 flex items-center gap-3`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment._id)}
                disabled={replyingToId === comment._id}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {nestedReplyCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {nestedReplyCount} {nestedReplyCount === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
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
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [replyToReplyMessage, setReplyToReplyMessage] = useState("");
  const [replyToReplyAttachments, setReplyToReplyAttachments] = useState<
    Array<{
      file: File;
      url?: string;
      uploading: boolean;
      error?: string;
    }>
  >([]);
  const [isSubmittingReplyToReply, setIsSubmittingReplyToReply] = useState(false);
  const [showReplyToReplyAttachments, setShowReplyToReplyAttachments] = useState(false);
  const commentContentRef = useRef<HTMLDivElement>(null);

  // Helper function to get all replies for a comment
  const getRepliesForComment = (commentId: string): Comment[] => {
    if (!comments) return [];
    return comments.filter(c => c.parentCommentId === commentId);
  };

  // Helper function to get nested replies count
  const getNestedReplyCount = (commentId: string): number => {
    const directReplies = getRepliesForComment(commentId);
    let count = directReplies.length;
    directReplies.forEach(reply => {
      count += getNestedReplyCount(reply._id);
    });
    return count;
  };

  const handleMediaClick = (attachment: { link: string; fileName: string }) => {
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

  // Handle image clicks in comment content
  const handleImageClick = useCallback((imageUrl: string) => {
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

    setShowAttachments(true);
    const idToken = await user.getIdToken();
    const startIndex = commentAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setCommentAttachments((prev) => [...prev, ...newFiles]);

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
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setCommentAttachments((prev) =>
          prev.map((att, index) => {
            if (index === attachmentIndex) {
              return { ...att, uploading: false, error: errorMessage };
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
    maxSize: 50 * 1024 * 1024,
  });

  // Dropzone for reply attachments
  const onDropReply = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setShowReplyAttachments(true);
    const idToken = await user.getIdToken();
    const startIndex = replyAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setReplyAttachments((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setReplyAttachments((prev) =>
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
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setReplyAttachments((prev) =>
          prev.map((att, index) => {
            if (index === attachmentIndex) {
              return { ...att, uploading: false, error: errorMessage };
            }
            return att;
          })
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }
  };

  const { getRootProps: getReplyRootProps, getInputProps: getReplyInputProps, isDragActive: isReplyDragActive } = useDropzone({
    onDrop: onDropReply,
    disabled: isSubmittingReply,
    maxSize: 50 * 1024 * 1024,
  });

  // Dropzone for reply-to-reply attachments
  const onDropReplyToReply = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setShowReplyToReplyAttachments(true);
    const idToken = await user.getIdToken();
    const startIndex = replyToReplyAttachments.length;
    const newFiles = acceptedFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setReplyToReplyAttachments((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const attachmentIndex = startIndex + i;
      try {
        const url = await uploadMediaToStorage(file, "attachments", idToken);
        setReplyToReplyAttachments((prev) =>
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
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setReplyToReplyAttachments((prev) =>
          prev.map((att, index) => {
            if (index === attachmentIndex) {
              return { ...att, uploading: false, error: errorMessage };
            }
            return att;
          })
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }
  };

  const { getRootProps: getReplyToReplyRootProps, getInputProps: getReplyToReplyInputProps, isDragActive: isReplyToReplyDragActive } = useDropzone({
    onDrop: onDropReplyToReply,
    disabled: isSubmittingReplyToReply,
    maxSize: 50 * 1024 * 1024,
  });

  const removeCommentAttachment = async (index: number) => {
    const attachment = commentAttachments[index];
    
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
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
      if (newAttachments.length === 0) {
        setShowAttachments(false);
      }
      return newAttachments;
    });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const attachments = commentAttachments
        .filter((att) => att.url && !att.error)
        .map((att) => ({
          link: att.url!,
          fileName: att.file.name,
        }));
      
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
        if (onCommentAdded && data.data) {
          onCommentAdded(data.data);
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

  const handleReplyToReply = (replyId: string) => {
    setReplyingToReplyId(replyId);
    setReplyToReplyMessage("");
    setReplyToReplyAttachments([]);
    setShowReplyToReplyAttachments(false);
  };

  const handleCancelReplyToReply = () => {
    setReplyingToReplyId(null);
    setReplyToReplyMessage("");
    setReplyToReplyAttachments([]);
    setShowReplyToReplyAttachments(false);
  };

  const removeReplyToReplyAttachment = async (index: number) => {
    const attachment = replyToReplyAttachments[index];
    
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
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
    
    setReplyToReplyAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      if (newAttachments.length === 0) {
        setShowReplyToReplyAttachments(false);
      }
      return newAttachments;
    });
  };

  const removeReplyAttachment = async (index: number) => {
    const attachment = replyAttachments[index];
    
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
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
    
    setReplyAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      if (newAttachments.length === 0) {
        setShowReplyAttachments(false);
      }
      return newAttachments;
    });
  };

  const handleSubmitReplyToReply = async (parentReplyId: string) => {
    const textContent = replyToReplyMessage.replace(/<[^>]*>/g, "").trim();
    
    if (!textContent && replyToReplyAttachments.length === 0) {
      toast.error("Please enter a reply or attach a file");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }

    setIsSubmittingReplyToReply(true);

    try {
      const idToken = await user.getIdToken();
      const attachments = replyToReplyAttachments
        .filter((att) => att.url && !att.error)
        .map((att) => ({
          link: att.url!,
          fileName: att.file.name,
        }));

      const response = await apiPost(
        "/api/comments",
        {
          issueId,
          message: replyToReplyMessage.trim() || " ",
          attachments,
          parentCommentId: parentReplyId,
        },
        idToken
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Reply added successfully");
        setReplyingToReplyId(null);
        setReplyToReplyMessage("");
        setReplyToReplyAttachments([]);
        setShowReplyToReplyAttachments(false);
        if (onCommentAdded && data.data) {
          onCommentAdded(data.data);
        }
      } else {
        toast.error(data.error || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setIsSubmittingReplyToReply(false);
    }
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
        if (onCommentAdded && data.data) {
          onCommentAdded(data.data);
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
      const response = await apiDelete(`/api/comments/${deleteCommentId}`, idToken);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete comment");
        return;
      }

      toast.success("Comment deleted successfully");
      setDeleteCommentId(null);
      if (onCommentAdded) {
        onCommentAdded(null);
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
      onCommentAdded(null);
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

  // Render nested replies recursively
  const renderNestedReplies = (parentReply: Comment, parentAuthor: Comment["author"] | null) => {
    const nestedReplies = getRepliesForComment(parentReply._id);
    if (nestedReplies.length === 0) return null;

    return (
      <div className="relative ml-11 mt-2">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20" />
        <div className="pl-6 space-y-2">
          {nestedReplies.map((nestedReply) => {
            const nestedReplyAuthor = nestedReply.author || (typeof nestedReply.authorId === "object" ? nestedReply.authorId : null);
            const isReplyingToNested = replyingToReplyId === nestedReply._id;
            // Calculate nested reply count for this nested reply
            const nestedReplyCountForNested = getRepliesForComment(nestedReply._id).length;
            
            return (
              <div key={nestedReply._id} className="relative">
                <div className="absolute -left-6 top-5 w-6 h-0.5 bg-primary/20" />
                <CommentItem
                  comment={nestedReply}
                  variant="nested"
                  parentAuthor={parentReply.author || (typeof parentReply.authorId === "object" ? parentReply.authorId : null) || null}
                  user={user}
                  editingCommentId={editingCommentId}
                  replyingToId={replyingToReplyId}
                  downloadingAttachments={downloadingAttachments}
                  replyMessage={replyToReplyMessage}
                  isSubmittingReply={isSubmittingReplyToReply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onReply={handleReplyToReply}
                  onCancelReply={handleCancelReplyToReply}
                  onSubmitReply={handleSubmitReplyToReply}
                  onDownload={onDownload}
                  onMediaClick={handleMediaClick}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  nestedReplyCount={nestedReplyCountForNested}
                />
                                {isReplyingToNested && (
                                  <ReplyForm
                                    value={replyToReplyMessage}
                                    onChange={setReplyToReplyMessage}
                                    onSubmit={() => handleSubmitReplyToReply(nestedReply._id)}
                                    onCancel={handleCancelReplyToReply}
                                    isSubmitting={isSubmittingReplyToReply}
                                    marginLeft="ml-10"
                                    attachments={replyToReplyAttachments}
                                    showAttachments={showReplyToReplyAttachments}
                                    onToggleAttachments={() => setShowReplyToReplyAttachments(!showReplyToReplyAttachments)}
                                    onRemoveAttachment={removeReplyToReplyAttachment}
                                    getRootProps={getReplyToReplyRootProps}
                                    getInputProps={getReplyToReplyInputProps}
                                    isDragActive={isReplyToReplyDragActive}
                                  />
                                )}
                {renderNestedReplies(nestedReply, nestedReplyAuthor)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                const replyCount = getRepliesForComment(comment._id).length;
                const parentAuthor = comment.author || (typeof comment.authorId === "object" ? comment.authorId : null);
                
                return (
                <div key={comment._id} className="space-y-0">
                    <CommentItem
                      comment={comment}
                      variant="main"
                      user={user}
                      editingCommentId={editingCommentId}
                      replyingToId={replyingToCommentId}
                      downloadingAttachments={downloadingAttachments}
                      replyMessage={replyMessage}
                      isSubmittingReply={isSubmittingReply}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onReply={handleReplyToComment}
                      onCancelReply={handleCancelReply}
                      onSubmitReply={handleSubmitReply}
                      onDownload={onDownload}
                      onMediaClick={handleMediaClick}
                      onEditSave={handleEditSave}
                      onEditCancel={handleEditCancel}
                      nestedReplyCount={replyCount}
                    />

                    {replyingToCommentId === comment._id && (
                      <ReplyForm
                        value={replyMessage}
                        onChange={setReplyMessage}
                        onSubmit={() => handleSubmitReply(comment._id)}
                        onCancel={handleCancelReply}
                        isSubmitting={isSubmittingReply}
                        attachments={replyAttachments}
                        showAttachments={showReplyAttachments}
                        onToggleAttachments={() => setShowReplyAttachments(!showReplyAttachments)}
                        onRemoveAttachment={removeReplyAttachment}
                        getRootProps={getReplyRootProps}
                        getInputProps={getReplyInputProps}
                        isDragActive={isReplyDragActive}
                      />
                    )}

                  {replyCount > 0 && (
                    <div className="relative">
                      <div className="absolute left-[42px] top-0 bottom-0 w-0.5 bg-linear-to-b from-primary/40 via-primary/20 to-transparent" />
                      <div className="ml-12 mt-0 pt-3 space-y-3 pl-6 relative">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>

                          {getRepliesForComment(comment._id).map((reply) => {
                            const nestedReplyCount = getRepliesForComment(reply._id).length;
                            const replyAuthor = reply.author || (typeof reply.authorId === "object" ? reply.authorId : null);
                            const isReplyingToReply = replyingToReplyId === reply._id;
                            
                          return (
                          <div key={reply._id} className="relative">
                            <div className="absolute -left-6 top-5 w-6 h-0.5 bg-primary/30" />
                                <CommentItem
                              comment={reply}
                                  variant="reply"
                                  parentAuthor={parentAuthor}
                                  user={user}
                                  editingCommentId={editingCommentId}
                                  replyingToId={replyingToReplyId}
                                  downloadingAttachments={downloadingAttachments}
                                  replyMessage={replyToReplyMessage}
                                  isSubmittingReply={isSubmittingReplyToReply}
                                  onEdit={handleEditComment}
                                  onDelete={handleDeleteComment}
                                  onReply={handleReplyToReply}
                                  onCancelReply={handleCancelReplyToReply}
                                  onSubmitReply={handleSubmitReplyToReply}
                                  onDownload={onDownload}
                                  onMediaClick={handleMediaClick}
                                  onEditSave={handleEditSave}
                                  onEditCancel={handleEditCancel}
                                  nestedReplyCount={nestedReplyCount}
                                />
                                {isReplyingToReply && (
                                  <ReplyForm
                                    value={replyToReplyMessage}
                                    onChange={setReplyToReplyMessage}
                                    onSubmit={() => handleSubmitReplyToReply(reply._id)}
                                    onCancel={handleCancelReplyToReply}
                                    isSubmitting={isSubmittingReplyToReply}
                                    marginLeft="ml-11"
                                    attachments={replyToReplyAttachments}
                                    showAttachments={showReplyToReplyAttachments}
                                    onToggleAttachments={() => setShowReplyToReplyAttachments(!showReplyToReplyAttachments)}
                                    onRemoveAttachment={removeReplyToReplyAttachment}
                                    getRootProps={getReplyToReplyRootProps}
                                    getInputProps={getReplyToReplyInputProps}
                                    isDragActive={isReplyToReplyDragActive}
                                  />
                                )}
                                {renderNestedReplies(reply, replyAuthor)}
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
                <>Deleting...</>
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

      {/* Rich Text Content Styles */}
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
    </>
  );
}
