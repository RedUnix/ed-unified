import { load } from 'cheerio'
import type { BookmarkRecord, FilesystemToolRecord, ProtocolToolImportResult } from '@shared/types'
import { parseEdcodexEntryId, parseEdcodexHtml, isNativeApp, pickHomepageLink } from './edcodexParser'
import {
  findOrCreateCategoryByName,
  createBookmark,
  createTool,
  listTools,
  updateBookmark,
  updateTool
} from '../data/libraryRepository'
import { downloadIcon } from '../icons/iconDownloader'
import { track } from '../analytics/analytics'

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

  track('edcodex_imported', { kind: isNativeApp(parsed) ? 'tool' : 'bookmark', via: 'url' })
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

interface EdcodexApiLink {
  TYPE_LINK?: string
  URL?: string
}

interface EdcodexApiEntry {
  TITLE?: string
  SHORT_DESC?: string
  LONG_DESC?: string
  PLATFORM_LST?: string
  DATE_UPDATE?: string
  cats?: Array<{ NAME?: string }>
  links?: EdcodexApiLink[]
}

/** Best link for the user to download/install from: homepage first, then sources, then anything non-video. */
function pickDownloadUrl(links: EdcodexApiLink[] | undefined): string | undefined {
  if (!links) return undefined
  const byType = (type: string): string | undefined =>
    links.find((l) => l.TYPE_LINK === type && l.URL)?.URL
  return byType('website') ?? byType('sources') ?? links.find((l) => l.TYPE_LINK !== 'videos' && l.URL)?.URL
}

/**
 * One-click filesystem-tool import for the `edtoolapp://import-tool` protocol
 * path. Metadata comes from the EDCodex JSON API (stabler than scraping); the
 * icon URL is passed in from the page DOM because the API has no icon field.
 * The created tool has no installedExePath -- the user installs the program
 * themselves and links it via the card's "Locate Program..." button.
 */
export async function importToolFromEdcodexApi(
  entryId: string,
  iconUrl?: string
): Promise<ProtocolToolImportResult> {
  const edcodexUrl = `https://edcodex.info/?m=tools&entry=${entryId}`

  const existing = (await listTools()).find((t) => t.source.edcodexEntryId === entryId)
  if (existing) {
    return { record: existing, alreadyExisted: true }
  }

  let entry: EdcodexApiEntry
  try {
    const response = await fetch(`https://edcodex.info/api.php?entry=${entryId}&render=json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    entry = (await response.json()) as EdcodexApiEntry
    if (!entry?.TITLE) throw new Error('API response has no TITLE')
  } catch {
    // API unavailable/changed -- fall back to the HTML-scrape importer, which
    // already knows how to build a filesystem tool from a native-app page.
    const record = await importFromEdcodexUrl(edcodexUrl)
    if (record.kind !== 'filesystem-tool') {
      throw new Error('That EDCodex entry looks like a web application, not an installable tool.')
    }
    return { record, alreadyExisted: false }
  }

  if (!/\bwin/i.test(entry.PLATFORM_LST ?? '')) {
    throw new Error('That EDCodex entry is not listed as a Windows application.')
  }

  const categoryIds: string[] = []
  for (const cat of entry.cats ?? []) {
    if (!cat.NAME) continue
    const category = await findOrCreateCategoryByName(cat.NAME, 'edcodex')
    categoryIds.push(category.id)
  }

  // SHORT_DESC is plain text; LONG_DESC is HTML -- flatten the fallback.
  const description =
    entry.SHORT_DESC?.trim() || load(entry.LONG_DESC ?? '').text().trim() || undefined

  let record = await createTool({
    name: entry.TITLE,
    iconUrl,
    description,
    categoryIds,
    source: { type: 'edcodex-import', edcodexEntryId: entryId, edcodexUrl }
  })
  // Baseline for the periodic update checker (see toolUpdateChecker.ts).
  if (entry.DATE_UPDATE) {
    record = await updateTool(record.id, {
      edcodexDateUpdate: entry.DATE_UPDATE,
      edcodexLatestDateUpdate: entry.DATE_UPDATE
    })
  }

  if (iconUrl) {
    const iconLocalPath = await downloadIcon(iconUrl)
    if (iconLocalPath) record = await updateTool(record.id, { iconLocalPath })
  }

  return { record, downloadUrl: pickDownloadUrl(entry.links), alreadyExisted: false }
}
