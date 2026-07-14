import { randomUUID } from 'crypto'
import { getDb } from './db'
import type {
  BookmarkRecord,
  CategoryRecord,
  FilesystemToolRecord,
  LaunchSequenceRecord,
  NewBookmarkInput,
  NewCategoryInput,
  NewLaunchSequenceInput,
  NewToolInput
} from '@shared/types'

function now(): string {
  return new Date().toISOString()
}

async function nextLibraryOrder(): Promise<number> {
  const db = await getDb()
  const maxBookmarkOrder = db.data.bookmarks.reduce((max, b) => Math.max(max, b.order), -1)
  const maxToolOrder = db.data.tools.reduce((max, t) => Math.max(max, t.order), -1)
  return Math.max(maxBookmarkOrder, maxToolOrder) + 1
}

// ---- Bookmarks ----

export async function listBookmarks(): Promise<BookmarkRecord[]> {
  const db = await getDb()
  return [...db.data.bookmarks].sort((a, b) => a.order - b.order)
}

export async function createBookmark(input: NewBookmarkInput): Promise<BookmarkRecord> {
  const db = await getDb()
  const id = randomUUID()
  const record: BookmarkRecord = {
    id,
    kind: 'website',
    name: input.name,
    url: input.url,
    iconUrl: input.iconUrl,
    iconLocalPath: input.iconLocalPath,
    description: input.description,
    categoryIds: input.categoryIds ?? [],
    themeId: null,
    sessionPartition: `persist:bm-${id}`,
    source: input.source ?? { type: 'manual' },
    order: await nextLibraryOrder(),
    createdAt: now(),
    updatedAt: now()
  }
  db.data.bookmarks.push(record)
  await db.write()
  return record
}

export async function updateBookmark(
  id: string,
  patch: Partial<BookmarkRecord>
): Promise<BookmarkRecord> {
  const db = await getDb()
  const record = db.data.bookmarks.find((b) => b.id === id)
  if (!record) throw new Error(`Bookmark not found: ${id}`)
  Object.assign(record, patch, { id: record.id, updatedAt: now() })
  await db.write()
  return record
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDb()
  db.data.bookmarks = db.data.bookmarks.filter((b) => b.id !== id)
  await db.write()
}

// ---- Filesystem Tools ----

export async function listTools(): Promise<FilesystemToolRecord[]> {
  const db = await getDb()
  return [...db.data.tools].sort((a, b) => a.order - b.order)
}

export async function createTool(input: NewToolInput): Promise<FilesystemToolRecord> {
  const db = await getDb()
  const record: FilesystemToolRecord = {
    id: randomUUID(),
    kind: 'filesystem-tool',
    name: input.name,
    iconUrl: input.iconUrl,
    iconLocalPath: input.iconLocalPath,
    description: input.description,
    categoryIds: input.categoryIds ?? [],
    installedExePath: input.installedExePath,
    platform: 'windows',
    source: input.source ?? { type: 'manual' },
    order: await nextLibraryOrder(),
    createdAt: now(),
    updatedAt: now()
  }
  db.data.tools.push(record)
  await db.write()
  return record
}

export async function updateTool(
  id: string,
  patch: Partial<FilesystemToolRecord>
): Promise<FilesystemToolRecord> {
  const db = await getDb()
  const record = db.data.tools.find((t) => t.id === id)
  if (!record) throw new Error(`Tool not found: ${id}`)
  Object.assign(record, patch, { id: record.id, updatedAt: now() })
  await db.write()
  return record
}

export async function deleteTool(id: string): Promise<void> {
  const db = await getDb()
  db.data.tools = db.data.tools.filter((t) => t.id !== id)
  await db.write()
}

/** Persists a new drag-and-drop display order for a mixed list of bookmark/tool ids. */
export async function reorderLibraryItems(orderedIds: string[]): Promise<void> {
  const db = await getDb()
  const bookmarksById = new Map(db.data.bookmarks.map((b) => [b.id, b]))
  const toolsById = new Map(db.data.tools.map((t) => [t.id, t]))
  orderedIds.forEach((id, index) => {
    const bookmark = bookmarksById.get(id)
    if (bookmark) {
      bookmark.order = index
      return
    }
    const tool = toolsById.get(id)
    if (tool) tool.order = index
  })
  await db.write()
}

// ---- Categories ----

export async function listCategories(): Promise<CategoryRecord[]> {
  const db = await getDb()
  return db.data.categories
}

export async function findCategoryByName(name: string): Promise<CategoryRecord | undefined> {
  const db = await getDb()
  return db.data.categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
}

export async function createCategory(input: NewCategoryInput): Promise<CategoryRecord> {
  const db = await getDb()
  const existing = await findCategoryByName(input.name)
  if (existing) return existing
  const record: CategoryRecord = {
    id: randomUUID(),
    name: input.name,
    source: input.source ?? 'user',
    colorHex: input.colorHex
  }
  db.data.categories.push(record)
  await db.write()
  return record
}

export async function renameCategory(id: string, name: string): Promise<CategoryRecord> {
  const db = await getDb()
  const record = db.data.categories.find((c) => c.id === id)
  if (!record) throw new Error(`Category not found: ${id}`)
  record.name = name
  await db.write()
  return record
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb()
  db.data.categories = db.data.categories.filter((c) => c.id !== id)
  for (const b of db.data.bookmarks) b.categoryIds = b.categoryIds.filter((c) => c !== id)
  for (const t of db.data.tools) t.categoryIds = t.categoryIds.filter((c) => c !== id)
  await db.write()
}

/** Finds an existing category by name or creates a new one, tagging its source. */
export async function findOrCreateCategoryByName(
  name: string,
  source: 'edcodex' | 'user'
): Promise<CategoryRecord> {
  const existing = await findCategoryByName(name)
  if (existing) return existing
  return createCategory({ name, source })
}

// ---- Launch Sequences ----

export async function listLaunchSequences(): Promise<LaunchSequenceRecord[]> {
  const db = await getDb()
  return db.data.launchSequences
}

export async function createLaunchSequence(
  input: NewLaunchSequenceInput
): Promise<LaunchSequenceRecord> {
  const db = await getDb()
  const record: LaunchSequenceRecord = {
    id: randomUUID(),
    name: input.name,
    steps: input.steps,
    createdAt: now(),
    updatedAt: now()
  }
  db.data.launchSequences.push(record)
  await db.write()
  return record
}

export async function updateLaunchSequence(
  id: string,
  patch: Partial<LaunchSequenceRecord>
): Promise<LaunchSequenceRecord> {
  const db = await getDb()
  const record = db.data.launchSequences.find((s) => s.id === id)
  if (!record) throw new Error(`Launch sequence not found: ${id}`)
  Object.assign(record, patch, { id: record.id, updatedAt: now() })
  await db.write()
  return record
}

export async function deleteLaunchSequence(id: string): Promise<void> {
  const db = await getDb()
  db.data.launchSequences = db.data.launchSequences.filter((s) => s.id !== id)
  await db.write()
}
