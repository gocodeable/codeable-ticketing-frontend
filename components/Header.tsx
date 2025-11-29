"use client"

import { useRouter } from "next/navigation"
import { LogOut, UserCircle, Moon, Sun, Monitor, Bell } from "lucide-react"
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

export function Header() {
  const auth = useAuth()
  const user = auth?.user
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { state } = useSidebar()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U"
    const parts = email.split("@")[0]
    return parts.charAt(0).toUpperCase()
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
              className="rounded-lg shrink-0 hover:bg-primary/10 dark:hover:bg-primary/10 transition-all duration-200 relative"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-sm font-semibold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No new notifications</p>
            </div>
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
              <div className="flex items-center justify-center size-8 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold shadow-md dark:shadow-primary/20">
                {getInitials(user?.email || undefined)}
              </div>
              <span className="sr-only">Account menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 py-1">
                <div className="flex items-center justify-center size-10 rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                  {getInitials(user?.email || undefined)}
                </div>
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
