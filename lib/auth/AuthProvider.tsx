"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react"
import { User, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { updateLastSignIn } from "./updateLastSignIn"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  authOperationInProgress: boolean
  setAuthOperationInProgress: (inProgress: boolean) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  authOperationInProgress: false,
  setAuthOperationInProgress: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authOperationInProgress, setAuthOperationInProgress] = useState(false)
  const lastSyncedUid = useRef<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setError(null)
        
        if (lastSyncedUid.current !== firebaseUser.uid && !authOperationInProgress) {
          lastSyncedUid.current = firebaseUser.uid
          updateLastSignIn(firebaseUser).catch(err => {
            console.error("Failed to update last sign-in:", err)
          })
        }
      } else {
        setUser(null)
        setError(null)
        lastSyncedUid.current = null
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [authOperationInProgress])

  useEffect(() => {
    if (!authOperationInProgress && user && lastSyncedUid.current !== user.uid) {
      lastSyncedUid.current = user.uid
      updateLastSignIn(user).catch(err => {
        console.error("Failed to update last sign-in after auth operation:", err)
      })
    }
  }, [authOperationInProgress, user])

  return (
    <AuthContext.Provider value={{ user, loading, error, authOperationInProgress, setAuthOperationInProgress }}>
      {children}
    </AuthContext.Provider>
  )
}

