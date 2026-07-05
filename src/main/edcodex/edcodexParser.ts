import * as cheerio from 'cheerio'

export interface ParsedEdcodexTool {
  entryId: string
  name: string
  shortDescription?: string
  longDescriptionText?: string
  author?: string
  status?: string
  license?: string
  operatingSystem?: string
  applicationCategory?: string
  categories: string[]
  externalLinks: { label: string; url: string }[]
  iconUrl?: string
}

const SOCIAL_LINK_HOSTS = ['discord.gg', 'discord.com', 'twitter.com', 'x.com', 'facebook.com', 'reddit.com']

export function parseEdcodexEntryId(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    if (!/edcodex\.info$/i.test(parsed.hostname.replace(/^www\./, ''))) return undefined
    if (parsed.searchParams.get('m') !== 'tools') return undefined
    const entry = parsed.searchParams.get('entry')
    return entry ?? undefined
  } catch {
    return undefined
  }
}

/** Resolves a possibly-relative URL scraped via cheerio's `.attr()` against the source page. */
function resolveUrl(maybeRelative: string, baseUrl: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString()
  } catch {
    return maybeRelative
  }
}

export function parseEdcodexHtml(html: string, entryId: string, baseUrl: string): ParsedEdcodexTool {
  const $ = cheerio.load(html)
  const entry = $('.entry').first()

  const name = entry.find('h1[itemprop="name"]').first().text().trim()

  const categories: string[] = []
  entry.find('ul.categories li a').each((_i, el) => {
    const text = $(el).text().trim()
    if (text) categories.push(text)
  })

  // Label/value pairs alternate as <dt>Label</dt><dd>Value</dd> inside the sidebar <dl>.
  const fields: Record<string, ReturnType<typeof $>> = {}
  const dtEls = entry.find('.pan dl > dt').toArray()
  for (const dt of dtEls) {
    const dd = $(dt).next('dd')
    const label = $(dt).text().trim().toLowerCase()
    if (label) fields[label] = dd
  }

  const author = entry.find('dd.author span[itemprop="author"]').first().text().trim() || undefined
  const status = fields['status']?.text().trim() || undefined
  const license = entry.find('[itemprop="license"]').first().text().trim() || undefined
  const operatingSystem =
    entry.find('span[itemprop="operatingSystem"]').first().text().trim() || undefined
  const applicationCategory =
    entry.find('span[itemprop="applicationCategory"]').first().text().trim() || undefined

  const shortDescription = entry.find('.content.pan').first().text().trim() || undefined
  const longDescriptionText =
    entry.find('.content[itemprop="description"]').first().text().trim() || undefined

  const externalLinks: { label: string; url: string }[] = []
  entry.find('ul.links li a[itemprop="url"]').each((_i, el) => {
    const url = $(el).attr('href')
    const label = $(el).text().trim()
    if (url) externalLinks.push({ label, url: resolveUrl(url, baseUrl) })
  })

  let iconUrl: string | undefined
  const logoImg = entry.find('ul.images li img[alt="Logo"]').first()
  if (logoImg.length) {
    iconUrl = logoImg.attr('src') || undefined
  } else {
    const firstImg = entry.find('ul.images li img').first()
    iconUrl = firstImg.attr('src') || undefined
  }
  if (iconUrl) iconUrl = resolveUrl(iconUrl, baseUrl)

  return {
    entryId,
    name,
    shortDescription,
    longDescriptionText,
    author,
    status,
    license,
    operatingSystem,
    applicationCategory,
    categories,
    externalLinks,
    iconUrl
  }
}

/** True if the tool is a native/installable program rather than a pure web app. */
export function isNativeApp(parsed: ParsedEdcodexTool): boolean {
  const os = (parsed.operatingSystem ?? '').toLowerCase()
  return /windows|mac ?os|linux/.test(os)
}

/** Picks the best candidate "homepage" link for a website bookmark, skipping social links. */
export function pickHomepageLink(parsed: ParsedEdcodexTool): string | undefined {
  const nonSocial = parsed.externalLinks.filter((link) => {
    try {
      const host = new URL(link.url).hostname.replace(/^www\./, '')
      return !SOCIAL_LINK_HOSTS.includes(host)
    } catch {
      return false
    }
  })
  const nameMatch = nonSocial.find(
    (link) => link.label.toLowerCase() === parsed.name.toLowerCase()
  )
  return (nameMatch ?? nonSocial[0] ?? parsed.externalLinks[0])?.url
}
