/**
 * Upload any media file to Firebase Storage via backend API
 * @param file - The file to upload (image, document, video, etc.)
 * @param folder - The folder path in storage (default: 'uploads')
 * @param idToken - The user's Firebase ID token for authentication
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadMediaToStorage = async (
  file: File,
  folder: string = "uploads",
  idToken: string
): Promise<string> => {
  try {
    // Convert file to base64
    const base64File = await fileToBase64(file);

    // Upload via Next.js API route
    const response = await fetch(
      "/api/media/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          file: base64File,
          folder,
        }),
      }
    );

    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use status text
      throw new Error(`Upload failed: ${response.statusText || "Unknown error"}`);
    }

    if (!response.ok) {
      console.error("Upload error response:", errorData);
      throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
    }

    if (!errorData.success) {
      console.error("Upload failed:", errorData);
      throw new Error(errorData.error || "Failed to upload file");
    }

    if (!errorData.data?.url) {
      throw new Error("Upload succeeded but no URL returned");
    }

    return errorData.data.url;
  } catch (error) {
    console.error("Error uploading file:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    throw new Error(errorMessage);
  }
};

/**
 * Legacy function for backwards compatibility
 * @deprecated Use uploadMediaToStorage instead
 */
export const uploadImageToStorage = uploadMediaToStorage;

/**
 * Helper function to convert File to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - The base64 encoded string with data URI prefix
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

