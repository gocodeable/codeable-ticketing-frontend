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
      <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
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
    <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-primary/10 to-gray-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-primary text-3xl font-bold tracking-tight">
            Codeable Tickets
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your tickets and projects efficiently
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

