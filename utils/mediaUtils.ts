/**
 * Check if a file is an image based on its extension
 */
export function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff'];
  const lowerFileName = fileName.toLowerCase();
  return imageExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Check if a file is a video based on its extension
 */
export function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mpeg', '.mpg', '.mkv', '.flv', '.wmv'];
  const lowerFileName = fileName.toLowerCase();
  return videoExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Check if a file is a media file (image or video)
 */
export function isMediaFile(fileName: string): boolean {
  return isImageFile(fileName) || isVideoFile(fileName);
}

