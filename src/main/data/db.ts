import { app } from 'electron'
import { randomUUID } from 'crypto'
import { join } from 'path'
import type { LibraryDb } from '@shared/types'

const SCHEMA_VERSION = 1

/** Categories and the EDCodex bookmark shipped by default on a brand-new install. */
function seedLibraryData(): LibraryDb {
  const now = new Date().toISOString()
  const apiCategoryId = randomUUID()

  return {
    bookmarks: [
      {
        id: randomUUID(),
        kind: 'website',
        name: 'EDCodex',
        url: 'http://edcodex.info/',
        description:
          "EDCodex is a website with a database of currently approx 210 tools,threads,websites andvideos for Elite: Dangerous. Any one can and is encouraged to add entries there. Its equally suited for PC's, tablets and smartphones.",
        categoryIds: [apiCategoryId],
        themeId: 'high-contrast',
        sessionPartition: `persist:bm-${randomUUID()}`,
        source: { type: 'edcodex-import', edcodexEntryId: '264', edcodexUrl: 'https://edcodex.info/?m=tools&entry=264' },
        order: 0,
        createdAt: now,
        updatedAt: now,
        autoDark: { enabled: true, brightness: 1, contrast: 1.4, sepia: 0 }
      }
    ],
    tools: [],
    categories: [
      { id: randomUUID(), name: 'Engineers', source: 'edcodex' },
      { id: randomUUID(), name: 'Logbook', source: 'edcodex' },
      { id: randomUUID(), name: 'Shipyard', source: 'edcodex' },
      { id: randomUUID(), name: 'Trading', source: 'edcodex' },
      { id: randomUUID(), name: 'EDDN', source: 'edcodex' },
      { id: randomUUID(), name: 'Guides', source: 'edcodex' },
      { id: apiCategoryId, name: 'API', source: 'edcodex' },
      { id: randomUUID(), name: 'MISC', source: 'edcodex' },
      { id: randomUUID(), name: 'BGS', source: 'edcodex' },
      { id: randomUUID(), name: 'Fighting', source: 'edcodex' }
    ],
    launchSequences: [],
    schemaVersion: SCHEMA_VERSION
  }
}

// lowdb is ESM-only; dynamically import it from this CommonJS-compiled main module.
let dbPromise: Promise<import('lowdb').Low<LibraryDb>> | null = null

export function getDb(): Promise<import('lowdb').Low<LibraryDb>> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { Low } = await import('lowdb')
      const { JSONFile } = await import('lowdb/node')
      const filePath = join(app.getPath('userData'), 'library.json')
      const adapter = new JSONFile<LibraryDb>(filePath)
      const db = new Low<LibraryDb>(adapter, seedLibraryData())
      await db.read()
      if (!db.data) {
        db.data = seedLibraryData()
        await db.write()
      } else {
        let needsWrite = false
        if (!db.data.launchSequences) {
          // Backfill for installs whose library.json predates the launch-sequencer feature.
          db.data.launchSequences = []
          needsWrite = true
        }
        // Backfill for installs whose library.json predates drag-and-drop ordering,
        // preserving the existing bookmarks-then-tools display order.
        let nextOrder = 0
        for (const bookmark of db.data.bookmarks) {
          if (typeof bookmark.order !== 'number') {
            bookmark.order = nextOrder
            needsWrite = true
          }
          nextOrder = Math.max(nextOrder, bookmark.order + 1)
        }
        for (const tool of db.data.tools) {
          if (typeof tool.order !== 'number') {
            tool.order = nextOrder
            needsWrite = true
          }
          nextOrder = Math.max(nextOrder, tool.order + 1)
        }
        if (needsWrite) await db.write()
      }
      return db
    })()
  }
  return dbPromise
}
