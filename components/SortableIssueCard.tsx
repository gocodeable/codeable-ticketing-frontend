"use client";

import { Issue } from "@/types/issue";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import IssueCard from "./IssueCard";
import { useRef, useEffect } from "react";

interface SortableIssueCardProps {
  issue: Issue;
  disabled?: boolean;
  onClick?: () => void;
}

export default function SortableIssueCard({
  issue,
  disabled = false,
  onClick,
}: SortableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue._id, disabled });

  const wasDraggingRef = useRef(false);
  const dragEndTimeRef = useRef<number | null>(null);

  // Track drag state changes
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
      dragEndTimeRef.current = null;
    } else if (wasDraggingRef.current) {
      // Just finished dragging - record time
      dragEndTimeRef.current = Date.now();
      // Reset after delay (increased to 400ms to prevent accidental clicks)
      const timer = setTimeout(() => {
        wasDraggingRef.current = false;
        dragEndTimeRef.current = null;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 9999 : 1,
  };

  // DRAG HANDLE: Only prevent clicks, allow drag events to work
  const handleDragHandleClick = (e: React.MouseEvent) => {
    // Only stop click events, not drag events (mousedown/pointerdown)
    e.preventDefault();
    e.stopPropagation();
  };

  // CARD CLICK: Only handles opening dialog, completely separate from drag
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open if:
    // 1. Currently dragging
    // 2. Just finished dragging (within 400ms)
    // 3. Click came from drag handle area
    const target = e.target as HTMLElement;
    const clickedDragHandle = target.closest("[data-drag-handle]");
    const justFinishedDragging = dragEndTimeRef.current
      ? Date.now() - dragEndTimeRef.current < 400
      : false;

    if (
      isDragging ||
      wasDraggingRef.current ||
      justFinishedDragging ||
      clickedDragHandle
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    onClick?.();
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          onClick={handleDragHandleClick}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 opacity-70 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1.5 hover:bg-muted rounded-md"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
      )}

      <div
        onClick={handleCardClick}
        style={{ pointerEvents: isDragging ? "none" : "auto" }}
      >
        <IssueCard issue={issue} />
      </div>
    </div>
  );
}
