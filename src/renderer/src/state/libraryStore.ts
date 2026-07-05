import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import type {
  BookmarkRecord,
  CategoryRecord,
  FilesystemToolRecord,
  LaunchSequenceRecord,
  NewBookmarkInput,
  NewLaunchSequenceInput,
  NewToolInput,
  ThemeRecord
} from '@shared/types'

interface LibraryState {
  bookmarks: BookmarkRecord[]
  tools: FilesystemToolRecord[]
  categories: CategoryRecord[]
  themes: ThemeRecord[]
  launchSequences: LaunchSequenceRecord[]
  loading: boolean
  refresh: () => Promise<void>
  addBookmark: (input: NewBookmarkInput) => Promise<BookmarkRecord>
  updateBookmark: (id: string, patch: Partial<BookmarkRecord>) => Promise<BookmarkRecord>
  addTool: (input: NewToolInput) => Promise<FilesystemToolRecord>
  deleteBookmark: (id: string) => Promise<void>
  deleteTool: (id: string) => Promise<void>
  importFromEdcodexUrl: (url: string) => Promise<BookmarkRecord | FilesystemToolRecord>
  addSequence: (input: NewLaunchSequenceInput) => Promise<LaunchSequenceRecord>
  updateSequence: (id: string, patch: Partial<LaunchSequenceRecord>) => Promise<LaunchSequenceRecord>
  deleteSequence: (id: string) => Promise<void>
  reorderLibraryItems: (orderedIds: string[]) => Promise<void>
}

export const LibraryContext = createContext<LibraryState | undefined>(undefined)

export function useLibraryProvider(): LibraryState {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [tools, setTools] = useState<FilesystemToolRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [themes, setThemes] = useState<ThemeRecord[]>([])
  const [launchSequences, setLaunchSequences] = useState<LaunchSequenceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [b, t, c, th, seq] = await Promise.all([
      window.edToolApp.bookmarks.list(),
      window.edToolApp.tools.list(),
      window.edToolApp.categories.list(),
      window.edToolApp.theming.listThemes(),
      window.edToolApp.sequences.list()
    ])
    setBookmarks(b)
    setTools(t)
    setCategories(c)
    setThemes(th)
    setLaunchSequences(seq)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const unsubscribe = window.edToolApp.onProtocolImport(() => {
      void refresh()
    })
    return unsubscribe
  }, [refresh])

  const addBookmark = useCallback(
    async (input: NewBookmarkInput) => {
      const record = await window.edToolApp.bookmarks.create(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const updateBookmark = useCallback(
    async (id: string, patch: Partial<BookmarkRecord>) => {
      const record = await window.edToolApp.bookmarks.update(id, patch)
      await refresh()
      return record
    },
    [refresh]
  )

  const addTool = useCallback(
    async (input: NewToolInput) => {
      const record = await window.edToolApp.tools.create(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const deleteBookmark = useCallback(
    async (id: string) => {
      await window.edToolApp.bookmarks.delete(id)
      await refresh()
    },
    [refresh]
  )

  const deleteTool = useCallback(
    async (id: string) => {
      await window.edToolApp.tools.delete(id)
      await refresh()
    },
    [refresh]
  )

  const importFromEdcodexUrl = useCallback(
    async (url: string) => {
      const record = await window.edToolApp.bookmarks.importFromEdcodexUrl(url)
      await refresh()
      return record
    },
    [refresh]
  )

  const addSequence = useCallback(
    async (input: NewLaunchSequenceInput) => {
      const record = await window.edToolApp.sequences.create(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const updateSequence = useCallback(
    async (id: string, patch: Partial<LaunchSequenceRecord>) => {
      const record = await window.edToolApp.sequences.update(id, patch)
      await refresh()
      return record
    },
    [refresh]
  )

  const deleteSequence = useCallback(
    async (id: string) => {
      await window.edToolApp.sequences.delete(id)
      await refresh()
    },
    [refresh]
  )

  const reorderLibraryItems = useCallback(
    async (orderedIds: string[]) => {
      await window.edToolApp.library.reorder(orderedIds)
      await refresh()
    },
    [refresh]
  )

  return {
    bookmarks,
    tools,
    categories,
    themes,
    launchSequences,
    loading,
    refresh,
    addBookmark,
    updateBookmark,
    addTool,
    deleteBookmark,
    deleteTool,
    importFromEdcodexUrl,
    addSequence,
    updateSequence,
    deleteSequence,
    reorderLibraryItems
  }
}

export function useLibrary(): LibraryState {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within a LibraryContext.Provider')
  return ctx
}
