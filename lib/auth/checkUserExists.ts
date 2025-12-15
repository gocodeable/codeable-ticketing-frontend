import { User } from "firebase/auth";
import { apiGet } from "@/lib/api/apiClient";

/**
 * Check if a user exists in the backend database
 * @param firebaseUser - The authenticated Firebase user
 * @returns Promise<boolean> - Returns true if user exists, false otherwise
 */
export async function checkUserExists(firebaseUser: User): Promise<boolean> {
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await apiGet(`/api/user?uid=${firebaseUser.uid}`, idToken);

    if (!response.ok) {
      // If 404, user doesn't exist
      if (response.status === 404) {
        return false;
      }
      // For other errors, assume user doesn't exist to be safe
      return false;
    }

    const data = await response.json();
    return data.success === true && data.data !== null && data.data !== undefined;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}

