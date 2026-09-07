import { useMemo } from 'react'
import { ACCENTS } from '../defaults'
import { useStats } from '../stats'
import { useStore } from '../store'
import type { Filters } from '../types'
import { money, moneyShort, pct } from '../util'
import { IconPlus } from '../components/Icons'

interface Props {
  onAdd: () => void
  onJump: (filters: Partial<Filters>) => void
}

export function Dashboard({ onAdd, onJump }: Props) {
  const s = useStats()
  const { items, methods } = useStore()

  // The few highest-value things still in the house, to fill the gap under the
  // stats with something actionable rather than empty paper.
  const shelf = useMemo(() => {
    const moneyMethods = new Set(methods.filter((m) => m.tracksMoney).map((m) => m.id))
    return items
      .filter((i) => i.status !== 'done' && moneyMethods.has(i.methodId) && (i.estValue ?? 0) > 0)
      .sort((a, b) => (b.estValue ?? 0) - (a.estValue ?? 0))
      .slice(0, 5)
  }, [items, methods])
  const remaining = Math.max(0, s.moneyGoal - s.moneyEarned)
  // Where the goal lands if everything still on the shelf sells at its estimate.
  const projected = s.moneyEarned + s.estRemaining
  const projectedPct = pct(projected, s.moneyGoal)
  const itemsLeft = Math.max(0, s.itemGoal - s.itemsDone)

  return (
    <div className="screen screen--fit">
      <section className="card goal-hero">
        <div className="goal-row">
          <span className="label">Sales goal</span>
          <span className="goal-pct">{s.moneyPct}%</span>
        </div>
        <div className="amount">{money(s.moneyEarned)}</div>
        <div className="bar bar--layered">
          {s.estRemaining > 0 && <i className="bar-projected" style={{ width: `${projectedPct}%` }} />}
          <i style={{ width: `${s.moneyPct}%` }} />
        </div>
        <div className="of">
          of <b>{money(s.moneyGoal)}</b>
          {remaining > 0 ? ` · ${money(remaining)} to go` : ' · goal reached 🎉'}
        </div>
        {s.estRemaining > 0 && (
          <div className="legend">
            <span>
              <i className="dot dot--sold" />
              <b>{money(s.moneyEarned)}</b> sold
            </span>
            <span>
              <i className="dot dot--projected" />
              <b>{money(projected)}</b> if it all sells at estimate
            </span>
          </div>
        )}
      </section>

      <section className="card card--flat goal-mini">
        <div className="line">
          <span>Items out the door</span>
          <b>
            {s.itemsDone} / {s.itemGoal}
          </b>
        </div>
        <div className="bar bar--thin">
          <i style={{ width: `${s.itemPct}%` }} />
        </div>
        <div className="line">
          <span>{itemsLeft > 0 ? `${itemsLeft} to go` : 'Goal reached 🎉'}</span>
          <span>{s.estRemaining > 0 ? `${money(s.estRemaining)} still on the shelf` : ''}</span>
        </div>
      </section>

      {s.total === 0 ? (
        <div className="empty">
          <h3>Nothing tracked yet</h3>
          <p>Add the first thing you want out of the house and your goals start filling in.</p>
        </div>
      ) : (
        <section className="stats">
          <button className="stat" onClick={() => onJump({ statuses: ['todo'] })}>
            <span className="n">{s.todo}</span>
            <span className="t">Not dealt with</span>
          </button>

          {s.hasListing && (
            <button className="stat" onClick={() => onJump({ statuses: ['listed'] })}>
              <span className="n">{s.listed}</span>
              <span className="t">Listed</span>
            </button>
          )}

          {s.doneByMethod.map(({ method, count }) => (
            <button
              key={method.id}
              className="stat"
              onClick={() => onJump({ statuses: ['done'], methodIds: [method.id] })}
            >
              <span className="n">{count}</span>
              <span className="t">
                <i className="dot" style={{ background: ACCENTS[method.accent] ?? ACCENTS.slate }} />
                {method.doneLabel}
              </span>
            </button>
          ))}

          <button className="stat" onClick={() => onJump({ statuses: ['todo', 'listed'] })}>
            <span className="n">{moneyShort(s.estRemaining)}</span>
            <span className="t">Est. still to sell</span>
          </button>
        </section>
      )}

      {shelf.length > 0 && (
        <section className="card card--flat shelf">
          <div className="shelf-head">
            <span className="label">Worth the most, still here</span>
            <button onClick={() => onJump({ statuses: ['todo', 'listed'] })}>See all</button>
          </div>
          <ul>
            {shelf.map((item) => (
              <li key={item.id}>
                <span className="nm">{item.name}</span>
                <span className="vl">{money(item.estValue ?? 0)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="add-cta">
        <button className="btn btn--primary btn--block" onClick={onAdd}>
          <IconPlus /> Add item
        </button>
      </div>
    </div>
  )
}
