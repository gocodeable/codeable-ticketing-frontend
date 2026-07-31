"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { apiGet, apiPost, apiDelete } from "@/lib/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Grant {
  id: string;
  email: string;
  feature: string;
  grantedBy: string;
  grantedAt: string;
  user: { uid: string; name: string; avatar?: string } | null;
}

export default function FeatureAccessPage() {
  const { user } = useAuth();
  const { isFeatureAdmin, loading: featuresLoading } = useFeatures();

  const [admins, setAdmins] = useState<string[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadGrants = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await apiGet("/api/features/grants", idToken);
      const data = await response.json();
      if (data.success && data.data) {
        setAdmins(data.data.admins || []);
        setGrants(data.data.grants || []);
      }
    } catch (error) {
      console.error("Error loading grants:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFeatureAdmin) loadGrants();
  }, [isFeatureAdmin, loadGrants]);

  const handleGrant = async () => {
    if (!user || !email.trim()) return;
    setGranting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await apiPost("/api/features/grants", { email: email.trim() }, idToken);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Grant failed");
      toast.success(`${email.trim()} can now generate tickets`);
      setEmail("");
      loadGrants();
    } catch (error: any) {
      toast.error(error?.message || "Failed to grant access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (grant: Grant) => {
    if (!user) return;
    setRevokingId(grant.id);
    try {
      const idToken = await user.getIdToken();
      const response = await apiDelete(`/api/features/grants/${grant.id}`, idToken);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Revoke failed");
      toast.success(`Access removed for ${grant.email}`);
      setGrants((prev) => prev.filter((g) => g.id !== grant.id));
    } catch (error: any) {
      toast.error(error?.message || "Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  if (featuresLoading || (isFeatureAdmin && loading)) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-72 mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </main>
    );
  }

  if (!isFeatureAdmin) {
    return (
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Admins only</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Feature access is managed by workspace admins.
        </p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </span>
          Feature Access
        </h1>
        <p className="text-muted-foreground mt-2">
          Control who sees “Generate Tickets” in the sidebar. Velocity stats stay admin-only and
          can’t be granted.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6 mb-6"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Admins · full access
        </h2>
        <div className="flex flex-wrap gap-2">
          {admins.map((adminEmail) => (
            <Badge key={adminEmail} variant="outline" className="gap-1.5 py-1.5 px-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {adminEmail}
            </Badge>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full bg-card rounded-xl border border-border/50 shadow-sm p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Ticket generation access
        </h2>

        <div className="flex gap-2 mb-5">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGrant()}
            placeholder="teammate@gocodeable.com"
            type="email"
            className="max-w-sm"
          />
          <Button onClick={handleGrant} disabled={granting || !email.includes("@")} className="gap-2">
            {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Grant access
          </Button>
        </div>

        {grants.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium">No one has been granted access yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a teammate’s email above — they’ll see “Generate Tickets” next time they load the app.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {grants.map((grant) => (
              <div key={grant.id} className="py-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={grant.user?.avatar || "/user.jpg"} />
                  <AvatarFallback>{(grant.user?.name || grant.email)[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{grant.user?.name || grant.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {grant.email} · granted by {grant.grantedBy}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(grant)}
                  disabled={revokingId === grant.id}
                  className="text-muted-foreground hover:text-red-500 gap-1.5"
                >
                  {revokingId === grant.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </main>
  );
}
