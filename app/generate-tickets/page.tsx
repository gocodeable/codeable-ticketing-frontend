"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  UploadCloud,
  Loader2,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useFeatures, FEATURE_SRS } from "@/lib/hooks/useFeatures";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SrsContextForm } from "@/components/SrsContextForm";
import { ProjectContext, DEFAULT_CONTEXT } from "@/types/srsContext";

interface TeamMember {
  uid: string;
  name: string;
  role: string;
  openIssueCount: number;
}

interface ProposedTicket {
  ref?: string;
  parentRef?: string | null;
  title: string;
  description: string;
  type: "epic" | "task" | "bug" | "story" | "subtask";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  difficulty: "trivial" | "easy" | "medium" | "hard" | "expert";
  storyPoints?: number;
  suggestedRole: string;
  rationale: string;
  suggestedAssignee?: { uid: string; name: string } | null;
}

interface ReviewTicket extends ProposedTicket {
  included: boolean;
  assignee: string | null;
}

interface ProjectOption {
  _id: string;
  title: string;
}

const DIFFICULTY_LEVELS = ["trivial", "easy", "medium", "hard", "expert"] as const;
const DIFFICULTY_COLORS: Record<string, string> = {
  trivial: "bg-emerald-500",
  easy: "bg-lime-500",
  medium: "bg-amber-500",
  hard: "bg-orange-500",
  expert: "bg-red-500",
};
const POINT_OPTIONS = [1, 2, 3, 5, 8, 13];

