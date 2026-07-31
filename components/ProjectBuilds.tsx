"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Smartphone,
  Apple,
  Globe,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Link2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/apiClient";
import { BuildPlatform, ProjectBuild } from "@/types/issue";
import { MemberRole } from "@/types/project";
import { cn } from "@/lib/utils";

const PLATFORMS: { value: BuildPlatform; label: string; icon: typeof Globe }[] = [
  { value: "android", label: "Android", icon: Smartphone },
  { value: "ios", label: "iOS", icon: Apple },
  { value: "web", label: "Web", icon: Globe },
];

const platformMeta = (platform: BuildPlatform) =>
  PLATFORMS.find((p) => p.value === platform) || PLATFORMS[2];

/**
 * A build older than this reads as "probably not what you want to test".
 * ponytail: fixed threshold — make it per-project if teams disagree on it.
 */
const STALE_AFTER_DAYS = 7;

const isStale = (updatedAt?: string | null) =>
  !!updatedAt &&
  Date.now() - new Date(updatedAt).getTime() > STALE_AFTER_DAYS * 86400_000;

interface ProjectBuildsProps {
  projectId: string;
  isAdmin: boolean;
  userRole?: MemberRole;
}

/**
 * Every app and dashboard a project ships, with the link QA should be
 * testing and when it last moved. Naming is an admin/PM/QA act; pointing an
 * entry at today's artefact is something any developer does directly.
 */
