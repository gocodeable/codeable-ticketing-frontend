"use client";

import { useState } from "react";
import { ChevronDown, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ProjectContext,
  SURFACES,
  MOBILE_FRAMEWORKS,
  BACKEND_APPROACHES,
  BACKEND_STACKS,
  DATABASES,
  AUTH_OPTIONS,
  REALTIME,
  INTEGRATIONS,
  COMPLIANCE,
  NON_FUNCTIONAL,
  GRANULARITY,
  hasMobileSurface,
} from "@/types/srsContext";

/** A toggleable chip — used everywhere we need a lightweight multi-select. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="space-y-4 border-t border-border/60 px-4 py-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function YesNo({
  value,
  onChange,
  yes = "Yes",
  no = "No",
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <div className="flex gap-2">
      <Chip active={value === true} onClick={() => onChange(true)}>
        {yes}
      </Chip>
      <Chip active={value === false} onClick={() => onChange(false)}>
        {no}
      </Chip>
    </div>
  );
}

interface Props {
  value: ProjectContext;
  onChange: (next: ProjectContext) => void;
}

/**
 * The project-context questionnaire. Every answer becomes a hard constraint on
 * what the model may generate (see src/services/srsContext.ts on the backend),
 * so this is what makes the backlog match the actual product and stack.
 */
