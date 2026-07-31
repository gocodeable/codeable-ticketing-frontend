"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Gauge,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  CircleDot,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useFeatures, FEATURE_VELOCITY } from "@/lib/hooks/useFeatures";
import { apiGet } from "@/lib/api/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Stage palette — validated for light + dark; fixed order, never cycled.
const STAGE_ORDER = ["backlog", "todo", "in_progress", "review", "qa"] as const;
const STAGE_COLORS: Record<string, string> = {
  backlog: "#0891B2",
  todo: "#0891B2",
  in_progress: "#6366F1",
  review: "#C026D3",
  qa: "#D97706",
  done: "#059669",
  cancelled: "#64748B",
};
const STAGE_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  qa: "QA",
  done: "Done",
  cancelled: "Cancelled",
};
const SERIES_COLOR = "#6366F1";

interface ProjectOption {
  _id: string;
  title: string;
}

const WINDOWS = [
  { label: "Last 4 weeks", days: 28 },
  { label: "Last 8 weeks", days: 56 },
  { label: "Last 12 weeks", days: 84 },
  { label: "Last 24 weeks", days: 168 },
];

function StatTile({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
}) {
  const TrendIcon =
    trend == null || Math.abs(trend) < 0.05 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-lg bg-muted/30 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold tracking-tight mt-1 tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        {trend !== undefined && <TrendIcon className="w-3 h-3" />}
        {hint}
      </p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export default function VelocityPage() {
  const { user } = useAuth();
  const { features, loading: featuresLoading } = useFeatures();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [windowDays, setWindowDays] = useState(84);
  const [metric, setMetric] = useState<"points" | "tickets">("points");

  const [velocity, setVelocity] = useState<any | null>(null);
  const [flow, setFlow] = useState<any | null>(null);
  const [reliability, setReliability] = useState<any | null>(null);
  const [team, setTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasAccess = features.includes(FEATURE_VELOCITY);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await apiGet(`/projects/api?uid=${user.uid}&limit=1000&skip=0`, idToken);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const options = data.data.map((p: any) => ({ _id: p._id, title: p.title }));
          setProjects(options);
          if (options.length > 0) setProjectId((prev) => prev || options[0]._id);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };
    if (hasAccess) loadProjects();
  }, [user, hasAccess]);

  const loadAnalytics = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
      const qs = `projectId=${projectId}&from=${encodeURIComponent(from)}`;
      const [v, f, r, t] = await Promise.all([
        apiGet(`/api/analytics/velocity?${qs}&interval=week`, idToken).then((res) => res.json()),
        apiGet(`/api/analytics/flow?${qs}`, idToken).then((res) => res.json()),
        apiGet(`/api/analytics/reliability?${qs}`, idToken).then((res) => res.json()),
        apiGet(`/api/analytics/team?${qs}`, idToken).then((res) => res.json()),
      ]);
      setVelocity(v.success ? v.data : null);
      setFlow(f.success ? f.data : null);
      setReliability(r.success ? r.data : null);
      setTeam(t.success ? t.data : null);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, windowDays]);

  useEffect(() => {
    if (hasAccess) loadAnalytics();
  }, [hasAccess, loadAnalytics]);

  const chartData = useMemo(() => {
    if (!velocity?.buckets) return [];
    return velocity.buckets.map((b: any) => ({
      week: format(new Date(b.start), "MMM d"),
      points: b.points,
      tickets: b.completed,
    }));
  }, [velocity]);

  const stageShares = useMemo(() => {
    const tis = flow?.timeInStatus;
    if (!tis) return [] as { key: string; share: number; days: number | null }[];
    return [...STAGE_ORDER, "done"]
      .filter((s, i, arr) => arr.indexOf(s) === i && tis[s]?.share > 0)
      .map((s) => ({ key: s, share: tis[s].share, days: tis[s].avgDaysPerIssue }));
  }, [flow]);

  if (featuresLoading) {
    return (
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-72 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }
  if (!hasAccess) {
    return (
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Admins only</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Velocity analytics are restricted to workspace admins.
        </p>
      </main>
    );
  }

  const trend = velocity?.trend;
  const firstPassRate = reliability?.firstPass?.rate;
  const onTime = reliability?.onTimeDelivery;

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </span>
            Velocity
          </h1>
          <p className="text-muted-foreground mt-2">
            Delivery pace, flow health, and per-developer effectiveness.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.days} value={String(w.days)}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading && !velocity ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <StatTile
              label="Tickets completed"
              value={String(velocity?.totals?.completed ?? "—")}
              trend={trend?.throughputSlope}
              hint={`${trend?.avgThroughputPerInterval ?? 0}/week average`}
            />
            <StatTile
              label="Story points"
              value={String(velocity?.totals?.points ?? "—")}
              trend={trend?.pointsSlope}
              hint={
                velocity?.totals?.estimationCoverage != null
                  ? `${Math.round(velocity.totals.estimationCoverage * 100)}% of tickets estimated`
                  : "no estimates yet"
              }
            />
            <StatTile
              label="Cycle time · median"
              value={flow?.cycleTime?.p50Days != null ? `${flow.cycleTime.p50Days}d` : "—"}
              hint={
                flow?.cycleTime?.p90Days != null
                  ? `p90 ${flow.cycleTime.p90Days}d · n=${flow.cycleTime.count}`
                  : "no completions in window"
              }
            />
            <StatTile
              label="First-pass rate"
              value={firstPassRate != null ? `${Math.round(firstPassRate * 100)}%` : "—"}
              hint={
                reliability
                  ? `${reliability.rework?.reopens ?? 0} reopens · ${reliability.rework?.qaRejections ?? 0} QA bounces`
                  : undefined
              }
            />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6 mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-lg font-bold tracking-tight">
                {metric === "points"
                  ? "Story points completed per week"
                  : "Tickets completed per week"}
              </h2>
              <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="points" className="text-xs px-3">
                    Points
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="text-xs px-3">
                    Tickets
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-64">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="25%">
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                      content={<ChartTooltip unit={metric === "points" ? "pts" : "tickets"} />}
                    />
                    <Bar dataKey={metric} fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6"
            >
              <h2 className="text-lg font-bold tracking-tight mb-1">Where time goes</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Share of a completed ticket’s life spent in each stage
                {flow?.flowEfficiency != null &&
                  ` · flow efficiency ${Math.round(flow.flowEfficiency * 100)}%`}
              </p>
              {stageShares.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No completed tickets in this window yet.
                </p>
              ) : (
                <>
                  <div className="flex h-6 w-full gap-0.5 rounded-md overflow-hidden">
                    {stageShares.map((s) => (
                      <div
                        key={s.key}
                        style={{ width: `${Math.max(s.share * 100, 2)}%`, background: STAGE_COLORS[s.key] }}
                        className="h-full first:rounded-l-md last:rounded-r-md"
                        title={`${STAGE_LABELS[s.key]}: ${Math.round(s.share * 100)}% (${s.days ?? "?"}d avg per ticket)`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    {stageShares.map((s) => (
                      <span key={s.key} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s.key] }} />
                        <span className="text-muted-foreground">{STAGE_LABELS[s.key]}</span>
                        <span className="font-semibold tabular-nums">{Math.round(s.share * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
              {flow?.wip?.stale?.length > 0 && (
                <div className="mt-5 rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CircleDot className="w-3 h-3 text-amber-500" />
                    Stale work ({flow.wip.staleDays}+ days idle)
                  </p>
                  {flow.wip.stale.slice(0, 4).map((s: any) => (
                    <p key={s.id} className="text-xs text-muted-foreground truncate">
                      <span className="font-mono">{s.code}</span> · {s.title} —{" "}
                      <span className="text-amber-600 dark:text-amber-400">{s.idleDays}d idle</span>
                    </p>
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6"
            >
              <h2 className="text-lg font-bold tracking-tight mb-1">Reliability</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Quality of delivery over the same window
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="On-time delivery"
                  value={onTime?.rate != null ? `${Math.round(onTime.rate * 100)}%` : "—"}
                  hint={
                    onTime?.withEstimate
                      ? `${onTime.onTime}/${onTime.withEstimate} with due dates`
                      : "no due dates set"
                  }
                />
                <StatTile
                  label="Bugs per delivery"
                  value={
                    reliability?.defects?.bugsPerDelivery != null
                      ? String(reliability.defects.bugsPerDelivery)
                      : "—"
                  }
                  hint={`${reliability?.defects?.bugsCreated ?? 0} bugs raised in window`}
                />
              </div>
              {reliability?.rework?.byAssignee?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Rework by developer
                  </p>
                  <div className="space-y-1.5">
                    {reliability.rework.byAssignee.slice(0, 5).map((r: any) => (
                      <div key={r.uid} className="flex items-center justify-between text-sm">
                        <span className="truncate">{r.name || r.uid}</span>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {r.reopens} reopen{r.reopens === 1 ? "" : "s"} · {r.qaRejections} QA bounce
                          {r.qaRejections === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6"
          >
            <h2 className="text-lg font-bold tracking-tight mb-1">Team scorecards</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Read pace together with quality — high throughput with low first-pass is rework, not
              speed. Small samples move these numbers a lot.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Developer</TableHead>
                    <TableHead className="text-right">Done</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Cycle p50</TableHead>
                    <TableHead className="text-right">First-pass</TableHead>
                    <TableHead className="text-right">On-time</TableHead>
                    <TableHead className="text-right">WIP</TableHead>
                    <TableHead className="text-right">Active days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(team?.members || [])
                    .filter((m: any) => m.throughput.completed > 0 || m.engagement.wip > 0)
                    .map((m: any) => (
                      <TableRow key={m.uid}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {(m.name || "?")[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-tight">{m.name || m.uid}</p>
                              {m.role && (
                                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {m.throughput.completed}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{m.throughput.points}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.cycleTime.p50Days != null ? `${m.cycleTime.p50Days}d` : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            m.quality.firstPassRate != null &&
                              m.quality.firstPassRate < 0.7 &&
                              "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {m.quality.firstPassRate != null
                            ? `${Math.round(m.quality.firstPassRate * 100)}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.quality.onTimeRate != null
                            ? `${Math.round(m.quality.onTimeRate * 100)}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{m.engagement.wip}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.engagement.activeDays}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {(team?.members || []).filter(
                (m: any) => m.throughput.completed > 0 || m.engagement.wip > 0
              ).length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No activity in this window yet.
                </p>
              )}
            </div>
          </motion.section>
        </>
      )}
    </main>
  );
}
