"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiGet } from "@/lib/api/apiClient";

export interface FeatureState {
  /** Feature keys the signed-in user holds (e.g. "srs_generation"). */
  features: string[];
  /** True for the feature-admin allowlist (velocity + grant management). */
  isFeatureAdmin: boolean;
  loading: boolean;
}

export const FEATURE_SRS = "srs_generation";
export const FEATURE_VELOCITY = "velocity_stats";

/**
 * Resolves which gated ticketing features the signed-in user can see.
 * Drives the sidebar entries and page-level guards for Generate Tickets,
 * Velocity, and Feature Access.
 */
export function useFeatures(): FeatureState {
  const { user } = useAuth();
  const [state, setState] = useState<FeatureState>({
    features: [],
    isFeatureAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setState({ features: [], isFeatureAdmin: false, loading: false });
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const response = await apiGet("/api/features/me", idToken);
        const data = await response.json();
        if (cancelled) return;
        if (data.success && data.data) {
          setState({
            features: data.data.features || [],
            isFeatureAdmin: !!data.data.isFeatureAdmin,
            loading: false,
          });
        } else {
          setState({ features: [], isFeatureAdmin: false, loading: false });
        }
      } catch (error) {
        console.error("Error resolving features:", error);
        if (!cancelled) setState({ features: [], isFeatureAdmin: false, loading: false });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}