export function SrsContextForm({ value, onChange }: Props) {
  const set = <K extends keyof ProjectContext>(key: K, v: ProjectContext[K]) =>
    onChange({ ...value, [key]: v });

  const toggleIn = (key: "surfaces" | "realtime" | "integrations" | "compliance" | "nonFunctional", item: string) => {
    const current = (value[key] as string[] | undefined) || [];
    const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
    onChange({ ...value, [key]: next });
  };

  const dashboards = value.dashboards || [];
  const setDashboard = (i: number, patch: Partial<{ name: string; audience: string }>) =>
    set(
      "dashboards",
      dashboards.map((d, idx) => (idx === i ? { ...d, ...patch } : d))
    );

  const isMobile = hasMobileSurface(value);
  const isCustomBackend = value.backendApproach === "custom" || value.backendApproach === "hybrid";
  const isBaas = value.backendApproach === "none_baas" || value.backendApproach === "hybrid";

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          These answers decide which epics and tickets get created — a project with no mobile app
          won&apos;t get mobile tickets, and a Firebase backend won&apos;t get server tickets. Saved
          per project and prefilled next time.
        </p>
      </div>

      <Section title="Product surfaces" hint="Each becomes a top-level epic" defaultOpen>
        <Field label="Which surfaces are in scope?">
          <div className="flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <Chip
                key={s.value}
                active={(value.surfaces || []).includes(s.value)}
                onClick={() => toggleIn("surfaces", s.value)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Field>

        {isMobile && (
          <Field label="Mobile framework">
            <Select
              value={value.mobileFramework || ""}
              onValueChange={(v) => set("mobileFramework", v as any)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Choose a framework" />
              </SelectTrigger>
              <SelectContent>
                {MOBILE_FRAMEWORKS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Dashboards & portals — one epic each">
          <div className="space-y-2">
            {dashboards.map((d, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={d.name}
                  onChange={(e) => setDashboard(i, { name: e.target.value })}
                  placeholder="Name (e.g. Admin dashboard)"
                  className="flex-1"
                />
                <Input
                  value={d.audience}
                  onChange={(e) => setDashboard(i, { audience: e.target.value })}
                  placeholder="Who uses it? (e.g. internal ops)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => set("dashboards", dashboards.filter((_, idx) => idx !== i))}
                  aria-label="Remove dashboard"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => set("dashboards", [...dashboards, { name: "", audience: "" }])}
            >
              <Plus className="h-3.5 w-3.5" /> Add dashboard
            </Button>
          </div>
        </Field>
      </Section>

      <Section title="Backend & data" hint="Decides whether backend tickets exist at all">
        <Field label="Backend approach">
          <Select
            value={value.backendApproach || ""}
            onValueChange={(v) => set("backendApproach", v as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="How is the backend built?" />
            </SelectTrigger>
            <SelectContent>
              {BACKEND_APPROACHES.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {isBaas && (
            <Field label="BaaS provider">
              <Input
                value={value.baasProvider || ""}
                onChange={(e) => set("baasProvider", e.target.value)}
                placeholder="Firebase, Supabase…"
              />
            </Field>
          )}
          {isCustomBackend && (
            <Field label="Backend language / framework">
              <Select value={value.backendStack || ""} onValueChange={(v) => set("backendStack", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a stack" />
                </SelectTrigger>
                <SelectContent>
                  {BACKEND_STACKS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Database">
            <Select value={value.database || ""} onValueChange={(v) => set("database", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a database" />
              </SelectTrigger>
              <SelectContent>
                {DATABASES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Authentication">
            <Select value={value.auth || ""} onValueChange={(v) => set("auth", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose auth" />
              </SelectTrigger>
              <SelectContent>
                {AUTH_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Realtime needs">
          <div className="flex flex-wrap gap-2">
            {REALTIME.map((r) => (
              <Chip
                key={r.value}
                active={(value.realtime || []).includes(r.value)}
                onClick={() => toggleIn("realtime", r.value)}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="File / media uploads needed?">
          <YesNo value={value.fileStorage} onChange={(v) => set("fileStorage", v)} />
        </Field>
      </Section>

      <Section title="Integrations" hint="Each gets at least one ticket">
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS.map((i) => (
            <Chip
              key={i.value}
              active={(value.integrations || []).includes(i.value)}
              onClick={() => toggleIn("integrations", i.value)}
            >
              {i.label}
            </Chip>
          ))}
        </div>
        <Field label="Anything else">
          <Input
            value={value.integrationsOther || ""}
            onChange={(e) => set("integrationsOther", e.target.value)}
            placeholder="e.g. Twilio, Plaid, Salesforce"
          />
        </Field>
      </Section>

      <Section title="Delivery constraints" hint="Drives priority and what gets deferred">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project stage">
            <Select
              value={value.projectStage || ""}
              onValueChange={(v) => set("projectStage", v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="New or existing?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greenfield">Greenfield (new project)</SelectItem>
                <SelectItem value="existing">Extending an existing codebase</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Timeline">
            <Input
              value={value.timeline || ""}
              onChange={(e) => set("timeline", e.target.value)}
              placeholder="e.g. MVP in 6 weeks"
            />
          </Field>
          <Field label="Team size">
            <Input
              type="number"
              min={1}
              value={value.teamSize ?? ""}
              onChange={(e) =>
                set("teamSize", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="e.g. 5"
            />
          </Field>
        </div>

        <Field label="Out of scope for this pass">
          <Textarea
            value={value.mvpScope || ""}
            onChange={(e) => set("mvpScope", e.target.value)}
            placeholder="e.g. Phase 1 only — no loyalty programme, no vendor payouts. Anything listed here will NOT get tickets."
            className="min-h-[70px]"
          />
        </Field>

        <Field label="Compliance">
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE.map((c) => (
              <Chip
                key={c.value}
                active={(value.compliance || []).includes(c.value)}
                onClick={() => toggleIn("compliance", c.value)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Non-functional requirements">
          <div className="flex flex-wrap gap-2">
            {NON_FUNCTIONAL.map((n) => (
              <Chip
                key={n.value}
                active={(value.nonFunctional || []).includes(n.value)}
                onClick={() => toggleIn("nonFunctional", n.value)}
              >
                {n.label}
              </Chip>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Process & estimation" hint="Shapes ticket size and what velocity will show">
        <Field label="Ticket granularity">
          <Select value={value.granularity || ""} onValueChange={(v) => set("granularity", v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="How granular?" />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITY.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Split anything estimated above">
          <Select
            value={String(value.splitAbovePoints ?? "")}
            onValueChange={(v) => set("splitAbovePoints", Number(v))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Points threshold" />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 8, 13].map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {p} points
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="QA / testing tickets">
            <YesNo value={value.includeQaTickets} onChange={(v) => set("includeQaTickets", v)} />
          </Field>
          <Field label="DevOps / CI-CD tickets">
            <YesNo
              value={value.includeDevOpsTickets}
              onChange={(v) => set("includeDevOpsTickets", v)}
            />
          </Field>
          <Field label="Are designs done?">
            <YesNo
              value={value.designsReady}
              onChange={(v) => set("designsReady", v)}
              yes="Designs ready"
              no="Need design tickets"
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}
