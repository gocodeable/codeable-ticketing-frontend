"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/LoginForm"
import { SignUpForm } from "@/components/SignUpForm"
import { useAuth } from "@/lib/auth/AuthProvider"
import { ModeToggle } from "@/components/ThemeToggle"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AuthPageSpinner } from "@/components/AuthPageSpinner"

export default function AuthPage() {
  const { user, loading, error, authOperationInProgress } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !authOperationInProgress) {
      router.push("/")
    }
  }, [user, loading, authOperationInProgress, router])

  if (loading || authOperationInProgress) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-primary/5 via-background to-primary/5">
        <div className="absolute top-6 right-6">
          <ModeToggle />
        </div>
        <div className="flex flex-col items-center gap-4">
          {authOperationInProgress && (
           <AuthPageSpinner />
          )}
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-primary/5 via-background to-primary/5 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="absolute top-6 right-6 z-10">
        <ModeToggle />
      </div>

      <div className="relative z-10 w-full max-w-[480px] space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-2">
            <svg
              className="w-7 h-7 text-primary"
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            Codeable Tickets
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Streamline your workflow with intelligent task management and team collaboration
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5 ring-1 ring-border/50">
          {error && (
            <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2 p-1">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:shadow-sm">
                Log In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <LoginForm />
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

