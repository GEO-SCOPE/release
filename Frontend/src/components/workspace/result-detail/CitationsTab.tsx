import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2, ExternalLink } from "lucide-react"
import type { SimulationResult } from "@/lib/api"
import { extractDomain } from "../utils"

interface CitationsTabProps {
  result: SimulationResult
  t: (key: string) => string
}

export function CitationsTab({ result, t }: CitationsTabProps) {
  const sources = result.sources ?? []

  if (sources.length === 0) {
    return (
      <Card className="py-8">
        <CardContent className="text-center text-muted-foreground">
          <Link2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>{t("workspace.noCitations")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {sources.map((source: any, idx: number) => {
        const title = source?.title || source?.url || `${t("workspace.source")} ${idx + 1}`
        const url = source?.uri || source?.url || ''
        const domain = source?.domain || (url ? extractDomain(url) : '')

        return (
          <Card key={idx} className="hover:bg-muted transition-colors" disableBackdrop>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
                  [{idx + 1}]
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1 break-words text-foreground">
                    {title}
                  </p>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 dark:text-blue-400 hover:underline text-xs flex items-center gap-1 break-all"
                    >
                      {domain || url}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
