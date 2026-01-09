import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Breadcrumb } from "antd"
import { useI18n } from "@/lib/i18n"
import { useProjectStore } from "@/store"
import type { BreadcrumbItemType } from "antd/es/breadcrumb/Breadcrumb"

export function BreadcrumbNav() {
  const location = useLocation()
  const pathname = location.pathname
  const { t } = useI18n()
  const currentProject = useProjectStore((state) => state.currentProject)

  // 使用品牌名，如果没有则使用 GEO-SCOPE
  const brandName = currentProject?.brand_name || "GEO-SCOPE"

  // Route name mapping
  const routeNames: Record<string, string> = {
    "/": t("nav.dashboard"),
    "/projects": t("nav.projects"),
    "/assets": t("nav.assets"),
    "/personas": t("nav.personas"),
    "/questions": t("nav.questions"),
    "/run-center": t("nav.runCenter"),
    "/workspace": t("nav.workspace"),
    "/citations": t("nav.citations"),
    "/optimize": t("nav.suggestions"),
    "/settings": t("nav.settings"),
    // Legacy routes
    "/products": t("nav.productVisibility"),
    "/sentiment": t("nav.sentiment"),
    "/pr-risk": t("nav.prRisk"),
    "/results": t("nav.results"),
    "/manage": t("nav.manage"),
  }

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean)

  const items: BreadcrumbItemType[] = []

  // Add brand name (instead of Home)
  if (pathname === "/") {
    items.push({
      title: brandName,
    })
  } else {
    items.push({
      title: <Link to="/">{brandName}</Link>,
    })

    // Add path segments
    let currentPath = ""
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1
      const name = routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)

      items.push({
        title: isLast ? name : <Link to={currentPath}>{name}</Link>,
      })
    })
  }

  return (
    <Breadcrumb
      items={items}
      separator="/"
      style={{
        fontSize: '14px',
        color: '#888',
      }}
      className="[&_*]:!text-[#888] [&_a]:hover:!text-[#555]"
    />
  )
}
