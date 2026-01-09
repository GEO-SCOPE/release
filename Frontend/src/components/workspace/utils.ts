import type { Citation } from "@/lib/api"

export interface SourceInfo {
  uri?: string
  url?: string
  title?: string
  domain?: string
}

/**
 * Process citation markers in response text, converting [N] to clickable links
 */
export function processCitationMarkers(
  text: string,
  citations: Citation[] | undefined,
  sources: SourceInfo[] | undefined
): string {
  if (!text) return text

  let result = text

  // First, try to insert citations using start_index/end_index if available
  if (citations && citations.length > 0) {
    const sortedCitations = [...citations]
      .filter(c => c.start_index !== undefined && c.end_index !== undefined)
      .sort((a, b) => (b.start_index || 0) - (a.start_index || 0))

    for (const citation of sortedCitations) {
      if (citation.end_index !== undefined && citation.end_index <= result.length) {
        result = result.slice(0, citation.end_index) +
          `[[${citation.index}]](${citation.source_url})` +
          result.slice(citation.end_index)
      }
    }
  }

  // Then, convert any remaining plain [N] markers to links
  // Match patterns like [1], [2], etc. that are NOT already inside markdown links
  result = result.replace(/(?<!\[)\[(\d+)\](?!\()/g, (_match, num) => {
    const index = parseInt(num, 10)
    // Try to find URL from citations first, then from sources
    const citation = citations?.find(c => c.index === index)
    if (citation?.source_url) {
      return `[[${num}]](${citation.source_url})`
    }
    // Fall back to sources array (0-indexed)
    const source = sources?.[index - 1]
    const url = source?.uri || source?.url
    if (url) {
      return `[[${num}]](${url})`
    }
    // No URL found, keep as plain text but style it
    return `**[${num}]**`
  })

  return result
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
