import { useAuth } from "@/lib/auth/AuthProvider"

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
  const displayDate = `${weekday} ${day} ${month}`
  return (
    <div className="select-none w-full mx-auto max-w-4xl flex flex-col gap-y-3 sm:gap-y-4 md:gap-y-5 justify-center bg-gradient-to-r from-primary to-primary/40 dark:from-primary/90 dark:to-primary/40 rounded-lg p-4 sm:p-5 md:p-6 lg:p-8 shadow-sm dark:shadow-md">
      <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-primary-foreground/90 dark:text-primary-foreground">{displayDate}</p>
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-primary-foreground">Hello, {displayName}</h1>
    </div>
  )
}