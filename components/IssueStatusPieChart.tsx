"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { Loader2 } from "lucide-react";
import { getStatusName, getStatusId } from "@/utils/issueUtils";
import { useTheme } from "next-themes";

interface IssueStatusPieChartProps {
  issues: Issue[];
  statuses: WorkflowStatus[];
  loading?: boolean;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// Colors that work well in both light and dark themes
const COLORS = [
  "#3b82f6", // Blue - good contrast in both themes
  "#10b981", // Green - vibrant and visible
  "#f59e0b", // Amber - warm and visible
  "#ef4444", // Red - strong contrast
  "#8b5cf6", // Purple - vibrant
  "#06b6d4", // Cyan - bright
  "#f97316", // Orange - warm
  "#ec4899", // Pink - vibrant
  "#6366f1", // Indigo - medium tone
];

// Convert status color names to hex colors that work in both themes
const getStatusColorHex = (colorName: string | undefined, theme: string | undefined): string => {
  if (!colorName) return COLORS[0];
  
  const colorMap: Record<string, { light: string; dark: string }> = {
    blue: { light: "#2563eb", dark: "#3b82f6" },
    purple: { light: "#7c3aed", dark: "#8b5cf6" },
    yellow: { light: "#ca8a04", dark: "#eab308" }, // Darker yellow for light mode, brighter for dark
    orange: { light: "#ea580c", dark: "#f97316" },
    red: { light: "#dc2626", dark: "#ef4444" },
    green: { light: "#16a34a", dark: "#10b981" },
    gray: { light: "#6b7280", dark: "#9ca3af" },
  };

  const normalizedColor = colorName.toLowerCase();
  const colorSet = colorMap[normalizedColor];
  
  if (colorSet) {
    return theme === "dark" ? colorSet.dark : colorSet.light;
  }
  
  // If it's already a hex color, return it
  if (colorName.startsWith("#")) {
    return colorName;
  }
  
  // Fallback to COLORS array
  return COLORS[0];
};

export function IssueStatusPieChart({ issues, statuses, loading = false }: IssueStatusPieChartProps) {
  const { theme } = useTheme();
  const chartData = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    // Group issues by workflow status
    const statusCounts = new Map<string, number>();
    
    issues.forEach((issue) => {
      const statusId = getStatusId(issue);
      if (statusId) {
        const count = statusCounts.get(statusId) || 0;
        statusCounts.set(statusId, count + 1);
      }
    });

    // Create chart data
    const chartDataArray: ChartData[] = [];
    const statusesMap = new Map(statuses.map((s) => [s._id, s]));
    
    statusCounts.forEach((count, statusId) => {
      const status = statusesMap.get(statusId);
      let statusName = "Unknown";
      if (status) {
        statusName = status.name;
      } else {
        // Try to find status name from an issue with this status
        const issueWithStatus = issues.find((issue) => {
          const id = getStatusId(issue);
          return id === statusId;
        });
        if (issueWithStatus) {
          statusName = getStatusName(issueWithStatus, statuses);
        }
      }
      const color = status?.color 
        ? getStatusColorHex(status.color, theme) 
        : COLORS[chartDataArray.length % COLORS.length];
      
      chartDataArray.push({
        name: statusName,
        value: count,
        color: color,
      });
    });

    // Sort by value descending
    chartDataArray.sort((a, b) => b.value - a.value);
    
    return chartDataArray;
  }, [issues, statuses, theme]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Issues: <span className="font-semibold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No issues created yet
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ""}
            outerRadius={95}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

