/**
 * Settings Privacy - 隐私政策
 * 数据收集说明、Cookie、GDPR
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Database, Cookie, FileText, Download, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { toast } from "sonner"

export default function SettingsPrivacy() {
  const { t } = useI18n()

  const handleExportData = () => {
    toast.info(t("settings.privacy.exportRequested"))
  }

  const handleDeleteData = () => {
    toast.info(t("settings.privacy.deleteRequested"))
  }

  return (
    <div className="space-y-6">
      {/* 数据收集说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("settings.privacy.dataCollection")}
          </CardTitle>
          <CardDescription>{t("settings.privacy.dataCollectionDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">{t("settings.privacy.dataType.usage")}</p>
                <p className="text-muted-foreground mt-1">
                  {t("settings.privacy.dataType.usageDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">{t("settings.privacy.dataType.simulation")}</p>
                <p className="text-muted-foreground mt-1">
                  {t("settings.privacy.dataType.simulationDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">{t("settings.privacy.dataType.thirdParty")}</p>
                <p className="text-muted-foreground mt-1">
                  {t("settings.privacy.dataType.thirdPartyDesc")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookie 政策 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            {t("settings.privacy.cookie")}
          </CardTitle>
          <CardDescription>{t("settings.privacy.cookieDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("settings.privacy.cookieContent")}
          </p>
        </CardContent>
      </Card>

      {/* 合规声明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("settings.privacy.compliance")}
          </CardTitle>
          <CardDescription>{t("settings.privacy.complianceDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">GDPR</Badge>
            <Badge variant="secondary">{t("settings.privacy.pipl")}</Badge>
            <Badge variant="secondary">ISO 27001</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("settings.privacy.dataManagement")}
          </CardTitle>
          <CardDescription>{t("settings.privacy.dataManagementDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            {t("settings.privacy.exportData")}
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDeleteData}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("settings.privacy.deleteData")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
