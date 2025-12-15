import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, User } from "firebase/auth"
import { auth } from "./firebase"
import { syncUserWithBackend } from "../auth/SyncUser"
import { isValidEmailDomain, getEmailDomainError } from "../utils/emailValidation"


export const signup = async (email: string, password: string, username?: string) => {
  // Validate email domain before attempting signup
  if (!isValidEmailDomain(email)) {
    throw new Error(getEmailDomainError())
  }
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Double-check email after account creation (in case of edge cases)
  if (!isValidEmailDomain(userCredential.user.email)) {
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error(getEmailDomainError())
  }
  
  if (username) {
    await updateProfile(userCredential.user, {
      displayName: username
    })
  }
  
  const syncSuccess = await syncUserWithBackend(userCredential.user, 'email')
  
  if (!syncSuccess) {
    await userCredential.user.delete()
    await auth.signOut()
    throw new Error("Failed to create user account. Please try again.")
  }
  
  return userCredential.user
}

export const signupWithGoogle = async () => {
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
    // Create user in backend
    const syncSuccess = await syncUserWithBackend(userCredential.user, 'google')
    
    if (!syncSuccess) {
      await userCredential.user.delete()
      await auth.signOut()
      throw new Error("Failed to create user account. Please try again.")
    }
  } else {
    // Existing user trying to sign up - check if they exist in backend
    // If they exist, allow them (they're already registered)
    // If they don't exist, create them
    const { checkUserExists } = await import("../auth/checkUserExists")
    const userExists = await checkUserExists(userCredential.user)
    
    if (!userExists) {
      // User exists in Firebase but not in backend - create in backend
      const syncSuccess = await syncUserWithBackend(userCredential.user, 'google')
      
      if (!syncSuccess) {
        await userCredential.user.delete()
        await auth.signOut()
        throw new Error("Failed to create user account. Please try again.")
      }
    }
  }
  
  return userCredential.user
}
