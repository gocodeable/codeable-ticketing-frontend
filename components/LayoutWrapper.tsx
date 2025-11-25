"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SideBar } from "@/components/SideBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-full w-full overflow-hidden bg-linear-to-t from-primary/10 to-white dark:from-primary/10 dark:to-background">
        <SideBar />
        <SidebarInset className="flex-1 overflow-y-auto overflow-x-hidden">
        <Header />
          <ProtectedRoute>{children}</ProtectedRoute>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
