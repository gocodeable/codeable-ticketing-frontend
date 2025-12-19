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
  
  // Check if user exists in backend - if not, sync them (they might have been created before backend sync was implemented)
  const userExists = await checkUserExists(userCredential.user)
  if (!userExists) {
    // User exists in Firebase but not in backend - sync them
    console.log("User exists in Firebase but not in backend, syncing...")
    const syncSuccess = await syncUserWithBackend(userCredential.user, 'email')
    if (!syncSuccess) {
      // If sync fails, don't delete the user - just throw an error
      await auth.signOut()
      throw new Error("Failed to sync user account. Please try again or contact support.")
    }
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
  
  // Check if user exists in backend
  const userExists = await checkUserExists(userCredential.user)
  
  if (!userExists) {
    // User doesn't exist in backend - sync them (could be new user or existing Firebase user)
    console.log("User doesn't exist in backend, syncing...")
    const syncSuccess = await syncUserWithBackend(userCredential.user, 'google')
    if (!syncSuccess) {
      // If sync fails, don't delete the user - just throw an error
      await auth.signOut()
      throw new Error("Failed to sync user account. Please try again or contact support.")
    }
  }
  
  return userCredential.user
}

