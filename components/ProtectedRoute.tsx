"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthProvider"
import { AuthPageSpinner } from "./AuthPageSpinner"
import Loader from "./Loader"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authOperationInProgress } = useAuth()
  const router = useRouter()
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    if (!loading && !user && !authOperationInProgress) {
      router.push("/auth")
    }
  }, [user, loading, authOperationInProgress, router])

  useEffect(() => {
    if (!loading && !authOperationInProgress && user) {
      // Delay hiding loader to allow content to render first
      const timer = setTimeout(() => {
        setShowLoader(false)
      }, 200)
      return () => clearTimeout(timer)
    } else if (loading || authOperationInProgress) {
      setShowLoader(true)
    }
  }, [loading, authOperationInProgress, user])

  const isLoading = loading || authOperationInProgress

  return (
    <div className="relative min-h-screen bg-background">
      {/* Content - always rendered but may be hidden */}
      {user && (
        <div 
          className={`transition-opacity duration-300 ${
            showLoader ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {children}
        </div>
      )}

      {/* Loader overlay - fades out smoothly */}
      {(isLoading || showLoader) && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-background z-50 transition-opacity duration-300 ${
            showLoader && !isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="text-center">
            {authOperationInProgress ? <AuthPageSpinner /> : <Loader size="md" hue={300} />}
          </div>
        </div>
      )}

      {!user && !isLoading && null}
    </div>
  )
}

