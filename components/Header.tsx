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
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur bg-background/10 shrink-0">
      <div className="flex h-14 items-center px-4 gap-4 max-w-full">

        <SidebarTrigger className="cursor-pointer shrink-0"/>

        <div 
          className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${
            state === "collapsed" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
            CT
          </div>
          <span className="font-semibold text-lg hidden sm:inline-block">
            Codeable Tickets
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />
          {/* Notifications Dropdown */}
          <DropdownMenu aria-label="Notifications">
            <DropdownMenuTrigger asChild aria-label="Notifications Toggle">
              <Button variant="ghost" size="icon" className="rounded-full cursor-pointer shrink-0">
                <Bell className="sm:size-5 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-sm font-semibold font-sans">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm">
                <span>Notification 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm">
                <span>Notification 2</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full cursor-pointer shrink-0"
            >
              <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {getInitials(user?.email || undefined)}
              </div>
              <span className="sr-only">Account menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/profile/${user?.uid}`)}>
              <UserCircle className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value)}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 size-4" />
                <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 size-4" />
                <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 size-4" />
                <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

