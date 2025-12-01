/**
 * Utility functions for issue-related operations
 */

export const getTypeColor = (type?: string): string => {
  switch (type) {
    case "bug":
      return "bg-red-500";
    case "story":
      return "bg-green-500";
    case "epic":
      return "bg-purple-500";
    default:
      return "bg-blue-500";
  }
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

