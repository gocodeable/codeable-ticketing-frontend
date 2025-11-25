import { useAuth } from "@/lib/auth/AuthProvider"
import { Sparkles } from "lucide-react"

export function GreetUser() {
  const auth = useAuth()
  const user = auth?.user
  if (!user) {
    return null
  }
  const displayName = user.displayName || user.email?.split("@")[0] || "User"
  const today = new Date()
  const weekday = today.toLocaleDateString("en-US", { weekday: "long" })
  const day = today.getDate()
  const month = today.toLocaleDateString("en-US", { month: "long" })
  const displayDate = `${weekday}, ${month} ${day}`

  // Get time-based greeting
  const hour = today.getHours()
  let greeting = "Good evening"
  if (hour < 12) greeting = "Good morning"
  else if (hour < 18) greeting = "Good afternoon"

  return (
    <div className="select-none w-full relative overflow-hidden bg-linear-to-r from-primary via-primary/90 to-primary/70 dark:from-primary/95 dark:via-primary/85 dark:to-primary/75 rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg dark:shadow-xl border border-primary/20">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />

      <div className="relative flex flex-col gap-y-2 sm:gap-y-3">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="text-sm sm:text-base font-medium tracking-wide">{displayDate}</p>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
          {greeting}, <span className="bg-linear-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text">{displayName}</span>
        </h1>
        <p className="text-sm sm:text-base text-primary-foreground/70 font-medium mt-1">
          Ready to tackle your tasks today?
        </p>
      </div>
    </div>
  )
}