import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as db from './db'
import { DEFAULT_CATEGORIES, DEFAULT_METHODS, DEFAULT_SETTINGS } from './defaults'
import type { Backup, Category, Item, Method, Settings } from './types'
import { blobToDataUrl, compressImage, dataUrlToBlob, uid } from './util'

export interface ItemDraft {
  name: string
  categoryId: string | null
  methodId: string
  estValue: number | null
  tags: string[]
  notes: string
  link: string
}

interface State {
  ready: boolean
  error: string | null
  items: Item[]
  categories: Category[]
  methods: Method[]
  settings: Settings
}

interface Store extends State {
  addItem: (draft: ItemDraft, photo?: File | null) => Promise<Item>
  updateItem: (id: string, patch: Partial<Item>, photo?: File | null | undefined) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  /** Moves an item to its done state, recording the final price for money methods. */
  processItem: (id: string, actualValue?: number | null) => Promise<void>
  setStatus: (id: string, status: Item['status']) => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  addCategory: (label: string) => Promise<void>
  addMethod: (draft: Omit<Method, 'id' | 'order' | 'archived'>) => Promise<void>
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>
  updateMethod: (id: string, patch: Partial<Method>) => Promise<void>
  moveCategory: (id: string, delta: number) => Promise<void>
  moveMethod: (id: string, delta: number) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  removeMethod: (id: string) => Promise<void>
  exportBackup: () => Promise<Backup>
  importBackup: (backup: Backup, mode: 'replace' | 'merge') => Promise<void>
  resetEverything: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

/** Rewrites `order` to 0..n-1 so reordering never leaves gaps or ties. */
const resequence = <T extends { order: number }>(list: T[]): T[] =>
  [...list].sort((a, b) => a.order - b.order).map((entry, order) => ({ ...entry, order }))

function move<T extends { id: string; order: number }>(list: T[], id: string, delta: number): T[] {
  const sorted = resequence(list)
  const from = sorted.findIndex((entry) => entry.id === id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= sorted.length) return sorted
  const [moved] = sorted.splice(from, 1)
  sorted.splice(to, 0, moved)
  return sorted.map((entry, order) => ({ ...entry, order }))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    ready: false,
    error: null,
    items: [],
    categories: [],
    methods: [],
    settings: DEFAULT_SETTINGS,
  })

  useEffect(() => {
    let cancelled = false
    db.loadAll()
      .then((data) => {
        if (!cancelled) setState({ ready: true, error: null, ...data })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Could not open local storage on this device.'
        setState((s) => ({ ...s, ready: true, error: message }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Theme lives on <html> so the CSS variables and the status bar colour follow it.
  useEffect(() => {
    const root = document.documentElement
    if (state.settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', state.settings.theme)
  }, [state.settings.theme])

  const storePhoto = useCallback(async (file: File): Promise<string> => {
    const blob = await compressImage(file)
    const id = uid('p')
    await db.savePhoto(id, blob)
    return id
  }, [])

  const addItem = useCallback<Store['addItem']>(
    async (draft, photo) => {
      const now = Date.now()
      const item: Item = {
        id: uid('i'),
        name: draft.name.trim(),
        categoryId: draft.categoryId,
        methodId: draft.methodId,
        estValue: draft.estValue,
        actualValue: null,
        status: 'todo',
        tags: draft.tags,
        notes: draft.notes.trim(),
        link: draft.link.trim(),
        photoId: photo ? await storePhoto(photo) : null,
        createdAt: now,
        updatedAt: now,
        processedAt: null,
      }
      await db.put('items', item)
      setState((s) => ({ ...s, items: [item, ...s.items] }))
      return item
    },
    [storePhoto],
  )

  const writeItem = useCallback(async (next: Item) => {
    await db.put('items', next)
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === next.id ? next : i)) }))
  }, [])

  const updateItem = useCallback<Store['updateItem']>(
    async (id, patch, photo) => {
      const current = await db.getOne<Item>('items', id)
      if (!current) return
      let photoId = current.photoId
      if (photo === null && current.photoId) {
        await db.del('photos', current.photoId)
        photoId = null
      } else if (photo) {
        if (current.photoId) await db.del('photos', current.photoId)
        photoId = await storePhoto(photo)
      }
      await writeItem({ ...current, ...patch, photoId, updatedAt: Date.now() })
    },
    [storePhoto, writeItem],
  )

  const deleteItem = useCallback<Store['deleteItem']>(async (id) => {
    const current = await db.getOne<Item>('items', id)
    if (current?.photoId) await db.del('photos', current.photoId)
    await db.del('items', id)
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))
  }, [])

  const processItem = useCallback<Store['processItem']>(
    async (id, actualValue = null) => {
      const current = await db.getOne<Item>('items', id)
      if (!current) return
      await writeItem({
        ...current,
        status: 'done',
        actualValue,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      })
    },
    [writeItem],
  )

  const setStatus = useCallback<Store['setStatus']>(
    async (id, status) => {
      const current = await db.getOne<Item>('items', id)
      if (!current) return
      await writeItem({
        ...current,
        status,
        actualValue: status === 'done' ? current.actualValue : null,
        processedAt: status === 'done' ? (current.processedAt ?? Date.now()) : null,
        updatedAt: Date.now(),
      })
    },
    [writeItem],
  )

  const saveSettings = useCallback<Store['saveSettings']>(
    async (patch) => {
      const next = { ...state.settings, ...patch }
      setState((s) => ({ ...s, settings: next }))
      await db.put('meta', next, 'settings')
    },
    [state.settings],
  )

  const addCategory = useCallback<Store['addCategory']>(
    async (label) => {
      const trimmed = label.trim()
      if (!trimmed) return
      const created: Category = {
        id: uid('c'),
        label: trimmed,
        order: state.categories.length,
        archived: false,
      }
      setState((s) => ({ ...s, categories: [...s.categories, created] }))
      await db.put('categories', created)
    },
    [state.categories.length],
  )

  const addMethod = useCallback<Store['addMethod']>(
    async (draft) => {
      const trimmed = draft.label.trim()
      if (!trimmed) return
      const created: Method = {
        ...draft,
        label: trimmed,
        doneLabel: draft.doneLabel.trim() || trimmed,
        id: uid('m'),
        order: state.methods.length,
        archived: false,
      }
      setState((s) => ({ ...s, methods: [...s.methods, created] }))
      await db.put('methods', created)
    },
    [state.methods.length],
  )

  const updateCategory = useCallback<Store['updateCategory']>(
    async (id, patch) => {
      const current = state.categories.find((c) => c.id === id)
      if (!current) return
      const next = { ...current, ...patch }
      setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? next : c)) }))
      await db.put('categories', next)
    },
    [state.categories],
  )

  const updateMethod = useCallback<Store['updateMethod']>(
    async (id, patch) => {
      const current = state.methods.find((m) => m.id === id)
      if (!current) return
      const next = { ...current, ...patch }
      setState((s) => ({ ...s, methods: s.methods.map((m) => (m.id === id ? next : m)) }))
      await db.put('methods', next)
    },
    [state.methods],
  )

  const moveCategory = useCallback<Store['moveCategory']>(
    async (id, delta) => {
      const next = move(state.categories, id, delta)
      setState((s) => ({ ...s, categories: next }))
      await db.putMany('categories', next)
    },
    [state.categories],
  )

  const moveMethod = useCallback<Store['moveMethod']>(
    async (id, delta) => {
      const next = move(state.methods, id, delta)
      setState((s) => ({ ...s, methods: next }))
      await db.putMany('methods', next)
    },
    [state.methods],
  )

  // Anything still referenced by an item is archived rather than deleted, so old
  // items keep their label instead of turning into an orphaned id.
  const removeCategory = useCallback<Store['removeCategory']>(
    async (id) => {
      if (state.items.some((i) => i.categoryId === id)) {
        await updateCategory(id, { archived: true })
        return
      }
      await db.del('categories', id)
      setState((s) => ({ ...s, categories: resequence(s.categories.filter((c) => c.id !== id)) }))
    },
    [state.items, updateCategory],
  )

  const removeMethod = useCallback<Store['removeMethod']>(
    async (id) => {
      if (state.items.some((i) => i.methodId === id)) {
        await updateMethod(id, { archived: true })
        return
      }
      await db.del('methods', id)
      setState((s) => ({ ...s, methods: resequence(s.methods.filter((m) => m.id !== id)) }))
    },
    [state.items, updateMethod],
  )

  const exportBackup = useCallback<Store['exportBackup']>(async () => {
    const photos: Record<string, string> = {}
    for (const item of state.items) {
      if (!item.photoId) continue
      const blob = await db.readPhoto(item.photoId)
      if (blob) photos[item.photoId] = await blobToDataUrl(blob)
    }
    return {
      format: 'downsize-tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      categories: state.categories,
      methods: state.methods,
      items: state.items,
      ...(Object.keys(photos).length > 0 ? { photos } : {}),
    }
  }, [state.categories, state.items, state.methods, state.settings])

  const importBackup = useCallback<Store['importBackup']>(async (backup, mode) => {
    if (backup.format !== 'downsize-tracker') throw new Error('That is not a Downsize backup file.')

    if (mode === 'replace') await db.clearStores(['items', 'categories', 'methods', 'photos'])

    const existing = mode === 'merge' ? await db.loadAll() : null
    const mergeById = <T extends { id: string }>(incoming: T[], current: T[]): T[] => {
      const byId = new Map(current.map((entry) => [entry.id, entry]))
      for (const entry of incoming) byId.set(entry.id, entry)
      return [...byId.values()]
    }

    const categories = resequence(
      mergeById(backup.categories ?? [], existing?.categories ?? []),
    )
    const methods = resequence(mergeById(backup.methods ?? [], existing?.methods ?? []))
    const items = mergeById(backup.items ?? [], existing?.items ?? [])
    const settings = { ...DEFAULT_SETTINGS, ...(backup.settings ?? {}) }

    for (const [id, dataUrl] of Object.entries(backup.photos ?? {})) {
      await db.savePhoto(id, await dataUrlToBlob(dataUrl))
    }
    await Promise.all([
      db.putMany('categories', categories),
      db.putMany('methods', methods),
      db.putMany('items', items),
      db.put('meta', settings, 'settings'),
    ])
    setState((s) => ({ ...s, categories, methods, items, settings }))
  }, [])

  const resetEverything = useCallback<Store['resetEverything']>(async () => {
    await db.clearStores(['items', 'categories', 'methods', 'photos', 'meta'])
    await Promise.all([
      db.putMany('categories', DEFAULT_CATEGORIES),
      db.putMany('methods', DEFAULT_METHODS),
      db.put('meta', DEFAULT_SETTINGS, 'settings'),
    ])
    setState({
      ready: true,
      error: null,
      items: [],
      categories: DEFAULT_CATEGORIES,
      methods: DEFAULT_METHODS,
      settings: DEFAULT_SETTINGS,
    })
  }, [])

  const value = useMemo<Store>(
    () => ({
      ...state,
      addItem,
      updateItem,
      deleteItem,
      processItem,
      setStatus,
      saveSettings,
      addCategory,
      addMethod,
      updateCategory,
      updateMethod,
      moveCategory,
      moveMethod,
      removeCategory,
      removeMethod,
      exportBackup,
      importBackup,
      resetEverything,
    }),
    [
      state,
      addItem,
      updateItem,
      deleteItem,
      processItem,
      setStatus,
      saveSettings,
      addCategory,
      addMethod,
      updateCategory,
      updateMethod,
      moveCategory,
      moveMethod,
      removeCategory,
      removeMethod,
      exportBackup,
      importBackup,
      resetEverything,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
