import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth"
import { auth } from "./firebase"
import { syncUserWithBackend } from "../auth/SyncUser"

// Function to sync Firebase user with backend (for Google OAuth edge case)


export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  
  const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime
  
  if (isNewUser) {
    console.log("New user detected during Google login, creating backend account")
    const syncSuccess = await syncUserWithBackend (userCredential.user)
    
    if (!syncSuccess) {
      await userCredential.user.delete()
      throw new Error("Failed to create user account. Please try again.")
    }
  }
  
  return userCredential.user
}

