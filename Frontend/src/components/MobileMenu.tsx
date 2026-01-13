import { Menu, X } from "lucide-react"
import { type CSSProperties, type ReactNode, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"

interface MobileMenuProps {
  onThemeToggle: () => void
  theme: string
}

export function MobileMenu({ onThemeToggle, theme }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { t } = useI18n()

  const navItems = [
    { labelKey: "nav.product", href: "/" },
    { labelKey: "nav.changelog", href: "/changelog" },
    { labelKey: "nav.docs", href: "#" },
  ]

  const handleNavClick = () => {
    setIsOpen(false)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className="md:hidden relative z-[9999] p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <MobileMenuOverlay onClose={() => setIsOpen(false)}>
          <section>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              {t("mobileMenu.navigation")}
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || (item.href === "/" && location.pathname === "/download")
                const activeStyle: CSSProperties | undefined = isActive
                  ? {
                      background: 'color-mix(in oklch, var(--primary) 18%, var(--background))',
                      boxShadow: '0 15px 35px color-mix(in oklch, var(--primary) 15%, transparent)',
                      borderColor: 'color-mix(in oklch, var(--primary) 35%, transparent)',
                    }
                  : undefined

                return (
                  <Link
                    key={item.labelKey}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm transition-all border',
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent'
                    )}
                    style={activeStyle}
                  >
                    {t(item.labelKey)}
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
            <LanguageSwitcher isMobile={true} />
          </section>
        </MobileMenuOverlay>
      )}
    </>
  )
}

interface MobileMenuOverlayProps {
  children: ReactNode
  onClose: () => void
}

function MobileMenuOverlay({ children, onClose }: MobileMenuOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9995] md:hidden flex items-start justify-center px-4 pt-[min(96px,15vh)] pb-6">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/60"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border p-5 shadow-2xl animate-in fade-in-0 zoom-in-95"
        style={{
          borderColor: 'color-mix(in oklch, var(--primary) 30%, transparent)',
          background: 'color-mix(in oklch, var(--background) 82%, var(--primary) 8%)',
          boxShadow: '0 30px 60px color-mix(in oklch, var(--primary) 12%, transparent)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-zinc-900 dark:text-zinc-100 mt-1 flex flex-col gap-5">
          {children}
        </div>
      </div>
    </div>
  )
}
