"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, UserCircle, Moon, Sun, Monitor, Bell, Check, X } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthProvider"
import { useTheme } from "next-themes"
import { logout } from "@/lib/firebase/logout"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Header() {
  const auth = useAuth()
  const user = auth?.user
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { state } = useSidebar()
  const { notifications, unreadCount, loading, loadingMore, hasMore, markAsRead, markAllAsRead, deleteNotification, loadMore } = useNotifications()
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [user?.photoURL])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const getInitials = (displayName: string | null | undefined, email?: string | null) => {
    if (displayName) {
      const words = displayName.trim().split(/\s+/)
      if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
      } else if (words.length === 1 && words[0].length > 0) {
        return words[0].charAt(0).toUpperCase()
      }
    }
    if (email) {
      return email.split("@")[0].charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/80 dark:bg-background/60 supports-[backdrop-filter]:bg-background/60">
      <motion.div
        className="flex h-16 items-center px-6 gap-4 max-w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SidebarTrigger className="cursor-pointer shrink-0 hover:bg-primary/10 dark:hover:bg-primary/10 rounded-lg transition-all duration-200" />

        <div
          className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${
            state === "collapsed" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-linear-to-br from-primary/90 to-primary text-primary-foreground font-bold text-sm shadow-md dark:shadow-primary/20">
            CT
          </div>
          <span className="font-bold text-base hidden sm:inline-block tracking-tight">
            Codeable Tickets
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Notifications Dropdown */}
        <DropdownMenu aria-label="Notifications">
          <DropdownMenuTrigger asChild aria-label="Notifications Toggle">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg shrink-0 hover:bg-primary/10 dark:hover:bg-primary/10 transition-all duration-200 relative group"
            >
              <Bell className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-[10px] font-bold text-white rounded-full px-1 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0 shadow-lg border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="h-8 text-xs hover:bg-primary/10 gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-[480px]">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Bell className="w-8 h-8 text-muted-foreground/50" />
                    </motion.div>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Loading...</h4>
                  <p className="text-xs text-muted-foreground text-center">
                    Fetching your notifications
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">All caught up!</h4>
                  <p className="text-xs text-muted-foreground text-center">
                    You have no notifications at the moment
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/40">
                    {notifications.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={cn(
                        "group relative px-4 py-4 hover:bg-accent/50 transition-all cursor-pointer",
                        !notification.read && "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
                      )}
                      onClick={(e) => {
                        if (notification.issueId) {
                          e.stopPropagation();
                          router.push(`/project/${notification.projectId}?issueId=${notification.issueId}`);
                        }
                      }}
                    >
                      {/* Unread indicator dot */}
                      {!notification.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}

                      <div className="flex gap-3">
                        {/* Icon based on notification type */}
                        <div className={cn(
                          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                          notification.type === 'issue_assigned' && "bg-blue-500/10 text-blue-500",
                          notification.type === 'issue_updated' && "bg-amber-500/10 text-amber-500",
                          notification.type === 'issue_comment' && "bg-green-500/10 text-green-500",
                          notification.type === 'comment_reply' && "bg-cyan-500/10 text-cyan-500",
                          notification.type === 'issue_status_changed' && "bg-purple-500/10 text-purple-500"
                        )}>
                          <Bell className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={cn(
                              "text-sm font-medium leading-tight",
                              !notification.read && "font-semibold text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            {/* Action buttons */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                  }}
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {notification.issueId && (
                              <span className="text-primary hover:underline font-medium">
                                View issue →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 border-t border-border/40">
                      <Button
                        variant="outline"
                        className="w-full hover:bg-primary/5 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMore();
                        }}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Bell className="w-4 h-4" />
                            </motion.div>
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More
                            <span className="text-xs text-muted-foreground">(+8)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg shrink-0 hover:bg-primary/10 dark:hover:bg-primary/10 transition-all duration-200 h-10 w-10"
            >
              {user?.photoURL && !imageError ? (
                <div className="relative size-8 rounded-lg overflow-hidden ring-2 ring-border/40 dark:ring-border/60">
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center size-8 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold shadow-md dark:shadow-primary/20">
                  {getInitials(user?.displayName || undefined, user?.email || undefined)}
                </div>
              )}
              <span className="sr-only">Account menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 py-1">
                {user?.photoURL && !imageError ? (
                  <div className="relative size-10 rounded-lg overflow-hidden ring-2 ring-border/40 dark:ring-border/60">
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center size-10 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                    {getInitials(user?.displayName || undefined, user?.email || undefined)}
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold leading-none mb-1">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/profile/${user?.uid}`)}
              className="cursor-pointer"
            >
              <UserCircle className="mr-2 w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value)}>
              <DropdownMenuRadioItem value="light" className="cursor-pointer">
                <Sun className="mr-2 w-4 h-4" />
                <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                <Moon className="mr-2 w-4 h-4" />
                <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="cursor-pointer">
                <Monitor className="mr-2 w-4 h-4" />
                <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </header>
  )
}
