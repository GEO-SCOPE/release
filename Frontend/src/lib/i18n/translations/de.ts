/**
 * German Translations - GEO-SCOPE Download-Seite
 */

import type { Translations } from '../types'

export const de: Translations = {
  // Common
  "common.loading": "Lädt...",
  "common.comingSoon": "Bald verfügbar",

  // Navigation
  "nav.product": "Produkt",
  "nav.changelog": "Änderungsprotokoll",
  "nav.docs": "Dokumentation",
  "nav.download": "Herunterladen",

  // Mobile Menu
  "mobileMenu.navigation": "Navigation",
  "mobileMenu.language": "Sprache",

  // Download Page
  "download.title": "GEO-SCOPE herunterladen",
  "download.for": "für",
  "download.button": "Herunterladen",
  "download.version": "v{version} herunterladen",
  "download.requirements": "Mindestanforderungen",

  // Platforms
  "platform.macos": "macOS",
  "platform.windows": "Windows",
  "platform.linux": "Linux",
  "platform.macos.aarch64": "Für Apple Silicon herunterladen",
  "platform.macos.x86_64": "Für Intel herunterladen",
  "platform.windows.x86_64": "Für x64 herunterladen",
  "platform.windows.aarch64": "Für ARM64 herunterladen",
  "platform.linux.x86_64": "Für x64 herunterladen",
  "platform.linux.aarch64": "Für ARM64 herunterladen",
  "platform.macos.requirements": "macOS 12 (Monterey) oder höher. Apple Silicon empfohlen.",
  "platform.windows.requirements": "Windows 10 (64 Bit) oder höher.",
  "platform.linux.requirements": "glibc >= 2.28 (z. B. Ubuntu 20, Debian 10, Fedora 36).",

  // Download Dialog
  "dialog.downloadStarted": "Download gestartet",
  "dialog.thankYou": "Vielen Dank für das Herunterladen von GEO-SCOPE für {platform}.",
  "dialog.file": "Datei",
  "dialog.manualDownload": "Falls der Download nicht automatisch startet,",
  "dialog.clickHere": "klicken Sie hier zum Herunterladen",
  "dialog.installHint.macos": "Öffnen Sie die .dmg-Datei und ziehen Sie GEO-SCOPE in Ihren Programme-Ordner.",
  "dialog.installHint.windows": "Führen Sie das Installationsprogramm aus und folgen Sie den Anweisungen auf dem Bildschirm.",
  "dialog.installHint.linux": "Extrahieren Sie das Archiv und führen Sie die ausführbare Datei aus, oder verwenden Sie Ihren Paketmanager.",

  // Changelog Page
  "changelog.title": "Änderungsprotokoll",
  "changelog.subtitle": "Neue Updates und Verbesserungen für GEO-SCOPE",
  "changelog.noReleases": "Noch keine Versionen",
  "changelog.showAll": "Alle {count} Versionen anzeigen",
  "changelog.moreUpdates": "und {count} weitere Updates",

  // Changelog Types
  "changelog.type.new": "Neu",
  "changelog.type.improved": "Verbessert",
  "changelog.type.fixed": "Behoben",
  "changelog.type.breaking": "Änderung",
  "changelog.type.security": "Sicherheit",
  "changelog.type.deprecated": "Veraltet",

  // Footer
  "footer.copyright": "© 2026 GEO-SCOPE",
  "footer.privacy": "Datenschutz",
  "footer.terms": "Bedingungen",
  "footer.github": "GitHub",
}
