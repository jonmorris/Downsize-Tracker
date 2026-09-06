import type { Category, Method, Settings } from './types'

export const ACCENTS: Record<string, string> = {
  terracotta: '#c4643f',
  olive: '#6f7f4b',
  sky: '#4a7c93',
  plum: '#8b5f7d',
  clay: '#a8794a',
  slate: '#6b7280',
}

export const ACCENT_KEYS = Object.keys(ACCENTS)

export const DEFAULT_SETTINGS: Settings = {
  moneyGoal: 1000,
  itemGoal: 50,
  theme: 'system',
  itemGoalCounts: 'all',
}

export const DEFAULT_METHODS: Method[] = [
  { id: 'm_sell', label: 'Sell', doneLabel: 'Sold', tracksMoney: true, canList: true, accent: 'olive', order: 0, archived: false },
  { id: 'm_give', label: 'Give away', doneLabel: 'Given away', tracksMoney: false, canList: false, accent: 'sky', order: 1, archived: false },
  { id: 'm_toss', label: 'Throw away', doneLabel: 'Thrown away', tracksMoney: false, canList: false, accent: 'slate', order: 2, archived: false },
]

export const DEFAULT_CATEGORIES: Category[] = [
  'Technology',
  'Video Games',
  'Card Games',
  'Board Games',
  'Clothing',
  'Miscellaneous',
].map((label, order) => ({
  id: 'c_' + label.toLowerCase().replace(/\s+/g, '_'),
  label,
  order,
  archived: false,
}))
