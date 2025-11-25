import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, User } from "firebase/auth"
import { auth } from "./firebase"
import { syncUserWithBackend } from "../auth/SyncUser"


export const signup = async (email: string, password: string, username?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  if (username) {
    await updateProfile(userCredential.user, {
      displayName: username
    })
  }
  
  const syncSuccess = await syncUserWithBackend(userCredential.user)
  
  if (!syncSuccess) {
    await userCredential.user.delete()
    throw new Error("Failed to create user account. Please try again.")
  }
  
  return userCredential.user
}

export const signupWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  
  const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime
  
  if (isNewUser) {
    const syncSuccess = await syncUserWithBackend(userCredential.user)
    
    if (!syncSuccess) {
      await userCredential.user.delete()
      throw new Error("Failed to create user account. Please try again.")
    }
  }
  
  return userCredential.user
}
