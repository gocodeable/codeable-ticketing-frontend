"use client";

import { useEffect, useState } from "react";
import { Smartphone, Apple, Globe, ExternalLink } from "lucide-react";
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
import { apiGet } from "@/lib/api/apiClient";
import { BuildPlatform, IssueBuild, ProjectBuild } from "@/types/issue";
import { cn } from "@/lib/utils";

const PLATFORMS: { value: BuildPlatform; label: string; icon: typeof Globe }[] = [
  { value: "android", label: "Android", icon: Smartphone },
  { value: "ios", label: "iOS", icon: Apple },
  { value: "web", label: "Web", icon: Globe },
];

interface BuildPromptDialogProps {
  open: boolean;
  projectId: string;
  issueCode?: string;
  statusName?: string;
  /**
   * "move": asked during a move into RFQA — dismissing means move anyway.
   * "edit": changing the build on a ticket that is already there —
   * dismissing means leave it alone, and `null` clears it.
   */
  mode?: "move" | "edit";
  /** Existing build, prefilled in edit mode */
  initialBuild?: IssueBuild | null;
  /** null = no build. In move mode that means "move without one"; in edit
   *  mode, that comes from Remove. Dismissing in edit mode calls onCancel. */
  onResolve: (build: IssueBuild | null) => void;
  onCancel?: () => void;
}

/**
 * Asked for when a ticket moves into RFQA: which build should QA test?
 * Prefills from the project's current build for the chosen platform, so the
 * first ticket of a QA round types the link and the rest are one click.
 */
export default function BuildPromptDialog({
  open,
  projectId,
  issueCode,
  statusName,
  mode = "move",
  initialBuild = null,
  onResolve,
  onCancel,
}: BuildPromptDialogProps) {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<BuildPlatform>("android");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [current, setCurrent] = useState<Partial<Record<BuildPlatform, ProjectBuild>>>({});
  const [touched, setTouched] = useState(false);

  const isEdit = mode === "edit";
  const dismiss = () => (isEdit ? onCancel?.() : onResolve(null));

  // Fetch on open rather than from props: another QA member may have set a
  // newer build since this page loaded.
  useEffect(() => {
    if (!open || !user) return;
    // The ticket's own build wins over the project default when editing
    if (initialBuild?.url) {
      setPlatform(initialBuild.platform);
      setUrl(initialBuild.url);
      setLabel(initialBuild.label || "");
      setTouched(true);
    } else {
      setTouched(false);
    }
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await apiGet(`/project/api?id=${projectId}`, idToken);
        const data = await res.json();
        if (cancelled || !data?.success) return;
        const builds = (data.project?.currentBuilds || {}) as Partial<
          Record<BuildPlatform, ProjectBuild>
        >;
        setCurrent(builds);
        if (initialBuild?.url) return;
        // Default to the platform whose build was set most recently
        const latest = Object.values(builds)
          .filter(Boolean)
          .sort(
            (a, b) =>
              new Date(b!.setAt || 0).getTime() - new Date(a!.setAt || 0).getTime()
          )[0];
        if (latest?.platform) setPlatform(latest.platform);
      } catch {
        // Prefill is a convenience — an empty form still works
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, user]);

  const currentForPlatform = current[platform];
  const currentUrl = currentForPlatform?.url || "";
  const currentLabel = currentForPlatform?.label || "";

  // Follow the current build as the platform changes, until the user types.
  // Deps are the primitives, not the object — `.find` returns a fresh
  // identity every render.
  useEffect(() => {
    if (touched) return;
    setUrl(currentUrl);
    setLabel(currentLabel);
  }, [currentUrl, currentLabel, touched]);

  const trimmedUrl = url.trim();
  const isValid =
    trimmedUrl === "" || /^https?:\/\/\S+$/i.test(trimmedUrl);

  const submit = () => {
    if (!trimmedUrl || !isValid) return;
    onResolve({ platform, url: trimmedUrl, label: label.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit build" : "Build to test"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Change the build QA should test${issueCode ? ` on ${issueCode}` : ""}.`
              : `${issueCode ? `${issueCode} is moving to ${statusName || "RFQA"}. ` : ""}Paste the build QA should test — a Drive link, TestFlight, App Distribution, or a staging URL.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            {PLATFORMS.map(({ value, label: pLabel, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPlatform(value);
                  setTouched(false);
                }}
                aria-pressed={platform === value}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  platform === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {pLabel}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="build-url">Build link</Label>
            <Input
              id="build-url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTouched(true);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="https://drive.google.com/..."
              aria-invalid={!isValid}
            />
            {!isValid && (
              <p className="text-xs text-destructive">
                Must be a link starting with http:// or https://
              </p>
            )}
            {currentForPlatform && currentForPlatform.url !== trimmedUrl && (
              <button
                type="button"
                onClick={() => {
                  setUrl(currentForPlatform.url);
                  setLabel(currentForPlatform.label || "");
                  setTouched(false);
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  Use current {platform} build
                  {currentForPlatform.label ? ` — ${currentForPlatform.label}` : ""}
                </span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="build-label">Version or note (optional)</Label>
            <Input
              id="build-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="1.4.2 (build 87)"
              maxLength={120}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEdit && initialBuild?.url && (
            <Button
              variant="ghost"
              onClick={() => onResolve(null)}
              className="cursor-pointer text-destructive hover:text-destructive sm:mr-auto"
            >
              Remove build
            </Button>
          )}
          <Button variant="ghost" onClick={dismiss} className="cursor-pointer">
            {isEdit ? "Cancel" : "Skip"}
          </Button>
          <Button
            onClick={submit}
            disabled={!trimmedUrl || !isValid}
            className="cursor-pointer"
          >
            {isEdit ? "Save build" : "Attach build & move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
