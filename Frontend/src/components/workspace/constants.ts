import type { AIEngine, IntentType } from "@/lib/api"

export interface EngineConfig {
  id: AIEngine
  name: string
  icon: string
  color: string
}

export const ENGINES: EngineConfig[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "/platforms/ChatGPT-Logo.png", color: "bg-green-500" },
  { id: "deepseek", name: "DeepSeek", icon: "/platforms/deepseek.png", color: "bg-blue-500" },
  { id: "claude", name: "Claude", icon: "/platforms/claude.png", color: "bg-orange-500" },
  { id: "doubao", name: "Doubao", icon: "/platforms/doubao.png", color: "bg-purple-500" },
]

export const getIntentLabels = (t: (key: string) => string): Record<IntentType, string> => ({
  AWARE: t("workspace.intent.aware"),
  RECOMMEND: t("workspace.intent.recommend"),
  CHOOSE: t("workspace.intent.choose"),
  TRUST: t("workspace.intent.trust"),
  COMPETE: t("workspace.intent.compete"),
  CONTACT: t("workspace.intent.contact"),
})

export const getEngineById = (id: AIEngine): EngineConfig | undefined => {
  return ENGINES.find((e) => e.id === id)
}
