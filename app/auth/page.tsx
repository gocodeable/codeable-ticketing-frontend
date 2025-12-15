"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ModeToggle } from "@/components/ThemeToggle";
import { AuthPageSpinner } from "@/components/AuthPageSpinner";
import Image from "next/image";

export default function AuthPage() {
  const { user, loading, error, authOperationInProgress } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!loading && user && !authOperationInProgress) {
      router.push("/");
    }
  }, [user, loading, authOperationInProgress, router]);

  // Only show spinner for initial auth state check, not during login/signup operations
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <AuthPageSpinner />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Side - Brand & Visual */}
      <div className="relative hidden lg:flex flex-col justify-between bg-linear-to-br from-[#0e0926] via-[#160e3e] to-[#1a1242] p-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-tr from-cyan-500/10 via-transparent to-blue-500/10" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(175,255,254,0.08)_0%,transparent_50%)] animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/codeable-white.svg"
                alt="Codeable"
                width={120}
                height={24}
                className="h-6 w-auto object-contain"
              />
              <span className="text-xl font-sans font-bold leading-none tracking-tight mt-1">Tickets</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl text-white">
            Manage tasks with clarity and precision
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Streamline your workflow, collaborate seamlessly with your team, and
            ship projects faster than ever.
          </p>

          <div className="flex flex-col gap-4 pt-8">
            <div className="flex items-start gap-3 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#affffe]/15 border border-[#affffe]/25 mt-0.5 group-hover:bg-[#affffe]/25 transition-all duration-300 shadow-[0_0_15px_rgba(175,255,254,0.1)]">
                <svg
                  className="h-4 w-4 text-[#affffe]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">
                  Real-time collaboration
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Work together seamlessly with your team in real-time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#affffe]/15 border border-[#affffe]/25 mt-0.5 group-hover:bg-[#affffe]/25 transition-all duration-300 shadow-[0_0_15px_rgba(175,255,254,0.1)]">
                <svg
                  className="h-4 w-4 text-[#affffe]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Powerful automation</h3>
                <p className="text-sm text-white/60 mt-1">
                  Automate repetitive tasks and focus on what matters
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#affffe]/15 border border-[#affffe]/25 mt-0.5 group-hover:bg-[#affffe]/25 transition-all duration-300 shadow-[0_0_15px_rgba(175,255,254,0.1)]">
                <svg
                  className="h-4 w-4 text-[#affffe]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">Insightful analytics</h3>
                <p className="text-sm text-white/60 mt-1">
                  Track progress and make data-driven decisions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-sm text-white/40">
          <span>© 2024 Codeable</span>
          <a href="#" className="hover:text-white/80 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white/80 transition-colors">
            Terms
          </a>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="relative flex items-center justify-center p-8 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(175,255,254,0.03)_0%,transparent_50%)]" />
        <div className="absolute top-6 right-6 z-20">
          <ModeToggle />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-accent/10 border border-primary/30 shadow-lg">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold">Codeable Tickets</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Enter your details to get started"
                : "Enter your credentials to access your account"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!isSignUp ? <LoginForm /> : <SignUpForm />}

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp
                ? "Already have an account? "
                : "Don't have an account? "}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-primary hover:text-primary/80 dark:hover:text-primary/90 hover:underline transition-colors"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