function DifficultyMeter({ level }: { level: string }) {
  const filled = DIFFICULTY_LEVELS.indexOf(level as any) + 1;
  return (
    <div className="flex items-center gap-1" title={`Difficulty: ${level}`}>
      {DIFFICULTY_LEVELS.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            i < filled ? DIFFICULTY_COLORS[level] : "bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

const TYPE_BADGE: Record<string, string> = {
  story: "bg-primary/10 text-primary border-primary/20",
  task: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  bug: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  epic: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  subtask: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export default function GenerateTicketsPage() {
  const { user } = useAuth();
  const { features, loading: featuresLoading } = useFeatures();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [sourceTab, setSourceTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [instructions, setInstructions] = useState("");

  const [context, setContext] = useState<ProjectContext>(DEFAULT_CONTEXT);
  const [showContext, setShowContext] = useState(true);

  // Generation polls for minutes; bail out of the loop if the page goes away.
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tickets, setTickets] = useState<ReviewTicket[]>([]);
  const [createdResult, setCreatedResult] = useState<{
    created: { code: string; title: string }[];
    failed: { title: string; error: string }[];
    notes: string[];
    statusName: string;
  } | null>(null);

  const hasAccess = features.includes(FEATURE_SRS);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await apiGet(`/projects/api?uid=${user.uid}&limit=1000&skip=0`, idToken);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setProjects(data.data.map((p: any) => ({ _id: p._id, title: p.title })));
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };
    loadProjects();
  }, [user]);

  // Prefill the questionnaire with whatever was used for this project last time.
  // The projects LIST endpoint projects only a few fields, so the saved context
  // has to come from the single-project endpoint.
  useEffect(() => {
    let cancelled = false;
    const loadSavedContext = async () => {
      if (!user || !projectId) return;
      setContext(DEFAULT_CONTEXT);
      try {
        const idToken = await user.getIdToken();
        const res = await apiGet(`/project/api?id=${projectId}`, idToken);
        const data = await res.json();
        if (cancelled) return;
        const saved = data?.data?.srsContext;
        if (saved && typeof saved === "object") {
          setContext({ ...DEFAULT_CONTEXT, ...saved });
        }
      } catch (error) {
        console.error("Error loading saved project context:", error);
      }
    };
    loadSavedContext();
    return () => {
      cancelled = true;
    };
  }, [user, projectId]);

  // Elapsed counter while a generation is in flight (it can run for minutes).
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [generating]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md", ".markdown"],
    },
  });

  const canGenerate =
    !!projectId &&
    !generating &&
    (sourceTab === "upload" ? !!file : pastedText.trim().length > 50);

  /** Apply a finished generation to the review screen. */
  const applyPreview = (payload: any) => {
    setSummary(payload.summary);
    setTeam(payload.team || []);
    setTickets(
      (payload.tickets || []).map((t: ProposedTicket) => ({
        ...t,
        included: true,
        assignee: t.suggestedAssignee?.uid || null,
      }))
    );
    toast.success(`Proposed ${payload.tickets?.length ?? 0} tickets — review before creating`);
  };

  /**
   * Generation runs for minutes, and every proxy in front of the API cuts a
   * request at ~100s. So the backend hands back a jobId immediately and we poll
   * it here until it's done.
   */
  const handleGenerate = async () => {
    if (!user || !canGenerate) return;
    setGenerating(true);
    setElapsed(0);
    setCreatedResult(null);
    try {
      const idToken = await user.getIdToken();
      const body: Record<string, unknown> = { projectId, context };
      if (instructions.trim()) body.instructions = instructions.trim();

      if (sourceTab === "upload" && file) {
        if (file.name.toLowerCase().endsWith(".pdf")) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          body.pdfBase64 = base64;
        } else {
          body.text = await file.text();
        }
      } else {
        body.text = pastedText;
      }

      const startRes = await apiPost("/api/srs/preview", body, idToken);
      const started = await startRes.json();
      if (!started.success) throw new Error(started.error || "Could not start generation");
      const jobId = started.data?.jobId;
      if (!jobId) throw new Error("Backend did not return a job id");

      // Poll until done. ~10 min ceiling; the job TTLs out server-side anyway.
      // `unmountedRef` stops the loop if the user navigates away mid-generation,
      // so we don't keep polling (or toast) against a dead component.
      const deadline = Date.now() + 10 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        if (unmountedRef.current) return;
        const freshToken = await user.getIdToken();
        const pollRes = await apiGet(`/api/srs/preview/${jobId}`, freshToken);
        const poll = await pollRes.json();
        if (unmountedRef.current) return;
        if (!poll.success) throw new Error(poll.error || "Lost track of the generation");

        if (poll.data.status === "done") {
          applyPreview(poll.data);
          return;
        }
        if (poll.data.status === "error") {
          throw new Error(poll.data.error || "Generation failed");
        }
        // still pending — keep waiting
      }
      throw new Error("Generation timed out after 10 minutes. Try a smaller SRS.");
    } catch (error: any) {
      console.error("SRS generation failed:", error);
      toast.error(error?.message || "Failed to generate tickets");
    } finally {
      setGenerating(false);
    }
  };

  const updateTicket = (index: number, patch: Partial<ReviewTicket>) => {
    setTickets((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const includedCount = useMemo(() => tickets.filter((t) => t.included).length, [tickets]);
  // Only story/task/bug carry velocity points — epics are containers and
  // subtasks are a breakdown of their parent, so both are excluded here to
  // match how the backend rolls up and how velocity counts.
  const includedPoints = useMemo(
    () =>
      tickets
        .filter((t) => t.included && ["story", "task", "bug"].includes(t.type))
        .reduce((acc, t) => acc + (t.storyPoints || 0), 0),
    [tickets]
  );

  // Nesting depth per row (epic 0 -> story/task/bug 1 -> subtask 2), derived from
  // the ref/parentRef links, so the reviewed backlog reads as a hierarchy.
  const depthByIndex = useMemo(() => {
    const byRef = new Map<string, ReviewTicket>();
    tickets.forEach((t) => {
      if (t.ref) byRef.set(t.ref, t);
    });
    const depthOf = (t: ReviewTicket, guard = 0): number => {
      if (!t.parentRef || guard > 5) return 0;
      const parent = byRef.get(t.parentRef);
      return parent ? 1 + depthOf(parent, guard + 1) : 0;
    };
    return tickets.map((t) => depthOf(t));
  }, [tickets]);

  const handleCreate = async () => {
    if (!user || includedCount === 0) return;
    setCreating(true);
    try {
      const idToken = await user.getIdToken();
      const payload = {
        projectId,
        tickets: tickets
          .filter((t) => t.included)
          .map((t) => ({
            ref: t.ref,
            parentRef: t.parentRef ?? null,
            title: t.title,
            description: t.description,
            type: t.type,
            priority: t.priority,
            difficulty: t.difficulty,
            storyPoints: t.storyPoints,
            assignee: t.assignee || undefined,
          })),
      };
      const response = await apiPost("/api/srs/generate", payload, idToken);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Ticket creation failed");
      const notes: string[] = data.data.notes || [];
      setCreatedResult({
        created: data.data.created || [],
        failed: data.data.failed || [],
        notes,
        statusName: data.data.workflowStatus?.name || "Backlog",
      });
      setTickets([]);
      setSummary(null);
      toast.success(`Created ${data.data.created?.length ?? 0} tickets`);
      if (notes.length > 0) {
        toast.message(`${notes.length} item${notes.length === 1 ? "" : "s"} were adjusted`, {
          description: notes[0],
        });
      }
    } catch (error: any) {
      console.error("Ticket creation failed:", error);
      toast.error(error?.message || "Failed to create tickets");
    } finally {
      setCreating(false);
    }
  };

  if (featuresLoading) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-72 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }
  if (!hasAccess) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket generation is invite-only</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Ask a workspace admin to grant you access to SRS ticket generation.
        </p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </span>
          Generate Tickets
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload an SRS and get an implementation-ready backlog — sized, prioritized, and
          assigned. You review everything before anything is created.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">Project</label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose the project to fill" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="text-sm font-semibold mb-2 mt-4 block">
              Extra instructions{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder='e.g. "Only phase 1", "split auth into small tickets"'
            />
          </div>

          <div>
            <Tabs value={sourceTab} onValueChange={setSourceTab}>
              <TabsList className="mb-3">
                <TabsTrigger value="upload">Upload file</TabsTrigger>
                <TabsTrigger value="paste">Paste text</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <div
                  {...getRootProps()}
                  className={cn(
                    "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors bg-muted/30",
                    isDragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop the SRS here, or click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, Markdown or plain text — up to 20MB
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="paste">
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the SRS content here…"
                  className="min-h-[140px]"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Project context — the answers that decide which tickets exist at all */}
        <div className="mt-6 border-t border-border/50 pt-5">
          <button
            type="button"
            onClick={() => setShowContext((s) => !s)}
            className="mb-3 flex w-full items-center justify-between text-left"
          >
            <div>
              <h2 className="text-sm font-bold tracking-tight">Project context</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Platforms, stack, dashboards and constraints — shapes the epics and tickets
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showContext && "rotate-180"
              )}
            />
          </button>
          {showContext && <SrsContextForm value={context} onChange={setContext} />}
        </div>

        <div className="flex items-center justify-end mt-5 gap-3">
          {generating && (
            <p className="text-sm text-muted-foreground">
              Reading the SRS, planning epics, and sizing the work — this runs in the background and
              can take a few minutes. ({Math.floor(elapsed / 60)}m {elapsed % 60}s)
            </p>
          )}
          <Button onClick={handleGenerate} disabled={!canGenerate} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating…" : "Generate tickets"}
          </Button>
        </div>
      </motion.section>

      {summary && tickets.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6 mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Proposed backlog</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{summary}</p>
            </div>
            <div className="text-sm text-muted-foreground shrink-0">
              <span className="font-semibold text-foreground">{includedCount}</span> tickets ·{" "}
              <span className="font-semibold text-foreground">{includedPoints}</span> points selected
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {tickets.map((ticket, index) => (
              <div
                key={index}
                style={
                  depthByIndex[index] > 0
                    ? { marginLeft: depthByIndex[index] * 24 }
                    : undefined
                }
                className={cn(
                  "py-4 flex flex-col lg:flex-row lg:items-center gap-3 transition-opacity",
                  depthByIndex[index] > 0 && "border-l-2 border-border/40 pl-3",
                  !ticket.included && "opacity-40"
                )}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={ticket.included}
                    onChange={(e) => updateTicket(index, { included: e.target.checked })}
                    className="mt-1.5 h-4 w-4 rounded border-border accent-[var(--primary)] cursor-pointer"
                    aria-label={`Include "${ticket.title}"`}
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      value={ticket.title}
                      onChange={(e) => updateTicket(index, { title: e.target.value })}
                      className="font-medium border-transparent hover:border-border focus-visible:border-border px-2 -mx-2 h-8"
                    />
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.rationale}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap pl-7 lg:pl-0">
                  <Badge variant="outline" className={cn("capitalize", TYPE_BADGE[ticket.type])}>
                    {ticket.type}
                  </Badge>

                  <div className="flex items-center gap-2 w-[130px]">
                    <DifficultyMeter level={ticket.difficulty} />
                    <Select
                      value={ticket.difficulty}
                      onValueChange={(v) => updateTicket(index, { difficulty: v as any })}
                    >
                      <SelectTrigger className="h-8 border-transparent hover:border-border text-xs capitalize w-[84px] px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {ticket.type !== "epic" ? (
                    <Select
                      value={ticket.storyPoints ? String(ticket.storyPoints) : ""}
                      onValueChange={(v) => updateTicket(index, { storyPoints: Number(v) })}
                    >
                      <SelectTrigger className="h-8 w-[72px] text-xs">
                        <SelectValue placeholder="pts" />
                      </SelectTrigger>
                      <SelectContent>
                        {POINT_OPTIONS.map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p} pt{p > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="w-[72px] text-center text-xs text-muted-foreground" title="Epic size is the rollup of its children">
                      rollup
                    </span>
                  )}

                  {ticket.type !== "epic" ? (
                    <Select
                      value={ticket.assignee || "unassigned"}
                      onValueChange={(v) =>
                        updateTicket(index, { assignee: v === "unassigned" ? null : v })
                      }
                    >
                      <SelectTrigger className="h-8 w-[170px] text-xs">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {team.map((m) => (
                          <SelectItem key={m.uid} value={m.uid}>
                            {m.name} · {m.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="w-[170px] text-xs text-muted-foreground">
                      Epic · container
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end mt-5">
            <Button onClick={handleCreate} disabled={creating || includedCount === 0} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? "Creating…" : `Create ${includedCount} ticket${includedCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </motion.section>
      )}

      {createdResult && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {createdResult.created.length} tickets created in “{createdResult.statusName}”
              </h2>
              {createdResult.failed.length > 0 && (
                <p className="text-sm text-red-500">
                  {createdResult.failed.length} failed — {createdResult.failed[0]?.error}
                </p>
              )}
            </div>
          </div>
          {createdResult.notes.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                {createdResult.notes.length} item{createdResult.notes.length === 1 ? "" : "s"} adjusted to keep the hierarchy valid:
              </p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {createdResult.notes.slice(0, 6).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
                {createdResult.notes.length > 6 && (
                  <li>+{createdResult.notes.length - 6} more</li>
                )}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {createdResult.created.slice(0, 20).map((c) => (
              <Badge key={c.code} variant="outline" className="font-mono text-xs">
                {c.code}
              </Badge>
            ))}
            {createdResult.created.length > 20 && (
              <Badge variant="outline" className="text-xs">
                +{createdResult.created.length - 20} more
              </Badge>
            )}
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/project/${projectId}`}>
              Open the board <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.section>
      )}
    </main>
  );
}
