/**
 * Utility functions for member role operations
 */

import { MemberRole } from "@/types/project";

/**
 * Get the color class for a member role
 * @param role - The member role
 * @returns Tailwind CSS color class
 */
export const getRoleColor = (role?: MemberRole | string | null): string => {
  if (!role || role === "unassigned") {
    return "bg-gray-500";
  }
  
  switch (role) {
    case "backend":
      return "bg-purple-500";
    case "frontend":
      return "bg-blue-500";
    case "ui":
      return "bg-pink-500";
    case "qa":
      return "bg-green-500";
    case "pm":
      return "bg-indigo-500";
    case "admin":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Get the display label for a member role
 * @param role - The member role
 * @returns Formatted role label
 */
export const getRoleLabel = (role?: MemberRole | string | null): string => {
  if (!role || role === "unassigned") {
    return "Unassigned";
  }
  
  switch (role) {
    case "backend":
      return "Backend";
    case "frontend":
      return "Frontend";
    case "ui":
      return "UI";
    case "qa":
      return "QA";
    case "pm":
      return "PM";
    case "admin":
      return "Admin";
    default:
      return "Unassigned";
  }
};

/**
 * Check if a role has admin-level permissions (admin or PM)
 * @param role - The member role
 * @returns true if the role has admin permissions
 */
export const hasAdminPermissions = (role?: MemberRole | string | null): boolean => {
  return role === "admin" || role === "pm";
};
