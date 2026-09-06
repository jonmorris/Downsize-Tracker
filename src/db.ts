import { DEFAULT_CATEGORIES, DEFAULT_METHODS, DEFAULT_SETTINGS } from './defaults'
import type { Category, Item, Method, Settings } from './types'
import { parseCount } from './util'

const DB_NAME = 'downsize-tracker'
const DB_VERSION = 1

export type StoreName = 'items' | 'categories' | 'methods' | 'photos' | 'meta'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('methods')) db.createObjectStore('methods', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open the local database.'))
  })
  return dbPromise
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  body: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = body(tx.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('Database request failed.'))
      }),
  )
}

export const getAll = <T>(store: StoreName): Promise<T[]> =>
  run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)

export const getOne = <T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> =>
  run<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>)

export const put = (store: StoreName, value: unknown, key?: IDBValidKey): Promise<IDBValidKey> =>
  run<IDBValidKey>(store, 'readwrite', (s) => s.put(value, key))

export const del = (store: StoreName, key: IDBValidKey): Promise<undefined> =>
  run<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>)

export async function putMany(store: StoreName, values: unknown[]): Promise<void> {
  if (values.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const os = tx.objectStore(store)
    for (const v of values) os.put(v)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Bulk write failed.'))
  })
}

export async function clearStores(stores: StoreName[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite')
    for (const s of stores) tx.objectStore(s).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Could not clear data.'))
  })
}

export interface LoadedData {
  items: Item[]
  categories: Category[]
  methods: Method[]
  settings: Settings
}

/** Reads everything, seeding the default categories, methods and goals on first run. */
export async function loadAll(): Promise<LoadedData> {
  const [items, categories, methods, storedSettings] = await Promise.all([
    getAll<Item>('items'),
    getAll<Category>('categories'),
    getAll<Method>('methods'),
    getOne<Partial<Settings>>('meta', 'settings'),
  ])

  let seededCategories = categories
  let seededMethods = methods
  if (categories.length === 0 && methods.length === 0 && items.length === 0) {
    seededCategories = DEFAULT_CATEGORIES
    seededMethods = DEFAULT_METHODS
    await Promise.all([
      putMany('categories', seededCategories),
      putMany('methods', seededMethods),
      put('meta', DEFAULT_SETTINGS, 'settings'),
    ])
  }

  return {
    items: items.map(normalizeItem),
    categories: seededCategories.sort((a, b) => a.order - b.order),
    methods: seededMethods.sort((a, b) => a.order - b.order),
    settings: { ...DEFAULT_SETTINGS, ...storedSettings },
  }
}

/** Items stored before `quantity` existed read back as covering one thing. */
export const normalizeItem = (item: Item): Item => ({ ...item, quantity: parseCount(item.quantity) })

export const savePhoto = (id: string, blob: Blob): Promise<IDBValidKey> =>
  put('photos', { id, blob })

export async function readPhoto(id: string): Promise<Blob | null> {
  const rec = await getOne<{ id: string; blob: Blob }>('photos', id)
  return rec?.blob ?? null
}
