/**
 * Release Server API (更新日志、版本信息)
 * 从独立的 Release 服务器获取数据
 */

import { RELEASE_SERVER_URL, shouldUseMockData } from '@/config'
import type { Changelog, ChangelogRelease, ChangelogAuthor, ChangelogEntry } from '@/api/types'
import { DEFAULT_CHANGELOG } from '@/api/defaults'

// Release 服务器返回的格式 (多语言 JSON)
interface ReleaseServerChangelog {
  total: number
  releases: Array<{
    version: string
    pub_date: string
    notes: Record<string, string>    // {"en": "...", "zh": "...", ...}
    detail: Record<string, string>   // {"en": "...", "zh": "...", ...}
    is_critical: boolean
    is_prerelease: boolean
    is_active: boolean
    author?: {
      username: string
      name: string
      avatar_url: string | null
      github_url: string | null
    } | null
    changelogs?: Array<{
      type: string
      title: Record<string, string>   // 标题 {"en": "...", "zh": "..."}
      detail?: Record<string, string>  // 详情 (Markdown)
      commit_hash: string | null
      issue_url: string | null
      pr_url: string | null
      author?: {
        username: string
        name: string
        avatar_url: string | null
        github_url: string | null
      } | null
    }>
  }>
}

interface ReleaseServerLatest {
  version: string
  pub_date: string
  notes: Record<string, string>      // {"en": "...", "zh": "...", ...}
  detail: Record<string, string>     // {"en": "...", "zh": "...", ...}
  is_critical: boolean
  is_prerelease: boolean
  platforms: Array<{
    target: string
    arch: string
  }>
}

/**
 * 获取多语言内容（带回退）
 */
function getLocalizedText(texts: Record<string, string>, locale: string): string {
  return texts[locale] || texts['en'] || Object.values(texts)[0] || ''
}

/**
 * 将 Release 服务器格式转换为前端格式
 */
function transformChangelog(data: ReleaseServerChangelog): Changelog {
  return {
    releases: data.releases.map((release): ChangelogRelease => {
      // 获取中英文 notes (用于向后兼容)
      const notesZh = getLocalizedText(release.notes || {}, 'zh')
      const notesEn = getLocalizedText(release.notes || {}, 'en')

      // 如果有 changelogs，使用 changelogs；否则解析 notes
      let changes: ChangelogRelease['changes'] = []
      let entries: ChangelogEntry[] | undefined

      if (release.changelogs && release.changelogs.length > 0) {
        // 使用服务器返回的 changelogs
        entries = release.changelogs.map((cl, idx) => ({
          type: cl.type as ChangelogEntry['type'],
          title_zh: getLocalizedText(cl.title || {}, 'zh'),
          title_en: getLocalizedText(cl.title || {}, 'en'),
          detail_zh: cl.detail ? getLocalizedText(cl.detail, 'zh') : undefined,
          detail_en: cl.detail ? getLocalizedText(cl.detail, 'en') : undefined,
          commit_hash: cl.commit_hash,
          issue_url: cl.issue_url,
          pr_url: cl.pr_url,
          author: cl.author ? {
            username: cl.author.username,
            name: cl.author.name,
            avatar_url: cl.author.avatar_url,
            github_url: cl.author.github_url,
          } : undefined,
        }))

        // 也生成 changes 用于向后兼容
        changes = entries.map(e => ({
          type: e.type,
          text_zh: e.title_zh,
          text_en: e.title_en,
        }))
      } else {
        // 解析 notes 为 changes 列表
        changes = parseNotes(notesZh, notesEn)
      }

      // 作者信息
      const author: ChangelogAuthor | undefined = release.author ? {
        username: release.author.username,
        name: release.author.name,
        avatar_url: release.author.avatar_url,
        github_url: release.author.github_url,
      } : undefined

      return {
        version: release.version,
        date: release.pub_date?.split('T')[0] || '', // 只取日期部分
        changes,
        author,
        entries,
      }
    }),
  }
}

/**
 * 解析更新日志文本为 changes 数组
 */
