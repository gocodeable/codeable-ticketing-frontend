import { User } from "firebase/auth"
import { apiPost, apiGet, apiPut } from "@/lib/api/apiClient"
import { isValidEmailDomain } from "../utils/emailValidation"

/**
 * Replaces any size parameter (e.g., s96-c, s128-c, etc.) with s500-c (500px) for better image quality
 * Only upgrades if the URL is NOT already 500px
 */
function upgradeGooglePhotoURL(photoURL: string | null): string | null {
  if (!photoURL) return photoURL
  
  if (photoURL.includes('googleusercontent.com')) {
    if (photoURL.includes('=s500-c')) {
      return photoURL
    }

    const sizePattern = /=s\d+-c/
    if (sizePattern.test(photoURL)) {
      // Replace any size parameter with s500-c
      return photoURL.replace(/=s\d+-c/, '=s500-c')
    }
    
    return photoURL
  }
  
  return photoURL
}

/**
 * Checks and upgrades user's avatar to 500px if it's a Google photo URL that's not already 500px
 * This is called on login to ensure all users have high-quality profile images
 */
export async function checkAndUpgradeUserAvatar(firebaseUser: User): Promise<void> {
  try {
    // Only check for Google login users with a photo URL
    if (!firebaseUser.photoURL || !firebaseUser.photoURL.includes('googleusercontent.com')) {
      return
    }

    const idToken = await firebaseUser.getIdToken()
    
    // Get current user data from backend
    const response = await apiGet(`/api/user?uid=${firebaseUser.uid}`, idToken)
    
    if (!response.ok) {
      console.log("Could not fetch user data to check avatar, skipping upgrade")
      return
    }

    const data = await response.json()
    if (!data.success || !data.data) {
      console.log("User data not found, skipping avatar upgrade")
      return
    }

    const currentAvatar = data.data.avatar
    
    // Check if current avatar in backend is already 500px
    if (currentAvatar && currentAvatar.includes('googleusercontent.com') && currentAvatar.includes('=s500-c')) {
      return
    }

    const upgradedAvatar = upgradeGooglePhotoURL(firebaseUser.photoURL)

    if (upgradedAvatar && upgradedAvatar !== currentAvatar) {
      console.log("Upgrading user avatar to 500px")
      const updateResponse = await apiPut(
        '/api/user',
        { avatar: upgradedAvatar },
        idToken
      )

      if (updateResponse.ok) {
        console.log("User avatar upgraded successfully")
      } else {
        console.error("Failed to upgrade user avatar")
      }
    }
  } catch (error) {
    console.error("Error checking/upgrading user avatar:", error)
  }
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