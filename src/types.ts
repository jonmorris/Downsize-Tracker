export type ItemStatus = 'todo' | 'listed' | 'done'

/** A way of getting rid of something. Fully user-managed in Settings. */
export interface Method {
  id: string
  /** Verb shown in the item form, e.g. "Sell". */
  label: string
  /** Past tense shown once processed, e.g. "Sold". */
  doneLabel: string
  /** Prompts for a final price and counts toward the money goal. */
  tracksMoney: boolean
  /** Has an intermediate "Listed" stage before it is done. */
  canList: boolean
  /** Accent colour token: one of the keys in ACCENTS. */
  accent: string
  order: number
  archived: boolean
}

export interface Category {
  id: string
  label: string
  order: number
  archived: boolean
}

export interface Item {
  id: string
  name: string
  categoryId: string | null
  methodId: string
  /**
   * How many physical things this one entry covers — "all my Pokémon cards"
   * might be 50. Counts as `quantity` toward the item goal and the dashboard
   * tiles; values below stay per-entry, since a lot sells for one price.
   */
  quantity: number
  /** What you think it is worth, in dollars. */
  estValue: number | null
  /** What it actually went for. Only set for money-tracking methods. */
  actualValue: number | null
  status: ItemStatus
  tags: string[]
  notes: string
  link: string
  photoId: string | null
  createdAt: number
  updatedAt: number
  /** When it left the house. */
  processedAt: number | null
}

export interface Settings {
  moneyGoal: number
  itemGoal: number
  theme: 'system' | 'light' | 'dark'
  /** Which items count toward the item goal: everything processed, or only sales. */
  itemGoalCounts: 'all' | 'money'
}

export interface Backup {
  format: 'downsize-tracker'
  version: 1
  exportedAt: string
  settings: Settings
  categories: Category[]
  methods: Method[]
  items: Item[]
  /** Photos as data URLs, keyed by photo id. Omitted when there are none. */
  photos?: Record<string, string>
}

export interface Filters {
  query: string
  categoryIds: string[]
  methodIds: string[]
  statuses: ItemStatus[]
  tags: string[]
  sort: 'newest' | 'oldest' | 'name' | 'value-high' | 'value-low'
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  categoryIds: [],
  methodIds: [],
  statuses: [],
  tags: [],
  sort: 'newest',
}
