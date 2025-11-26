import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";

export default function SortableStatusColumn({
  status,
  statusIssues,
  isAdmin,
  getTypeIcon,
  getPriorityColor,
}: {
  status: WorkflowStatus;
  statusIssues: Issue[];
  isAdmin: boolean;
  getTypeIcon: (type: string) => string;
  getPriorityColor: (priority: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status._id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 bg-card rounded-lg border shadow-sm"
    >
      {/* Status Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1">
            {isAdmin && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <h3 className="font-semibold text-foreground">{status.name}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {statusIssues.length}
          </span>
        </div>
        {status.description && (
          <p className="text-xs text-muted-foreground ml-6">
            {status.description}
          </p>
        )}
      </div>

      {/* Issues List */}
      <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
        {statusIssues.map((issue) => (
          <div
            key={issue._id}
            className="p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">{getTypeIcon(issue.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {issue.title}
                </h4>
              </div>
            </div>

            {issue.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {issue.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(
                  issue.priority
                )}`}
              >
                {issue.priority || "medium"}
              </span>
              {issue.estimate && (
                <span className="text-xs text-muted-foreground">
                  {issue.estimate} pts
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Add Issue Button */}
        <button className="w-full p-3 border border-dashed rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <Plus className="w-4 h-4" />
          Add Issue
        </button>
      </div>
    </div>
  );
}
