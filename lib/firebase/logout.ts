import { signOut } from "firebase/auth"
import { auth } from "./firebase"

export async function logout() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

