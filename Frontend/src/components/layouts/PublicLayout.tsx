/**
 * Public Layout - Minimal wrapper for public pages
 */

import React from "react"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return <>{children}</>
}
