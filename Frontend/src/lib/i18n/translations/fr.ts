/**
 * French Translations - Page de téléchargement GEO-SCOPE
 */

import type { Translations } from '../types'

export const fr: Translations = {
  // Common
  "common.loading": "Chargement...",
  "common.comingSoon": "Bientôt disponible",

  // Navigation
  "nav.product": "Produit",
  "nav.changelog": "Changelog",
  "nav.docs": "Documentation",
  "nav.download": "Télécharger",

  // Mobile Menu
  "mobileMenu.navigation": "Navigation",
  "mobileMenu.language": "Langue",

  // Download Page
  "download.title": "Télécharger GEO-SCOPE",
  "download.for": "pour",
  "download.button": "Télécharger",
  "download.version": "Télécharger v{version}",
  "download.requirements": "Configuration minimale",

  // Platforms
  "platform.macos": "macOS",
  "platform.windows": "Windows",
  "platform.linux": "Linux",
  "platform.macos.aarch64": "Télécharger pour Apple Silicon",
  "platform.macos.x86_64": "Télécharger pour Intel",
  "platform.windows.x86_64": "Télécharger pour x64",
  "platform.windows.aarch64": "Télécharger pour ARM64",
  "platform.linux.x86_64": "Télécharger pour x64",
  "platform.linux.aarch64": "Télécharger pour ARM64",
  "platform.macos.requirements": "macOS 12 (Monterey) ou version ultérieure. Apple Silicon recommandé.",
  "platform.windows.requirements": "Windows 10 (64 bits) ou version ultérieure.",
  "platform.linux.requirements": "glibc >= 2.28 (par ex. Ubuntu 20, Debian 10, Fedora 36).",

  // Download Dialog
  "dialog.downloadStarted": "Téléchargement commencé",
  "dialog.thankYou": "Merci d'avoir téléchargé GEO-SCOPE pour {platform}.",
  "dialog.file": "Fichier",
  "dialog.manualDownload": "Si le téléchargement ne démarre pas automatiquement,",
  "dialog.clickHere": "cliquez ici pour télécharger",
  "dialog.installHint.macos": "Ouvrez le fichier .dmg et faites glisser GEO-SCOPE dans votre dossier Applications.",
  "dialog.installHint.windows": "Exécutez le programme d'installation et suivez les instructions à l'écran.",
  "dialog.installHint.linux": "Extrayez l'archive et exécutez le fichier exécutable, ou utilisez votre gestionnaire de paquets.",

  // Changelog Page
  "changelog.title": "Changelog",
  "changelog.subtitle": "Nouvelles mises à jour et améliorations de GEO-SCOPE",
  "changelog.noReleases": "Aucune version disponible",
  "changelog.showAll": "Afficher les {count} versions",
  "changelog.moreUpdates": "et {count} mises à jour supplémentaires",

  // Changelog Types
  "changelog.type.new": "Nouveau",
  "changelog.type.improved": "Amélioré",
  "changelog.type.fixed": "Corrigé",
  "changelog.type.breaking": "Rupture",
  "changelog.type.security": "Sécurité",
  "changelog.type.deprecated": "Obsolète",

  // Footer
  "footer.copyright": "© 2026 GEO-SCOPE",
  "footer.privacy": "Confidentialité",
  "footer.terms": "Conditions",
  "footer.github": "GitHub",
}
