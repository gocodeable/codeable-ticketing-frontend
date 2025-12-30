import { User } from "firebase/auth"
import { apiPost } from "@/lib/api/apiClient"
import { isValidEmailDomain } from "../utils/emailValidation"

/**
 * Replaces s96-c (96px) with s500-c (500px) for better image quality
 */
function upgradeGooglePhotoURL(photoURL: string | null): string | null {
  if (!photoURL) return photoURL
  
  // Check if it's a Google photo URL and contains the size parameter
  if (photoURL.includes('googleusercontent.com') && photoURL.includes('=s96-c')) {
    return photoURL.replace('=s96-c', '=s500-c')
  }
  
  return photoURL
}

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
        
        // Upgrade Google photo URL to higher quality
        const avatarURL = loginType === 'google' 
          ? upgradeGooglePhotoURL(firebaseUser.photoURL)
          : firebaseUser.photoURL
        
        const response = await apiPost("/api/user", { 
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: username,
            avatar: avatarURL,
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
        
        // Read response body only once
        const responseText = await response.text()
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`Failed to parse response (attempt ${attempt}/${retries}):`, parseError)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          return false
        }
        
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