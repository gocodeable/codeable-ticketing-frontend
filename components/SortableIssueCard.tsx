"use client";

import { Issue } from "@/types/issue";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import IssueCard from "./IssueCard";

interface SortableIssueCardProps {
  issue: Issue;
  getPriorityColor: (priority: string) => string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function SortableIssueCard({
  issue,
  getPriorityColor,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 9999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 opacity-70 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1.5 hover:bg-muted rounded-md"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
      )}
      <IssueCard issue={issue} getPriorityColor={getPriorityColor} onClick={onClick} />
    </div>
  );
}

