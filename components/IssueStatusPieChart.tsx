"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Issue } from "@/types/issue";
import { WorkflowStatus } from "@/types/workflowStatus";
import { Loader2 } from "lucide-react";
import { getStatusName, getStatusId } from "@/utils/issueUtils";

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

const COLORS = [
  "#1e3a8a", // Dark blue
  "#2563eb", // Blue
  "#3b82f6", // Lighter blue
  "#60a5fa", // Light blue
  "#93c5fd", // Very light blue
  "#bfdbfe", // Pale blue
  "#dbeafe", // Very pale blue
  "#0e0926", // Very dark blue
  "#160d3f", // Dark purple-blue
];

export function IssueStatusPieChart({ issues, statuses, loading = false }: IssueStatusPieChartProps) {
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
      const color = status?.color || COLORS[chartDataArray.length % COLORS.length];
      
      chartDataArray.push({
        name: statusName,
        value: count,
        color: color,
      });
    });

    // Sort by value descending
    chartDataArray.sort((a, b) => b.value - a.value);
    
    return chartDataArray;
  }, [issues, statuses]);

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
        No issues found
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
            outerRadius={80}
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

