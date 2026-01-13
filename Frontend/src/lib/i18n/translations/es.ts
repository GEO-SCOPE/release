/**
 * Spanish Translations - Página de descarga de GEO-SCOPE
 */

import type { Translations } from '../types'

export const es: Translations = {
  // Common
  "common.loading": "Cargando...",
  "common.comingSoon": "Próximamente",

  // Navigation
  "nav.product": "Producto",
  "nav.changelog": "Registro de cambios",
  "nav.docs": "Documentación",
  "nav.download": "Descargar",

  // Mobile Menu
  "mobileMenu.navigation": "Navegación",
  "mobileMenu.language": "Idioma",

  // Download Page
  "download.title": "Descargar GEO-SCOPE",
  "download.for": "para",
  "download.button": "Descargar",
  "download.version": "Descargar v{version}",
  "download.requirements": "Requisitos mínimos",

  // Platforms
  "platform.macos": "macOS",
  "platform.windows": "Windows",
  "platform.linux": "Linux",
  "platform.macos.aarch64": "Descargar para Apple Silicon",
  "platform.macos.x86_64": "Descargar para Intel",
  "platform.windows.x86_64": "Descargar para x64",
  "platform.windows.aarch64": "Descargar para ARM64",
  "platform.linux.x86_64": "Descargar para x64",
  "platform.linux.aarch64": "Descargar para ARM64",
  "platform.macos.requirements": "macOS 12 (Monterey) o posterior. Se recomienda Apple Silicon.",
  "platform.windows.requirements": "Windows 10 (64 bits) o posterior.",
  "platform.linux.requirements": "glibc >= 2.28 (ej. Ubuntu 20, Debian 10, Fedora 36).",

  // Download Dialog
  "dialog.downloadStarted": "Descarga iniciada",
  "dialog.thankYou": "Gracias por descargar GEO-SCOPE para {platform}.",
  "dialog.file": "Archivo",
  "dialog.manualDownload": "Si la descarga no se inicia automáticamente,",
  "dialog.clickHere": "haz clic aquí para descargar",
  "dialog.installHint.macos": "Abre el archivo .dmg y arrastra GEO-SCOPE a tu carpeta de Aplicaciones.",
  "dialog.installHint.windows": "Ejecuta el instalador y sigue las instrucciones en pantalla.",
  "dialog.installHint.linux": "Extrae el archivo y ejecuta el ejecutable, o usa tu gestor de paquetes.",

  // Changelog Page
  "changelog.title": "Registro de cambios",
  "changelog.subtitle": "Nuevas actualizaciones y mejoras de GEO-SCOPE",
  "changelog.noReleases": "Aún no hay versiones",
  "changelog.showAll": "Mostrar todas las {count} versiones",
  "changelog.moreUpdates": "y {count} actualizaciones más",

  // Changelog Types
  "changelog.type.new": "Nuevo",
  "changelog.type.improved": "Mejorado",
  "changelog.type.fixed": "Corregido",
  "changelog.type.breaking": "Cambio importante",
  "changelog.type.security": "Seguridad",
  "changelog.type.deprecated": "Obsoleto",

  // Footer
  "footer.copyright": "© 2026 GEO-SCOPE",
  "footer.privacy": "Privacidad",
  "footer.terms": "Términos",
  "footer.github": "GitHub",
}
