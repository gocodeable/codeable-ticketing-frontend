"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { apiPatch, apiDelete } from "@/lib/api/apiClient";
import { Notification } from "@/types/notification";
import { firestore } from "@/lib/firebase/firestore";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

const NOTIFICATIONS_PER_PAGE = 8;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(NOTIFICATIONS_PER_PAGE);
  const [hasMore, setHasMore] = useState(false);

  // Set up Firestore real-time listener - fetch all but display limited
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create Firestore query for user's notifications (fetch all for real-time updates)
    const notificationsRef = collection(firestore, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(100) // Fetch up to 100 notifications
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreNotifications: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          firestoreNotifications.push({
            _id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            issueId: data.issueId || undefined,
            projectId: data.projectId || undefined,
            read: data.read || false,
            metadata: data.metadata || {},
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });

        // Update state with all Firestore data
        setNotifications(firestoreNotifications);
        
        // Check if there are more notifications to load
        setHasMore(firestoreNotifications.length > displayLimit);
        
        // Count unread
        const unread = firestoreNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to notifications:", err);
        setError("Failed to load notifications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, displayLimit]);

  // Load more notifications
  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setDisplayLimit((prev) => {
      const newLimit = prev + NOTIFICATIONS_PER_PAGE;
      setLoadingMore(false);
      return newLimit;
    });
  }, []);

  // Get notifications to display (limited by displayLimit)
  const displayedNotifications = notifications.slice(0, displayLimit);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      // Optimistically update UI first
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const idToken = await user.getIdToken();
        const response = await apiPatch(
          `/api/notifications/${notificationId}/read`,
          {},
          idToken
        );
        
        if (!response.ok) {
          throw new Error(`Failed to mark notification as read: ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to mark notification as read");
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: false } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Store original state for rollback
    const originalNotifications = notifications;
    const originalUnreadCount = unreadCount;

    // Optimistically update UI first
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const idToken = await user.getIdToken();
      const response = await apiPatch("/api/notifications/read-all", {}, idToken);
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to mark all notifications as read");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert optimistic update on error
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
    }
  }, [user, notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      // Store original state for rollback
      const originalNotifications = notifications;
      const originalUnreadCount = unreadCount;

      // Optimistically update UI first
      const notification = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const idToken = await user.getIdToken();
        const response = await apiDelete(
          `/api/notifications/${notificationId}`,
          idToken
        );

        if (!response.ok) {
          throw new Error(`Failed to delete notification: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to delete notification");
        }

        // Success - the Firestore listener will update the state automatically
        // but we've already optimistically updated it, so we're good
      } catch (err) {
        console.error("Error deleting notification:", err);
        // Revert optimistic update on error
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
        
        // Show error toast
        toast.error(err instanceof Error ? err.message : "Failed to delete notification");
      }
    },
    [user, notifications, unreadCount]
  );

  return {
    notifications: displayedNotifications,
    allNotifications: notifications,
    unreadCount,
    loading,
    loadingMore,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  };
}

