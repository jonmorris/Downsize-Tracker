import { useMemo } from 'react'
import { useStore } from './store'
import type { Item, Method } from './types'
import { pct } from './util'

export interface MethodCount {
  method: Method
  count: number
}

export interface Stats {
  /** Total things tracked, summing quantities. */
  total: number
  /** Number of rows in the list, which is smaller when entries cover many things. */
  entries: number
  moneyEarned: number
  moneyGoal: number
  moneyPct: number
  itemsDone: number
  itemGoal: number
  itemPct: number
  todo: number
  listed: number
  hasListing: boolean
  doneByMethod: MethodCount[]
  estRemaining: number
}

export function useStats(): Stats {
  const { items, methods, settings } = useStore()

  return useMemo(() => {
    const methodById = new Map(methods.map((m) => [m.id, m]))
    const tracksMoney = (item: Item) => methodById.get(item.methodId)?.tracksMoney ?? false

    // An entry can cover many things ("all my Pokémon cards" = 50), so every
    // item count sums quantity. Money stays per-entry: a lot sells for one price.
    const count = (list: Item[]) => list.reduce((sum, i) => sum + i.quantity, 0)

    const done = items.filter((i) => i.status === 'done')
    const moneyEarned = done.reduce((sum, i) => sum + (tracksMoney(i) ? (i.actualValue ?? 0) : 0), 0)
    const itemsDone = count(settings.itemGoalCounts === 'money' ? done.filter(tracksMoney) : done)
    const estRemaining = items
      .filter((i) => i.status !== 'done' && tracksMoney(i))
      .reduce((sum, i) => sum + (i.estValue ?? 0), 0)

    return {
      total: count(items),
      entries: items.length,
      moneyEarned,
      moneyGoal: settings.moneyGoal,
      moneyPct: pct(moneyEarned, settings.moneyGoal),
      itemsDone,
      itemGoal: settings.itemGoal,
      itemPct: pct(itemsDone, settings.itemGoal),
      todo: count(items.filter((i) => i.status === 'todo')),
      listed: count(items.filter((i) => i.status === 'listed')),
      hasListing: methods.some((m) => m.canList && !m.archived),
      doneByMethod: methods
        .filter((m) => !m.archived || done.some((i) => i.methodId === m.id))
        .map((method) => ({
          method,
          count: count(done.filter((i) => i.methodId === method.id)),
        })),
      estRemaining,
    }
  }, [items, methods, settings])
}
