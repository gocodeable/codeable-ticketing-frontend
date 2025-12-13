import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";

/**
 * Verify if email exists in Firebase Auth
 * @param email - User's email address
 * @returns true if email exists, false otherwise
 */
const verifyEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch("/api/password-reset/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data.success && data.exists === true;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
};

/**
 * Send password reset email to user
 * @param email - User's email address
 * @throws Error if email doesn't exist or other Firebase error
 */
export const sendPasswordResetEmailToUser = async (email: string): Promise<void> => {
  // Verify email exists first
  const emailExists = await verifyEmailExists(email);
  
  if (!emailExists) {
    throw new Error("No account found with this email address.");
  }

  // Firebase will automatically send password reset email
  // User will reset password on Firebase's page, then redirect to auth page
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/auth`,
    handleCodeInApp: false,
  });
};
