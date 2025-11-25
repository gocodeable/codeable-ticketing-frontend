import { User } from "firebase/auth";
import { apiPatch } from "@/lib/api/apiClient";

/**
 * Updates the user's last sign-in time in the backend
 * This will update the user's updatedAt field
 * @param firebaseUser - The authenticated Firebase user
 * @returns Promise<boolean> - Returns true if successful, false otherwise
 */
export async function updateLastSignIn(firebaseUser: User): Promise<boolean> {
  try {
    const idToken = await firebaseUser.getIdToken();
    
    const response = await apiPatch("/api/user/", undefined, idToken);

    if (!response.ok) {
      console.error("Failed to update last sign-in:", await response.text());
      return false;
    }

    const data = await response.json();
    if (!data.success) {
      console.error("Backend returned success=false:", data.error);
      return false;
    }

    console.log("Last sign-in updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating last sign-in:", error);
    return false;
  }
}

