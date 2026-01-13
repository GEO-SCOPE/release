/**
 * Korean Translations - GEO-SCOPE 다운로드 페이지
 */

import type { Translations } from '../types'

export const ko: Translations = {
  // Common
  "common.loading": "로딩 중...",
  "common.comingSoon": "곧 출시",

  // Navigation
  "nav.product": "제품",
  "nav.changelog": "변경 로그",
  "nav.docs": "문서",
  "nav.download": "다운로드",

  // Mobile Menu
  "mobileMenu.navigation": "내비게이션",
  "mobileMenu.language": "언어",

  // Download Page
  "download.title": "GEO-SCOPE 다운로드",
  "download.for": "용",
  "download.button": "다운로드",
  "download.version": "v{version} 다운로드",
  "download.requirements": "최소 요구 사항",

  // Platforms
  "platform.macos": "macOS",
  "platform.windows": "Windows",
  "platform.linux": "Linux",
  "platform.macos.aarch64": "Apple Silicon용 다운로드",
  "platform.macos.x86_64": "Intel용 다운로드",
  "platform.windows.x86_64": "x64용 다운로드",
  "platform.windows.aarch64": "ARM64용 다운로드",
  "platform.linux.x86_64": "x64용 다운로드",
  "platform.linux.aarch64": "ARM64용 다운로드",
  "platform.macos.requirements": "macOS 12 (Monterey) 이상. Apple Silicon 권장.",
  "platform.windows.requirements": "Windows 10 (64비트) 이상.",
  "platform.linux.requirements": "glibc >= 2.28 (예: Ubuntu 20, Debian 10, Fedora 36).",

  // Download Dialog
  "dialog.downloadStarted": "다운로드 시작됨",
  "dialog.thankYou": "GEO-SCOPE {platform}을(를) 다운로드해 주셔서 감사합니다.",
  "dialog.file": "파일",
  "dialog.manualDownload": "다운로드가 자동으로 시작되지 않으면",
  "dialog.clickHere": "여기를 클릭하여 다운로드",
  "dialog.installHint.macos": ".dmg 파일을 열고 GEO-SCOPE를 응용 프로그램 폴더로 드래그하세요.",
  "dialog.installHint.windows": "설치 프로그램을 실행하고 화면의 지침을 따르세요.",
  "dialog.installHint.linux": "아카이브를 추출하고 실행 파일을 실행하거나 패키지 관리자를 사용하세요.",

  // Changelog Page
  "changelog.title": "변경 로그",
  "changelog.subtitle": "GEO-SCOPE의 새로운 업데이트 및 개선 사항",
  "changelog.noReleases": "아직 릴리스가 없습니다",
  "changelog.showAll": "전체 {count}개 릴리스 표시",
  "changelog.moreUpdates": "및 {count}개 업데이트",

  // Changelog Types
  "changelog.type.new": "신규",
  "changelog.type.improved": "개선",
  "changelog.type.fixed": "수정",
  "changelog.type.breaking": "주요 변경",
  "changelog.type.security": "보안",
  "changelog.type.deprecated": "더 이상 사용되지 않음",

  // Footer
  "footer.copyright": "© 2026 GEO-SCOPE",
  "footer.privacy": "개인정보 보호",
  "footer.terms": "이용 약관",
  "footer.github": "GitHub",
}
