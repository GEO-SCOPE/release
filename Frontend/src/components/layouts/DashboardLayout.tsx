import React from "react"
import { RBSidebarProvider, RBSidebar, RBMainOffset } from "@/components/reactbits/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RBSidebarProvider>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <RBSidebar className="z-40">
          <AppSidebar />
        </RBSidebar>
        
        <RBMainOffset className="relative flex min-h-screen flex-col overflow-x-hidden">
          <main className="flex-1">
            {children}
          </main>
        </RBMainOffset>
      </div>
    </RBSidebarProvider>
  )
}
