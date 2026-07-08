import { Zap, BookOpen, CheckSquare, Bug, CornerDownRight } from "lucide-react";
import { getTypeIconName, getTypeIconColor } from "@/utils/issueUtils";
import { cn } from "@/lib/utils";

interface IssueTypeIconProps {
  type?: string;
  className?: string;
  /** Apply the type's own color to the icon (default true). */
  withColor?: boolean;
}

export function IssueTypeIcon({ type, className, withColor = true }: IssueTypeIconProps) {
  const iconName = getTypeIconName(type);

  const iconProps = {
    className: cn("w-4 h-4", withColor && getTypeIconColor(type), className),
  };

  switch (iconName) {
    case "Zap":
      return <Zap {...iconProps} />;
    case "BookOpen":
      return <BookOpen {...iconProps} />;
    case "Bug":
      return <Bug {...iconProps} />;
    case "CornerDownRight":
      return <CornerDownRight {...iconProps} />;
    case "CheckSquare":
    default:
      return <CheckSquare {...iconProps} />;
  }
}
