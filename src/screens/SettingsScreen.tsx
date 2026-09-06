import { useRef, useState } from 'react'
import { IconDownload, IconPencil, IconPlus, IconTrash, IconUpload, IconDown, IconUp } from '../components/Icons'
import { ACCENTS } from '../defaults'
import { useStore } from '../store'
import type { Backup, Method, Settings } from '../types'
import { parseMoney } from '../util'
import { MethodEditor } from './MethodEditor'

interface Props {
  toast: (message: string) => void
}

export function SettingsScreen({ toast }: Props) {
  const store = useStore()
  const { settings, categories, methods, items } = store
  const [newCategory, setNewCategory] = useState('')
  const [editingMethod, setEditingMethod] = useState<Method | null | undefined>(undefined)
  const importRef = useRef<HTMLInputElement>(null)

  const setGoal = (key: 'moneyGoal' | 'itemGoal', raw: string) => {
    const n = parseMoney(raw)
    void store.saveSettings({ [key]: n === null ? 0 : Math.max(0, n) } as Partial<Settings>)
  }

  const exportBackup = async () => {
    const backup = await store.exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `downsize-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Backup downloaded')
  }

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Backup
      const mode = confirm(
        'Replace everything with this backup?\n\nOK = replace all current data.\nCancel = merge it into what you already have.',
      )
        ? 'replace'
        : 'merge'
      await store.importBackup(parsed, mode)
      toast(mode === 'replace' ? 'Backup restored' : 'Backup merged in')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That file could not be read.')
    }
  }

  const usedCount = (id: string, kind: 'category' | 'method') =>
    items.filter((i) => (kind === 'category' ? i.categoryId === id : i.methodId === id)).length

  const itemsLabel = (n: number) => `${n} item${n === 1 ? '' : 's'}`

  return (
    <div className="screen">
      <section className="section">
        <h2>Goals</h2>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label htmlFor="goal-money">Money to make</label>
            <div className="money-input">
              <span>$</span>
              <input
                id="goal-money"
                className="input"
                defaultValue={settings.moneyGoal || ''}
                onBlur={(e) => setGoal('moneyGoal', e.target.value)}
                inputMode="decimal"
                placeholder="1000"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="goal-items">Items to clear out</label>
            <input
              id="goal-items"
              className="input"
              defaultValue={settings.itemGoal || ''}
              onBlur={(e) => setGoal('itemGoal', e.target.value)}
              inputMode="numeric"
              placeholder="50"
            />
          </div>
          <div className="field">
            <span className="field-label">Item goal counts</span>
            <div className="segmented">
              <button
                aria-pressed={settings.itemGoalCounts === 'all'}
                onClick={() => void store.saveSettings({ itemGoalCounts: 'all' })}
              >
                Everything handled
              </button>
              <button
                aria-pressed={settings.itemGoalCounts === 'money'}
                onClick={() => void store.saveSettings({ itemGoalCounts: 'money' })}
              >
                Sales only
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Plans — what you do with things</h2>
        <ul className="list">
          {methods.map((m, index) => (
            <li key={m.id}>
              <div className="list-row">
                <i className="swatch" style={{ background: ACCENTS[m.accent] ?? ACCENTS.slate }} />
                <span className="grow">
                  <span className="name">
                    {m.label}
                    {m.archived ? ' (hidden)' : ''}
                  </span>
                  <span className="sub">
                    {[
                      `→ ${m.doneLabel}`,
                      m.tracksMoney ? 'counts toward $ goal' : null,
                      m.canList ? 'has a listed stage' : null,
                      usedCount(m.id, 'method') > 0 ? itemsLabel(usedCount(m.id, 'method')) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <div className="order-btns">
                  <button onClick={() => void store.moveMethod(m.id, -1)} disabled={index === 0} aria-label={`Move ${m.label} up`}>
                    <IconUp />
                  </button>
                  <button
                    onClick={() => void store.moveMethod(m.id, 1)}
                    disabled={index === methods.length - 1}
                    aria-label={`Move ${m.label} down`}
                  >
                    <IconDown />
                  </button>
                  <button onClick={() => setEditingMethod(m)} aria-label={`Edit ${m.label}`}>
                    <IconPencil />
                  </button>
                  <button
                    onClick={() => {
                      const used = usedCount(m.id, 'method')
                      const message = used
                        ? `${used} item(s) still use "${m.label}". It will be hidden from the dropdown but kept on those items. Continue?`
                        : `Delete "${m.label}"?`
                      if (confirm(message)) void store.removeMethod(m.id)
                    }}
                    aria-label={`Delete ${m.label}`}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn btn--ghost btn--block" onClick={() => setEditingMethod(null)}>
          <IconPlus /> New plan
        </button>
      </section>

      <section className="section">
        <h2>Categories</h2>
        <ul className="list">
          {categories.map((c, index) => (
            <li key={c.id}>
              <div className="list-row">
                <span className="grow">
                  <input
                    className="inline-input"
                    defaultValue={c.label}
                    aria-label={`Rename ${c.label}`}
                    onBlur={(e) => {
                      const label = e.target.value.trim()
                      if (label && label !== c.label) void store.updateCategory(c.id, { label })
                      else e.target.value = c.label
                    }}
                  />
                  <span className="sub">
                    {[
                      c.archived ? 'hidden' : null,
                      usedCount(c.id, 'category') > 0 ? itemsLabel(usedCount(c.id, 'category')) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'unused'}
                  </span>
                </span>
                <div className="order-btns">
                  <button onClick={() => void store.moveCategory(c.id, -1)} disabled={index === 0} aria-label={`Move ${c.label} up`}>
                    <IconUp />
                  </button>
                  <button
                    onClick={() => void store.moveCategory(c.id, 1)}
                    disabled={index === categories.length - 1}
                    aria-label={`Move ${c.label} down`}
                  >
                    <IconDown />
                  </button>
                  <button
                    onClick={() => {
                      const used = usedCount(c.id, 'category')
                      const message = used
                        ? `${used} item(s) are in "${c.label}". It will be hidden from the dropdown but kept on those items. Continue?`
                        : `Delete "${c.label}"?`
                      if (confirm(message)) void store.removeCategory(c.id)
                    }}
                    aria-label={`Delete ${c.label}`}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="row">
          <input
            className="input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCategory.trim()) {
                void store.addCategory(newCategory)
                setNewCategory('')
              }
            }}
            placeholder="New category"
            autoComplete="off"
            aria-label="New category"
          />
          <button
            className="btn btn--ghost"
            style={{ flex: '0 0 auto' }}
            disabled={!newCategory.trim()}
            onClick={() => {
              void store.addCategory(newCategory)
              setNewCategory('')
            }}
          >
            <IconPlus /> Add
          </button>
        </div>
      </section>

      <section className="section">
        <h2>Appearance</h2>
        <div className="segmented">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button key={t} aria-pressed={settings.theme === t} onClick={() => void store.saveSettings({ theme: t })}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Your data</h2>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="hint" style={{ fontSize: 13 }}>
            Everything lives on this device only — {items.length} entr{items.length === 1 ? 'y' : 'ies'} so far.
            Clearing your browser data would wipe it, so export a backup now and then.
          </p>
          <button className="btn btn--ghost btn--block" onClick={() => void exportBackup()}>
            <IconDownload /> Export backup
          </button>
          <button className="btn btn--ghost btn--block" onClick={() => importRef.current?.click()}>
            <IconUpload /> Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importBackup(file)
              e.target.value = ''
            }}
          />
          <button
            className="btn btn--danger btn--block"
            onClick={() => {
              if (confirm('Delete every item, category and plan, and reset your goals? This cannot be undone.')) {
                void store.resetEverything().then(() => toast('Everything reset'))
              }
            }}
          >
            <IconTrash /> Reset everything
          </button>
        </div>
      </section>

      {editingMethod !== undefined && (
        <MethodEditor method={editingMethod} onClose={() => setEditingMethod(undefined)} />
      )}
    </div>
  )
}
