import { Sheet } from '../components/Sheet'
import { ACCENTS } from '../defaults'
import { useStore } from '../store'
import { EMPTY_FILTERS, type Filters, type ItemStatus } from '../types'

interface Props {
  filters: Filters
  setFilters: (next: Filters) => void
  allTags: string[]
  onClose: () => void
}

const SORTS: { id: Filters['sort']; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'name', label: 'A–Z' },
  { id: 'value-high', label: '$ high' },
  { id: 'value-low', label: '$ low' },
]

const STATUSES: { id: ItemStatus; label: string }[] = [
  { id: 'todo', label: 'Not dealt with' },
  { id: 'listed', label: 'Listed' },
  { id: 'done', label: 'Done' },
]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function FilterSheet({ filters, setFilters, allTags, onClose }: Props) {
  const { categories, methods } = useStore()

  return (
    <Sheet
      title="Filter & sort"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn btn--ghost"
            onClick={() => setFilters({ ...EMPTY_FILTERS, query: filters.query })}
          >
            Reset
          </button>
          <button className="btn btn--primary btn--block" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="field">
        <span className="field-label">Status</span>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className="chip"
              aria-pressed={filters.statuses.includes(s.id)}
              onClick={() => setFilters({ ...filters, statuses: toggle(filters.statuses, s.id) })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Plan</span>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {methods.map((m) => (
            <button
              key={m.id}
              className="chip"
              aria-pressed={filters.methodIds.includes(m.id)}
              onClick={() => setFilters({ ...filters, methodIds: toggle(filters.methodIds, m.id) })}
            >
              <i className="dot" style={{ background: ACCENTS[m.accent] ?? ACCENTS.slate }} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Category</span>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              className="chip"
              aria-pressed={filters.categoryIds.includes(c.id)}
              onClick={() => setFilters({ ...filters, categoryIds: toggle(filters.categoryIds, c.id) })}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="field">
          <span className="field-label">Tags</span>
          <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
            {allTags.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={filters.tags.includes(t)}
                onClick={() => setFilters({ ...filters, tags: toggle(filters.tags, t) })}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <span className="field-label">Sort by</span>
        <div className="segmented">
          {SORTS.map((s) => (
            <button
              key={s.id}
              aria-pressed={filters.sort === s.id}
              onClick={() => setFilters({ ...filters, sort: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
