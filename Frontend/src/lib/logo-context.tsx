import * as React from "react"
import { parseLogoImage } from "@/components/reactbits/MetallicPaint"

interface LogoContextType {
  logoImageData: ImageData | null
  isLoading: boolean
}

const LogoContext = React.createContext<LogoContextType | undefined>(undefined)

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoImageData, setLogoImageData] = React.useState<ImageData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // 只加载一次，缓存在内存中
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png")
        const blob = await response.blob()
        const file = new File([blob], "logo.png", { type: "image/png" })
        const result = await parseLogoImage(file)
        setLogoImageData(result.imageData)
      } catch (error) {
        console.error("Failed to load logo:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogo()
  }, []) // 空依赖数组，只执行一次

  return (
    <LogoContext.Provider value={{ logoImageData, isLoading }}>
      {children}
    </LogoContext.Provider>
  )
}

export function useLogo() {
  const context = React.useContext(LogoContext)
  if (!context) {
    throw new Error("useLogo must be used within LogoProvider")
  }
  return context
}
