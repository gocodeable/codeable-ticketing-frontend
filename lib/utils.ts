import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a cache-busted avatar URL so browsers show the latest image after profile updates.
 * Use updatedAt (user document timestamp) when available so avatar changes invalidate cache.
 */
export function getAvatarUrl(avatar?: string | null, updatedAt?: string | Date | null): string {
  if (!avatar) return "";
  if (!updatedAt) return avatar;
  try {
    const ts = typeof updatedAt === "string" ? new Date(updatedAt).getTime() : updatedAt.getTime();
    const sep = avatar.includes("?") ? "&" : "?";
    return `${avatar}${sep}v=${ts}`;
  } catch {
    return avatar;
  }
}
