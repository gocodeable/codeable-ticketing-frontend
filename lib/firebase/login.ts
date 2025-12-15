import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth"
import { auth } from "./firebase"
import { syncUserWithBackend } from "../auth/SyncUser"
import { isValidEmailDomain, getEmailDomainError } from "../utils/emailValidation"
import { checkUserExists } from "../auth/checkUserExists"

// Function to sync Firebase user with backend (for Google OAuth edge case)


export const login = async (email: string, password: string) => {
  // Validate email domain before attempting login
  if (!isValidEmailDomain(email)) {
    throw new Error(getEmailDomainError())
  }
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Double-check email after authentication (in case of edge cases)
  if (!isValidEmailDomain(userCredential.user.email)) {
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error(getEmailDomainError())
  }
  
  // Check if user exists in backend - if not, delete account and throw error
  const userExists = await checkUserExists(userCredential.user)
  if (!userExists) {
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error("User account not found. Please contact support.")
  }
  
  return userCredential.user
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  
  // Validate email domain - delete account if invalid
  if (!isValidEmailDomain(userCredential.user.email)) {
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error(getEmailDomainError())
  }
  
  const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime
  
  if (isNewUser) {
    // New user during Google login - don't allow, they should use signup
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error("New users must sign up first. Please use the sign up option.")
  } else {
    // Existing user - check if they exist in backend
    const userExists = await checkUserExists(userCredential.user)
    if (!userExists) {
      await userCredential.user.delete()
      await auth.signOut()
      throw new Error("User account not found. Please contact support.")
    }
  }
  
  return userCredential.user
}

