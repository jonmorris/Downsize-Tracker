import { useMemo } from 'react'
import { useStore } from './store'
import type { Item, Method } from './types'
import { pct } from './util'

export interface MethodCount {
  method: Method
  count: number
}

export interface Stats {
  total: number
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

    const done = items.filter((i) => i.status === 'done')
    const moneyEarned = done.reduce((sum, i) => sum + (tracksMoney(i) ? (i.actualValue ?? 0) : 0), 0)
    const itemsDone =
      settings.itemGoalCounts === 'money' ? done.filter(tracksMoney).length : done.length
    const estRemaining = items
      .filter((i) => i.status !== 'done' && tracksMoney(i))
      .reduce((sum, i) => sum + (i.estValue ?? 0), 0)

    return {
      total: items.length,
      moneyEarned,
      moneyGoal: settings.moneyGoal,
      moneyPct: pct(moneyEarned, settings.moneyGoal),
      itemsDone,
      itemGoal: settings.itemGoal,
      itemPct: pct(itemsDone, settings.itemGoal),
      todo: items.filter((i) => i.status === 'todo').length,
      listed: items.filter((i) => i.status === 'listed').length,
      hasListing: methods.some((m) => m.canList && !m.archived),
      doneByMethod: methods
        .filter((m) => !m.archived || done.some((i) => i.methodId === m.id))
        .map((method) => ({
          method,
          count: done.filter((i) => i.methodId === method.id).length,
        })),
      estRemaining,
    }
  }, [items, methods, settings])
}
