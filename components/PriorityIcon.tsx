import { ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown } from "lucide-react";
import { getPriorityIconName } from "@/utils/issueUtils";
import { cn } from "@/lib/utils";

interface PriorityIconProps {
  priority: string;
  className?: string;
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  const iconName = getPriorityIconName(priority);
  
  const iconProps = {
    className: cn("w-4 h-4", className),
  };

  switch (iconName) {
    case "ChevronsUp":
      return <ChevronsUp {...iconProps} />;
    case "ChevronUp":
      return <ChevronUp {...iconProps} />;
    case "Equal":
      return <Equal {...iconProps} />;
    case "ChevronDown":
      return <ChevronDown {...iconProps} />;
    case "ChevronsDown":
      return <ChevronsDown {...iconProps} />;
    default:
      return <Equal {...iconProps} />;
  }
}

