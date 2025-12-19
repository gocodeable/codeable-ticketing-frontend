"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ModeToggle } from "@/components/ThemeToggle";
import { AuthPageSpinner } from "@/components/AuthPageSpinner";
import Image from "next/image";
import { isValidEmailDomain } from "@/lib/utils/emailValidation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { checkUserExists } from "@/lib/auth/checkUserExists";

export default function AuthPage() {
  const { user, loading, error, authOperationInProgress } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!loading && user && !authOperationInProgress) {
      // Validate email domain before allowing navigation
      if (!isValidEmailDomain(user.email)) {
        // Sign out and delete account if email is invalid
        signOut(auth).then(() => {
          user.delete().catch((err) => {
            console.error("Error deleting user account:", err);
          });
        }).catch((err) => {
          console.error("Error signing out:", err);
        });
        return;
      }
      
      // Check if this is a fresh signup/login (user created or signed in less than 10 seconds ago)
      // For fresh signups/logins, we trust that syncUserWithBackend succeeded and navigate directly
      // For existing sessions, we verify the user exists in backend
      const userCreationTime = user.metadata.creationTime 
        ? new Date(user.metadata.creationTime).getTime() 
        : 0;
      const lastSignInTime = user.metadata.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).getTime()
        : 0;
      const now = Date.now();
      const timeSinceCreation = userCreationTime > 0 ? now - userCreationTime : Infinity;
      const timeSinceLastSignIn = lastSignInTime > 0 ? now - lastSignInTime : Infinity;
      
      // Consider it fresh if user was created or signed in recently (less than 10 seconds ago)
      const isFreshSignup = timeSinceCreation < 10000;
      const isRecentLogin = timeSinceLastSignIn < 10000;
      const isFreshAuth = isFreshSignup || isRecentLogin;
      
      if (isFreshAuth) {
        // Fresh signup/login - syncUserWithBackend already verified creation/sync
        // Add a small delay to ensure backend processing is complete, then navigate
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        // Existing session - verify user exists in backend before navigating
        const checkUserWithRetry = async (retries = 2, delay = 1000) => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              const exists = await checkUserExists(user);
              if (exists) {
                // User exists in backend, allow navigation
                router.push("/");
                return;
              }
              
              // If this is not the last attempt, wait before retrying
              if (attempt < retries) {
                console.log(`User not found in backend, retrying... (attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
              } else {
                // After all retries failed, sign out but don't delete (user might exist but check failed)
                console.error("User doesn't exist in backend after retries, signing out");
                signOut(auth).catch((err) => {
                  console.error("Error signing out:", err);
                });
              }
            } catch (err) {
              console.error(`Error checking user existence (attempt ${attempt}/${retries}):`, err);
              if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
              } else {
                // On final error, just sign out
                signOut(auth).catch((signOutErr) => {
                  console.error("Error signing out:", signOutErr);
                });
              }
            }
          }
        };
        
        // Add initial delay to give backend time to process
        setTimeout(() => {
          checkUserWithRetry();
        }, 500);
      }
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
            <div className="flex items-center">
              <Image
                src="/codeable-white.svg"
                alt="Codeable"
                width={120}
                height={24}
                className="h-6 w-auto object-contain"
              />
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
        </div>

        {/* Logo decoration - bottom right */}
        <div className="absolute -bottom-10 right-0 w-96 h-96 opacity-30 dark:opacity-20 pointer-events-none">
          <div 
            className="relative w-full h-full transform -rotate-15 -skew-y-1.5 -skew-x-1.5 scale-150"
            style={{
              maskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
            }}
          >
            <Image
              src="/logo-white.svg"
              alt=""
              width={320}
              height={320}
              className="w-full h-full object-contain"
            />
            {/* Soft fade overlay on right edge */}
            <div className="absolute inset-0 bg-linear-to-l from-[#0e0926]/60 via-[#0e0926]/20 to-transparent pointer-events-none" />
          </div>
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