function parseNotes(notesZh: string, notesEn: string): ChangelogRelease['changes'] {
  const zhLines = (notesZh || '').split('\n').filter(line => line.trim())
  const enLines = (notesEn || '').split('\n').filter(line => line.trim())

  const changes: ChangelogRelease['changes'] = []

  // 按行匹配
  const maxLines = Math.max(zhLines.length, enLines.length)

  for (let i = 0; i < maxLines; i++) {
    const zhLine = zhLines[i] || ''
    const enLine = enLines[i] || ''

    // 检测类型
    let type: 'feature' | 'improve' | 'fix' | 'breaking' = 'improve'
    const lineLower = (zhLine + enLine).toLowerCase()

    if (lineLower.includes('新功能') || lineLower.includes('new') || lineLower.includes('add') || lineLower.includes('feature')) {
      type = 'feature'
    } else if (lineLower.includes('修复') || lineLower.includes('fix') || lineLower.includes('bug')) {
      type = 'fix'
    } else if (lineLower.includes('破坏') || lineLower.includes('breaking')) {
      type = 'breaking'
    }

    // 清理文本 (去掉 - 前缀)
    const cleanText = (text: string) => text.replace(/^[-*•]\s*/, '').replace(/^(新功能|修复|优化|New|Fix|Improve|Feature):\s*/i, '').trim()

    if (zhLine || enLine) {
      changes.push({
        type,
        text_zh: cleanText(zhLine) || cleanText(enLine),
        text_en: cleanText(enLine) || cleanText(zhLine),
      })
    }
  }

  return changes.length > 0 ? changes : [{
    type: 'improve',
    text_zh: notesZh || '版本更新',
    text_en: notesEn || 'Version update',
  }]
}

export const releaseApi = {
  /**
   * 获取更新日志 (从 Release 服务器)
   */
  getChangelog: async (limit: number = 50): Promise<Changelog> => {
    // Mock 模式返回默认数据
    if (shouldUseMockData() || !RELEASE_SERVER_URL) {
      return DEFAULT_CHANGELOG
    }

    try {
      const response = await fetch(`${RELEASE_SERVER_URL}/api/update/changelog?limit=${limit}`)

      if (!response.ok) {
        console.warn('Failed to fetch changelog from release server')
        return DEFAULT_CHANGELOG
      }

      const data: ReleaseServerChangelog = await response.json()
      return transformChangelog(data)
    } catch (error) {
      console.warn('Release server unavailable, using default changelog:', error)
      return DEFAULT_CHANGELOG
    }
  },

  /**
   * 获取最新版本信息
   */
  getLatestVersion: async (): Promise<ReleaseServerLatest | null> => {
    if (shouldUseMockData() || !RELEASE_SERVER_URL) {
      return null
    }

    try {
      const response = await fetch(`${RELEASE_SERVER_URL}/api/update/latest`)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.warn('Failed to fetch latest version:', error)
      return null
    }
  },

  /**
   * 提交 Bug 报告
   */
  submitBugReport: async (data: {
    title: string
    description: string
    stepsToReproduce?: string
    appVersion?: string
    platform?: string
    osVersion?: string
    contactEmail?: string
    screenshots?: File[]
  }): Promise<{ success: boolean; id?: string; message?: string }> => {
    if (!RELEASE_SERVER_URL) {
      return { success: false, message: 'Release server not configured' }
    }

    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)

      if (data.stepsToReproduce) {
        formData.append('steps_to_reproduce', data.stepsToReproduce)
      }
      if (data.appVersion) {
        formData.append('app_version', data.appVersion)
      }
      if (data.platform) {
        formData.append('platform', data.platform)
      }
      if (data.osVersion) {
        formData.append('os_version', data.osVersion)
      }
      if (data.contactEmail) {
        formData.append('contact_email', data.contactEmail)
      }

      // 添加截图
      if (data.screenshots && data.screenshots.length > 0) {
        data.screenshots.forEach((file) => {
          formData.append('screenshots', file)
        })
      }

      const response = await fetch(`${RELEASE_SERVER_URL}/api/bugs`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, message: result.detail || 'Failed to submit bug report' }
      }

      return { success: true, id: result.id, message: result.message }
    } catch (error) {
      console.error('Failed to submit bug report:', error)
      return { success: false, message: 'Network error' }
    }
  },
}
