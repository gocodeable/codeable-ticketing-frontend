import { User } from "firebase/auth"
import { apiPost } from "@/lib/api/apiClient"
import { isValidEmailDomain } from "../utils/emailValidation"

export async function syncUserWithBackend(firebaseUser: User, loginType: 'email' | 'google' = 'email', retries = 3): Promise<boolean> {
    // Don't sync users with invalid email domains
    if (!isValidEmailDomain(firebaseUser.email)) {
      console.log("Skipping backend sync for user with invalid email domain:", firebaseUser.email)
      return false
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Creating user in backend (attempt ${attempt}/${retries}):`, firebaseUser.uid)
        
        const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        
        const response = await apiPost("/api/user", { 
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: username,
            avatar: firebaseUser.photoURL,
            loginType: loginType,
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to create user in backend (attempt ${attempt}/${retries}):`, errorText)
          
          // If not the last attempt, wait before retrying
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          return false
        }
        
        const data = await response.json()
        if (!data.success) {
          console.error(`Backend returned success=false (attempt ${attempt}/${retries}):`, data.error)
          
          // If not the last attempt, wait before retrying
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          return false
        }
        
        console.log("User created successfully in backend")
        return true
      } catch (error) {
        console.error(`Error creating user in backend (attempt ${attempt}/${retries}):`, error)
        
        // If not the last attempt, wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        return false
      }
    }
    
    return false
  }