import { ACCENTS } from '../defaults'
import type { Category, Item, Method } from '../types'
import { money, relativeDate } from '../util'
import { IconLink, IconPencil, IconUndo } from './Icons'
import { Photo } from './Photo'

interface Props {
  item: Item
  method: Method | undefined
  category: Category | undefined
  onProcess: (item: Item) => void
  onList: (item: Item) => void
  onRevert: (item: Item) => void
  onEdit: (item: Item) => void
}

export function ItemCard({ item, method, category, onProcess, onList, onRevert, onEdit }: Props) {
  const accent = ACCENTS[method?.accent ?? 'slate'] ?? ACCENTS.slate
  const done = item.status === 'done'
  const showActual = done && item.actualValue !== null

  return (
    <article className={`item${done ? ' item--done' : ''}`}>
      <div className="thumb">
        <Photo photoId={item.photoId} alt={item.name} fallback={item.name.charAt(0).toUpperCase() || '?'} />
      </div>

      <div className="item-main">
        <div className="item-title">
          <h3>{item.name}</h3>
          {showActual ? (
            <div className="item-price item-price--actual">
              {money(item.actualValue ?? 0)}
              <small>got</small>
            </div>
          ) : item.estValue !== null ? (
            <div className="item-price">
              {money(item.estValue)}
              <small>est.</small>
            </div>
          ) : null}
        </div>

        <div className="item-meta">
          {item.quantity > 1 && <span className="tag tag--qty">×{item.quantity}</span>}
          <span className="tag tag--method" style={{ background: accent }}>
            {done ? (method?.doneLabel ?? 'Done') : (method?.label ?? 'No method')}
          </span>
          {item.status === 'listed' && <span className="tag tag--status">Listed</span>}
          {category && <span className="tag">{category.label}</span>}
          {item.tags.map((t) => (
            <span key={t} className="tag tag--free">
              #{t}
            </span>
          ))}
          {done && item.processedAt && <span className="tag tag--free">{relativeDate(item.processedAt)}</span>}
        </div>

        {item.notes && <p className="item-notes">{item.notes}</p>}

        <div className="item-actions">
          {!done && (
            <>
              {method?.canList && item.status === 'todo' && (
                <button className="btn btn--sm btn--ghost" onClick={() => onList(item)}>
                  List it
                </button>
              )}
              {method?.canList && item.status === 'listed' && (
                <button className="btn btn--sm btn--quiet" onClick={() => onRevert(item)}>
                  Unlist
                </button>
              )}
              <button className="btn btn--sm btn--primary" onClick={() => onProcess(item)}>
                {method?.doneLabel ?? 'Done'}
              </button>
            </>
          )}
          {done && (
            <button className="btn btn--sm btn--quiet" onClick={() => onRevert(item)}>
              <IconUndo /> Undo
            </button>
          )}
          {item.link && (
            <a
              className="btn btn--sm btn--ghost"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open listing for ${item.name}`}
            >
              <IconLink />
            </a>
          )}
          <button className="btn btn--sm btn--ghost" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}>
            <IconPencil />
          </button>
        </div>
      </div>
    </article>
  )
}