export default function ProjectBuilds({
  projectId,
  isAdmin,
  userRole,
}: ProjectBuildsProps) {
  const { user } = useAuth();
  const [builds, setBuilds] = useState<ProjectBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectBuild | null>(null);
  const [adding, setAdding] = useState(false);
  const [linkEditing, setLinkEditing] = useState<ProjectBuild | null>(null);
  const [deleting, setDeleting] = useState<ProjectBuild | null>(null);

  const canManage = isAdmin || userRole === "pm" || userRole === "qa";

  const fetchBuilds = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await apiGet(`/project/api?id=${projectId}`, idToken);
      const data = await res.json();
      if (data?.success) setBuilds(data.project?.builds || []);
    } catch (error) {
      console.error("Error fetching builds:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const save = async (
    build: ProjectBuild | null,
    payload: { name?: string; platform?: BuildPlatform; url?: string; note?: string }
  ) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = build
        ? await apiPatch(
            `/api/projects/${projectId}/builds/${build._id}`,
            payload,
            idToken
          )
        : await apiPost(`/api/projects/${projectId}/builds`, payload, idToken);
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save build");
        return;
      }
      toast.success(build ? "Build updated" : "Build added");
      setAdding(false);
      setEditing(null);
      setLinkEditing(null);
      fetchBuilds();
    } catch (error) {
      console.error("Error saving build:", error);
      toast.error("Failed to save build");
    }
  };

  const remove = async (build: ProjectBuild) => {
    if (!user) return;
    setDeleting(null);
    const previous = builds;
    setBuilds((prev) => prev.filter((b) => b._id !== build._id));
    try {
      const idToken = await user.getIdToken();
      const res = await apiDelete(
        `/api/projects/${projectId}/builds/${build._id}`,
        idToken
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBuilds(previous);
        toast.error(data.error || "Failed to remove build");
        return;
      }
      toast.success("Build removed");
    } catch (error) {
      console.error("Error removing build:", error);
      setBuilds(previous);
      toast.error("Failed to remove build");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Loading builds…
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          The apps and dashboards this project ships. Developers point each one
          at the current build; QA tests whatever is here.
        </p>
        {canManage && (
          <Button onClick={() => setAdding(true)} className="cursor-pointer gap-1.5">
            <Plus className="w-4 h-4" />
            Add build
          </Button>
        )}
      </div>

      {builds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border/60 rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <h4 className="text-sm font-semibold mb-1">No builds yet</h4>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            {canManage
              ? "Add an entry for each app or dashboard — “Parent app”, “Student app”, “Admin dashboard” — then developers can keep the links current."
              : "An admin, PM or QA member needs to add the apps and dashboards for this project first."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {builds.map((build) => {
            const meta = platformMeta(build.platform);
            const Icon = meta.icon;
            const stale = isStale(build.urlUpdatedAt);
            return (
              <div
                key={build._id}
                className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{build.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {meta.label}
                      {build.urlUpdatedAt ? (
                        <>
                          {" · updated "}
                          {formatDistanceToNow(new Date(build.urlUpdatedAt), {
                            addSuffix: true,
                          })}
                        </>
                      ) : (
                        " · no link yet"
                      )}
                    </div>
                  </div>
                  {stale && (
                    <span
                      className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      title={`No new link in over ${STALE_AFTER_DAYS} days`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Stale
                    </span>
                  )}
                </div>

                {build.note && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {build.note}
                  </p>
                )}

                {build.url ? (
                  <a
                    href={build.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{build.url}</span>
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Waiting on a link from the team.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkEditing(build)}
                    className="cursor-pointer gap-1.5 h-8 text-xs"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {build.url ? "Update link" : "Add link"}
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(build)}
                        className="cursor-pointer h-8 w-8 p-0"
                        aria-label={`Rename ${build.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(build)}
                        className="cursor-pointer h-8 w-8 p-0 text-destructive hover:text-destructive"
                        aria-label={`Remove ${build.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editing) && (
        <BuildFormDialog
          open
          build={editing}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={(payload) => save(editing, payload)}
        />
      )}

      {linkEditing && (
        <LinkDialog
          build={linkEditing}
          onCancel={() => setLinkEditing(null)}
          onSave={(url) => save(linkEditing, { url })}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(next) => !next && setDeleting(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove {deleting?.name}?</DialogTitle>
            <DialogDescription>
              The entry and its link are removed for everyone on this project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove(deleting)}
              className="cursor-pointer"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Name + platform + optional note. Restricted to admin, PM and QA. */
function BuildFormDialog({
  open,
  build,
  onCancel,
  onSave,
}: {
  open: boolean;
  build: ProjectBuild | null;
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    platform: BuildPlatform;
    note?: string;
  }) => void;
}) {
  const [name, setName] = useState(build?.name || "");
  const [platform, setPlatform] = useState<BuildPlatform>(
    build?.platform || "android"
  );
  const [note, setNote] = useState(build?.note || "");

  const trimmed = name.trim();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{build ? "Rename build" : "Add a build"}</DialogTitle>
          <DialogDescription>
            Name it the way the team says it out loud — &ldquo;Parent app&rdquo;,
            &ldquo;Student app&rdquo;, &ldquo;Admin dashboard&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="build-name">Name</Label>
            <Input
              id="build-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Parent app"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="flex gap-2">
              {PLATFORMS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlatform(value)}
                  aria-pressed={platform === value}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    platform === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="build-note">Note (optional)</Label>
            <Input
              id="build-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Parent-facing app, Play Store internal track"
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={() => onSave({ name: trimmed, platform, note: note.trim() })}
            disabled={!trimmed}
            className="cursor-pointer"
          >
            {build ? "Save" : "Add build"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Just the link. Open to any project member — this is the frequent act. */
function LinkDialog({
  build,
  onCancel,
  onSave,
}: {
  build: ProjectBuild;
  onCancel: () => void;
  onSave: (url: string) => void;
}) {
  const [url, setUrl] = useState(build.url || "");
  const trimmed = url.trim();
  const isValid = trimmed === "" || /^https?:\/\/\S+$/i.test(trimmed);

  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{build.url ? "Update link" : "Add link"}</DialogTitle>
          <DialogDescription>
            Where QA can get the current <strong>{build.name}</strong> build — a
            Drive link, TestFlight, App Distribution, or a staging URL. Everyone
            on QA gets told it changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="build-url">Build link</Label>
          <Input
            id="build-url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && onSave(trimmed)}
            placeholder="https://drive.google.com/..."
            aria-invalid={!isValid}
          />
          {!isValid && (
            <p className="text-xs text-destructive">
              Must be a link starting with http:// or https://
            </p>
          )}
          {build.url && (
            <p className="text-xs text-muted-foreground">
              Clearing this leaves the entry in place with no link.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={() => onSave(trimmed)}
            disabled={!isValid || trimmed === (build.url || "")}
            className="cursor-pointer"
          >
            Save link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
