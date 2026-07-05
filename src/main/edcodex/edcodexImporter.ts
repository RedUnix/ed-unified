import type { BookmarkRecord, FilesystemToolRecord } from '@shared/types'
import { parseEdcodexEntryId, parseEdcodexHtml, isNativeApp, pickHomepageLink } from './edcodexParser'
import {
  findOrCreateCategoryByName,
  createBookmark,
  createTool,
  updateBookmark,
  updateTool
} from '../data/libraryRepository'
import { downloadIcon } from '../icons/iconDownloader'

export async function importFromEdcodexUrl(
  edcodexUrl: string
): Promise<BookmarkRecord | FilesystemToolRecord> {
  const entryId = parseEdcodexEntryId(edcodexUrl)
  if (!entryId) {
    throw new Error('That does not look like an edcodex.info tool page URL (expected ?m=tools&entry=<id>).')
  }

  const response = await fetch(edcodexUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch edcodex page (HTTP ${response.status}).`)
  }
  const html = await response.text()
  const parsed = parseEdcodexHtml(html, entryId, edcodexUrl)

  if (!parsed.name) {
    throw new Error('Could not find a tool name on that edcodex page.')
  }

  const categoryIds: string[] = []
  for (const categoryName of parsed.categories) {
    const category = await findOrCreateCategoryByName(categoryName, 'edcodex')
    categoryIds.push(category.id)
  }

  const iconLocalPath = parsed.iconUrl ? await downloadIcon(parsed.iconUrl) : undefined
  const description = parsed.shortDescription ?? parsed.longDescriptionText

  if (isNativeApp(parsed)) {
    const record = await createTool({
      name: parsed.name,
      iconUrl: parsed.iconUrl,
      description,
      categoryIds,
      source: { type: 'edcodex-import', edcodexEntryId: entryId, edcodexUrl }
    })
    if (iconLocalPath) return updateTool(record.id, { iconLocalPath })
    return record
  }

  const homepage = pickHomepageLink(parsed) ?? edcodexUrl
  const record = await createBookmark({
    name: parsed.name,
    url: homepage,
    iconUrl: parsed.iconUrl,
    description,
    categoryIds,
    source: { type: 'edcodex-import', edcodexEntryId: entryId, edcodexUrl }
  })
  if (iconLocalPath) return updateBookmark(record.id, { iconLocalPath })
  return record
}
