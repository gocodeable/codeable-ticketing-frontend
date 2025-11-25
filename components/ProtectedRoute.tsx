"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthProvider"
import { AuthPageSpinner } from "./AuthPageSpinner"
import Loader from "./Loader"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authOperationInProgress } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && !authOperationInProgress) {
      router.push("/auth")
    }
  }, [user, loading, authOperationInProgress, router])

  if (loading || authOperationInProgress) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {authOperationInProgress ? <AuthPageSpinner /> : <Loader size="md" hue={300} />}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

