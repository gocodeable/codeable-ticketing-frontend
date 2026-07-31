/**
 * Answers to the Generate Tickets questionnaire. Mirrors the backend's
 * ProjectContext (src/services/srsContext.ts) — every field changes which
 * epics/tickets get generated, so keep the two in sync.
 */
export interface DashboardSpec {
  name: string;
  audience: string;
}

export interface ProjectContext {
  surfaces?: string[];
  dashboards?: DashboardSpec[];
  mobileFramework?: "flutter" | "react_native" | "native" | "none";

  backendApproach?: "none_baas" | "custom" | "hybrid";
  baasProvider?: string;
  backendStack?: string;
  database?: string;
  auth?: string;
  realtime?: string[];
  fileStorage?: boolean;

  integrations?: string[];
  integrationsOther?: string;

  projectStage?: "greenfield" | "existing";
  mvpScope?: string;
  timeline?: string;
  teamSize?: number;
  compliance?: string[];
  nonFunctional?: string[];

  granularity?: "coarse" | "balanced" | "fine";
  splitAbovePoints?: number;
  includeQaTickets?: boolean;
  includeDevOpsTickets?: boolean;
  designsReady?: boolean;
}

export const SURFACES: { value: string; label: string }[] = [
  { value: "ios", label: "iOS app" },
  { value: "android", label: "Android app" },
  { value: "cross_platform_mobile", label: "Cross-platform mobile" },
  { value: "web_app", label: "Customer web app" },
  { value: "admin_dashboard", label: "Admin dashboard" },
  { value: "ops_dashboard", label: "Internal / ops dashboard" },
  { value: "partner_portal", label: "Partner / vendor portal" },
  { value: "marketing_site", label: "Marketing site" },
  { value: "api_only", label: "API only" },
  { value: "desktop", label: "Desktop app" },
];

export const MOBILE_SURFACES = ["ios", "android", "cross_platform_mobile"];

export const MOBILE_FRAMEWORKS = [
  { value: "flutter", label: "Flutter" },
  { value: "react_native", label: "React Native" },
  { value: "native", label: "Native (Swift + Kotlin)" },
];

export const BACKEND_APPROACHES = [
  { value: "none_baas", label: "No custom backend (Firebase / Supabase)" },
  { value: "custom", label: "Custom backend service" },
  { value: "hybrid", label: "Hybrid (BaaS + custom service)" },
];

export const BACKEND_STACKS = [
  "Node + Express",
  "NestJS",
  "Django",
  "FastAPI",
  "Laravel",
  "Spring Boot",
  "Go",
  "Ruby on Rails",
  ".NET",
];

export const DATABASES = ["Firestore", "PostgreSQL", "MongoDB", "MySQL", "Supabase", "Undecided"];

export const AUTH_OPTIONS = [
  "Firebase Auth",
  "Auth0",
  "Custom JWT",
  "Social OAuth (Google/Apple)",
  "SSO / SAML",
  "None",
];

export const REALTIME = [
  { value: "push_notifications", label: "Push notifications" },
  { value: "live_updates", label: "Live updates (websockets)" },
];

export const INTEGRATIONS = [
  { value: "payments", label: "Payments" },
  { value: "maps", label: "Maps / geolocation" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "analytics", label: "Analytics" },
  { value: "crash_reporting", label: "Crash reporting" },
  { value: "social_login", label: "Social login" },
  { value: "video", label: "Video" },
  { value: "calendar", label: "Calendar" },
  { value: "ai_llm", label: "AI / LLM" },
  { value: "erp_crm", label: "ERP / CRM" },
];

export const COMPLIANCE = [
  { value: "pci_dss", label: "PCI-DSS" },
  { value: "hipaa", label: "HIPAA" },
  { value: "gdpr", label: "GDPR" },
  { value: "soc2", label: "SOC 2" },
];

export const NON_FUNCTIONAL = [
  { value: "offline", label: "Offline support" },
  { value: "i18n", label: "Multi-language" },
  { value: "accessibility", label: "Accessibility (WCAG)" },
  { value: "performance", label: "Performance / scale" },
];

export const GRANULARITY = [
  { value: "coarse", label: "Coarse — fewer, bigger tickets" },
  { value: "balanced", label: "Balanced — 1–3 days each" },
  { value: "fine", label: "Fine — many small tickets" },
];

/** Sensible starting point so the form isn't a wall of empty inputs. */
export const DEFAULT_CONTEXT: ProjectContext = {
  granularity: "balanced",
  splitAbovePoints: 8,
  includeQaTickets: true,
  includeDevOpsTickets: true,
  designsReady: false,
  projectStage: "greenfield",
};

export const hasMobileSurface = (ctx: ProjectContext): boolean =>
  (ctx.surfaces || []).some((s) => MOBILE_SURFACES.includes(s));
