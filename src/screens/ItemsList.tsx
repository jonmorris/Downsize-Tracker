import { useMemo, useState } from 'react'
import { IconFilter, IconPlus, IconSearch, IconX } from '../components/Icons'
import { ItemCard } from '../components/ItemCard'
import { useStore } from '../store'
import { EMPTY_FILTERS, type Filters, type Item } from '../types'
import { FilterSheet } from './FilterSheet'

interface Props {
  filters: Filters
  setFilters: (next: Filters) => void
  onAdd: () => void
  onEdit: (item: Item) => void
  onProcess: (item: Item) => void
  onList: (item: Item) => void
  onRevert: (item: Item) => void
}

const valueOf = (item: Item) => item.actualValue ?? item.estValue ?? 0

export function ItemsList({ filters, setFilters, onAdd, onEdit, onProcess, onList, onRevert }: Props) {
  const { items, categories, methods } = useStore()
  const [showFilters, setShowFilters] = useState(false)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const methodById = useMemo(() => new Map(methods.map((m) => [m.id, m])), [methods])
  const allTags = useMemo(
    () => [...new Set(items.flatMap((i) => i.tags))].sort(),
    [items],
  )

  const activeCount =
    filters.categoryIds.length +
    filters.methodIds.length +
    filters.statuses.length +
    filters.tags.length

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    const matched = items.filter((item) => {
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false
      if (filters.methodIds.length && !filters.methodIds.includes(item.methodId)) return false
      if (filters.categoryIds.length && !(item.categoryId && filters.categoryIds.includes(item.categoryId)))
        return false
      if (filters.tags.length && !filters.tags.some((t) => item.tags.includes(t))) return false
      if (!q) return true
      const haystack = [
        item.name,
        item.notes,
        item.tags.join(' '),
        item.categoryId ? (categoryById.get(item.categoryId)?.label ?? '') : '',
        methodById.get(item.methodId)?.label ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })

    const sorted = [...matched]
    switch (filters.sort) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'value-high':
        sorted.sort((a, b) => valueOf(b) - valueOf(a))
        break
      case 'value-low':
        sorted.sort((a, b) => valueOf(a) - valueOf(b))
        break
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt)
    }
    // Anything still to deal with floats above the finished pile.
    return sorted.sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  }, [items, filters, categoryById, methodById])

  return (
    <div className="screen">
      <div className="searchbar">
        <div className="search-input-wrap">
          <IconSearch />
          <input
            className="input"
            type="search"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search items, notes, tags…"
            aria-label="Search items"
            autoComplete="off"
          />
          {filters.query && (
            <button
              className="icon-btn search-clear"
              onClick={() => setFilters({ ...filters, query: '' })}
              aria-label="Clear search"
            >
              <IconX />
            </button>
          )}
        </div>

        <div className="chips">
          <button
            className={`chip${activeCount ? ' chip--on' : ''}`}
            onClick={() => setShowFilters(true)}
          >
            <IconFilter style={{ width: 15, height: 15 }} /> Filters
            {activeCount > 0 && <span className="count">{activeCount}</span>}
          </button>
          <button
            className="chip"
            aria-pressed={filters.statuses.includes('todo')}
            onClick={() =>
              setFilters({
                ...filters,
                statuses: filters.statuses.includes('todo') ? [] : ['todo'],
              })
            }
          >
            To do
          </button>
          <button
            className="chip"
            aria-pressed={filters.statuses.includes('listed')}
            onClick={() =>
              setFilters({
                ...filters,
                statuses: filters.statuses.includes('listed') ? [] : ['listed'],
              })
            }
          >
            Listed
          </button>
          <button
            className="chip"
            aria-pressed={filters.statuses.includes('done')}
            onClick={() =>
              setFilters({
                ...filters,
                statuses: filters.statuses.includes('done') ? [] : ['done'],
              })
            }
          >
            Done
          </button>
          {(activeCount > 0 || filters.sort !== 'newest') && (
            <button className="chip" onClick={() => setFilters(EMPTY_FILTERS)}>
              <IconX style={{ width: 13, height: 13 }} /> Clear
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <h3>{items.length === 0 ? 'Nothing here yet' : 'No matches'}</h3>
          <p>
            {items.length === 0
              ? 'Add the first thing you want to sell, give away, or bin.'
              : 'Try a different search, or clear your filters.'}
          </p>
          <button className="btn btn--primary" onClick={onAdd}>
            <IconPlus /> Add item
          </button>
        </div>
      ) : (
        <ul className="item-list">
          {visible.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                method={methodById.get(item.methodId)}
                category={item.categoryId ? categoryById.get(item.categoryId) : undefined}
                onProcess={onProcess}
                onList={onList}
                onRevert={onRevert}
                onEdit={onEdit}
              />
            </li>
          ))}
        </ul>
      )}

      {showFilters && (
        <FilterSheet
          filters={filters}
          setFilters={setFilters}
          allTags={allTags}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}
