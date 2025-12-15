"use client";

import { useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Issue } from "@/types/issue";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

interface IssuePriorityBarChartProps {
  issues: Issue[];
  loading?: boolean;
}

interface ChartData {
  priority: string;
  count: number;
  color: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  highest: "#dc2626", // Red
  high: "#ea580c", // Orange
  medium: "#ca8a04", // Yellow
  low: "#2563eb", // Blue
  lowest: "#6b7280", // Gray
};

const PRIORITY_LABELS: Record<string, string> = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
  lowest: "Lowest",
};

export function IssuePriorityBarChart({ issues, loading = false }: IssuePriorityBarChartProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);

  // Get the actual text color based on theme
  const textColor = resolvedTheme === 'dark' ? '#ffffff' : '#000000';

  const chartData = useMemo(() => {
    if (!issues || issues.length === 0) return [];

    // Group issues by priority
    const priorityCounts = new Map<string, number>();
    
    issues.forEach((issue) => {
      const priority = issue.priority || "medium";
      const count = priorityCounts.get(priority) || 0;
      priorityCounts.set(priority, count + 1);
    });

    // Create chart data in priority order
    const priorityOrder = ["highest", "high", "medium", "low", "lowest"];
    const chartDataArray: ChartData[] = priorityOrder.map((priority) => ({
      priority: PRIORITY_LABELS[priority],
      count: priorityCounts.get(priority) || 0,
      color: PRIORITY_COLORS[priority],
    }));

    return chartDataArray;
  }, [issues]);

  // Aggressively update text colors after chart renders
  useEffect(() => {
    if (!chartRef.current) return;
    
    const updateTextColors = () => {
      const textElements = chartRef.current?.querySelectorAll('text');
      if (textElements && textElements.length > 0) {
        textElements.forEach((text) => {
          // Remove any existing fill attribute and style
          text.removeAttribute('fill');
          text.style.removeProperty('fill');
          // Set the color directly
          text.setAttribute('fill', textColor);
          text.style.setProperty('fill', textColor, 'important');
        });
      }
    };

    // Use requestAnimationFrame for immediate update
    const rafId = requestAnimationFrame(() => {
      updateTextColors();
    });

    // Update multiple times to catch all rendered elements
    const timeouts = [
      setTimeout(updateTextColors, 50),
      setTimeout(updateTextColors, 150),
      setTimeout(updateTextColors, 300),
      setTimeout(updateTextColors, 500),
    ];
    
    // Use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updateTextColors);
    });
    
    if (chartRef.current) {
      observer.observe(chartRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['fill', 'style'],
      });
    }
    
    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [chartData, textColor, resolvedTheme]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold">{payload[0].payload.priority}</p>
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

  if (chartData.length === 0 || chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No issues found
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .priority-bar-chart-${resolvedTheme} .recharts-bar-rectangle:hover {
            opacity: 0.8 !important;
          }
          .priority-bar-chart-${resolvedTheme} .recharts-active-bar {
            opacity: 0.8 !important;
          }
          .priority-bar-chart-${resolvedTheme} .recharts-bar-rectangle {
            transition: opacity 0.2s;
          }
          .priority-bar-chart-${resolvedTheme} .recharts-cartesian-axis-tick text,
          .priority-bar-chart-${resolvedTheme} .recharts-xAxis .recharts-cartesian-axis-tick text,
          .priority-bar-chart-${resolvedTheme} .recharts-yAxis .recharts-cartesian-axis-tick text,
          .priority-bar-chart-${resolvedTheme} .recharts-cartesian-axis-tick-value,
          .priority-bar-chart-${resolvedTheme} .recharts-label,
          .priority-bar-chart-${resolvedTheme} text {
            fill: ${textColor} !important;
            color: ${textColor} !important;
          }
          .priority-bar-chart-${resolvedTheme} .recharts-cartesian-axis-line {
            stroke: hsl(var(--border)) !important;
          }
        `
      }} />
      <div ref={chartRef} className={`w-full priority-bar-chart priority-bar-chart-${resolvedTheme}`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="priority"
              stroke={textColor}
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: textColor }}
            />
            <YAxis
              stroke={textColor}
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: textColor }}
            />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'transparent' }}
          />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]} 
            fill="#1e3a8a"
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </>
  );
}

