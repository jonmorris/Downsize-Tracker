import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconGear, IconHome, IconList } from './components/Icons'
import { Dashboard } from './screens/Dashboard'
import { ItemEditor } from './screens/ItemEditor'
import { ItemsList } from './screens/ItemsList'
import { ProcessSheet } from './screens/ProcessSheet'
import { SettingsScreen } from './screens/SettingsScreen'
import { useStats } from './stats'
import { useStore } from './store'
import { EMPTY_FILTERS, type Filters, type Item } from './types'

type Tab = 'home' | 'items' | 'settings'

const TABS: { id: Tab; label: string; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'items', label: 'Items', Icon: IconList },
  { id: 'settings', label: 'Settings', Icon: IconGear },
]

export function App() {
  const { ready, error, methods, setStatus, processItem } = useStore()
  const stats = useStats()
  const [tab, setTab] = useState<Tab>('home')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  /** undefined = closed, null = adding, Item = editing */
  const [editing, setEditing] = useState<Item | null | undefined>(undefined)
  const [pricing, setPricing] = useState<Item | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const methodById = useMemo(() => new Map(methods.map((m) => [m.id, m])), [methods])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  const jump = useCallback((next: Partial<Filters>) => {
    setFilters({ ...EMPTY_FILTERS, ...next })
    setTab('items')
  }, [])

  const onProcess = useCallback(
    (item: Item) => {
      const method = methodById.get(item.methodId)
      if (method?.tracksMoney) {
        setPricing(item)
        return
      }
      void processItem(item.id, null).then(() => setToast(method?.doneLabel ?? 'Done'))
    },
    [methodById, processItem],
  )

  const onList = useCallback(
    (item: Item) => {
      void setStatus(item.id, 'listed').then(() => setToast('Marked as listed'))
    },
    [setStatus],
  )

  const onRevert = useCallback(
    (item: Item) => {
      void setStatus(item.id, 'todo').then(() => setToast('Back on the pile'))
    },
    [setStatus],
  )

  if (!ready) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    )
  }

  // Entries can cover several things each, so say both numbers when they differ.
  const itemsSubtitle =
    stats.total === stats.entries
      ? `${stats.total} item${stats.total === 1 ? '' : 's'} tracked`
      : `${stats.total} items across ${stats.entries} entries`

  const subtitle =
    tab === 'items'
      ? itemsSubtitle
      : tab === 'settings'
        ? 'Goals, plans, categories, backups'
        : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{tab === 'items' ? 'Everything' : tab === 'settings' ? 'Settings' : 'Downsize'}</h1>
          <span className="sub">{subtitle}</span>
        </div>
      </header>

      {error && (
        <div style={{ padding: '0 16px' }}>
          <div className="banner">{error}</div>
        </div>
      )}

      {tab === 'home' && <Dashboard onAdd={() => setEditing(null)} onJump={jump} />}
      {tab === 'items' && (
        <ItemsList
          filters={filters}
          setFilters={setFilters}
          onAdd={() => setEditing(null)}
          onEdit={setEditing}
          onProcess={onProcess}
          onList={onList}
          onRevert={onRevert}
        />
      )}
      {tab === 'settings' && <SettingsScreen toast={setToast} />}

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            aria-label={label}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {editing !== undefined && (
        <ItemEditor item={editing} onClose={() => setEditing(undefined)} onSaved={setToast} />
      )}
      {pricing && (
        <ProcessSheet
          item={pricing}
          method={methodById.get(pricing.methodId)}
          onClose={() => setPricing(null)}
          onDone={setToast}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
