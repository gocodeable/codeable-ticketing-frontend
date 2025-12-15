import { useAuth } from "@/lib/auth/AuthProvider"
import { Sparkles } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function GreetUser() {
  const auth = useAuth()
  const user = auth?.user
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div className="relative w-full overflow-hidden bg-card dark:bg-card/50 rounded-2xl border border-border/40 shadow-lg dark:shadow-xl">
      {/* Modern gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:to-accent/10" />

      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl opacity-30" />

      {/* Logo decoration - skewed and cut from corners */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-80 h-80 opacity-30 dark:opacity-20 pointer-events-none">
        <div 
          className="relative w-full h-full transform rotate-12 skew-y-3 scale-110"
          style={{
            maskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
          }}
        >
          <Image
            src={mounted && theme === "dark" ? "/logo-white.svg" : "/logo-blue.svg"}
            alt=""
            width={320}
            height={320}
            className="w-full h-full object-contain"
          />
          {/* Soft fade overlay on right edge */}
          <div className="absolute inset-0 bg-linear-to-l from-card/60 via-card/20 to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="relative p-5 md:p-6 lg:p-7">
        <div className="flex flex-col gap-3">
          {/* Date badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 w-fit backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary dark:text-primary/90" />
            <span className="text-xs font-semibold text-primary dark:text-primary/90 tracking-wide">{displayDate}</span>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {greeting},{" "}
              <span className="bg-linear-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl">
              Ready to tackle your tasks and make today productive?
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
