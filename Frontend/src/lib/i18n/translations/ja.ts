/**
 * Japanese Translations - GEO-SCOPE ダウンロードページ
 */

import type { Translations } from '../types'

export const ja: Translations = {
  // Common
  "common.loading": "読み込み中...",
  "common.comingSoon": "近日公開",

  // Navigation
  "nav.product": "製品",
  "nav.changelog": "更新履歴",
  "nav.docs": "ドキュメント",
  "nav.download": "ダウンロード",

  // Mobile Menu
  "mobileMenu.navigation": "ナビゲーション",
  "mobileMenu.language": "言語",

  // Download Page
  "download.title": "GEO-SCOPE をダウンロード",
  "download.for": "対応：",
  "download.button": "ダウンロード",
  "download.version": "v{version} をダウンロード",
  "download.requirements": "最小要件",

  // Platforms
  "platform.macos": "macOS",
  "platform.windows": "Windows",
  "platform.linux": "Linux",
  "platform.macos.aarch64": "Apple Silicon 版をダウンロード",
  "platform.macos.x86_64": "Intel 版をダウンロード",
  "platform.windows.x86_64": "x64 版をダウンロード",
  "platform.windows.aarch64": "ARM64 版をダウンロード",
  "platform.linux.x86_64": "x64 版をダウンロード",
  "platform.linux.aarch64": "ARM64 版をダウンロード",
  "platform.macos.requirements": "macOS 12 (Monterey) 以降。Apple Silicon を推奨。",
  "platform.windows.requirements": "Windows 10 (64 bit) 以降。",
  "platform.linux.requirements": "glibc >= 2.28（Ubuntu 20、Debian 10、Fedora 36 など）。",

  // Download Dialog
  "dialog.downloadStarted": "ダウンロード開始",
  "dialog.thankYou": "GEO-SCOPE {platform} 版をダウンロードいただきありがとうございます。",
  "dialog.file": "ファイル",
  "dialog.manualDownload": "ダウンロードが自動的に開始されない場合は、",
  "dialog.clickHere": "こちらをクリックしてダウンロード",
  "dialog.installHint.macos": ".dmg ファイルを開き、GEO-SCOPE をアプリケーションフォルダにドラッグしてください。",
  "dialog.installHint.windows": "インストーラーを実行し、画面の指示に従ってください。",
  "dialog.installHint.linux": "アーカイブを解凍して実行可能ファイルを実行するか、パッケージマネージャーを使用してください。",

  // Changelog Page
  "changelog.title": "更新履歴",
  "changelog.subtitle": "GEO-SCOPE の新機能と改善",
  "changelog.noReleases": "リリースはまだありません",
  "changelog.showAll": "すべての {count} リリースを表示",
  "changelog.moreUpdates": "および {count} 件の更新",

  // Changelog Types
  "changelog.type.new": "新機能",
  "changelog.type.improved": "改善",
  "changelog.type.fixed": "修正",
  "changelog.type.breaking": "破壊的変更",
  "changelog.type.security": "セキュリティ",
  "changelog.type.deprecated": "非推奨",

  // Footer
  "footer.copyright": "© 2026 GEO-SCOPE",
  "footer.privacy": "プライバシー",
  "footer.terms": "利用規約",
  "footer.github": "GitHub",
}
