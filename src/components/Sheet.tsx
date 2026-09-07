import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from './Icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Bottom sheet used for every modal flow: add/edit, filters, price entry.
 *
 * Rendered through a portal on <body> rather than in place. Sheets opened from
 * inside a screen (the plan editor, the filter sheet) sit within `.screen`,
 * which scrolls with `-webkit-overflow-scrolling: touch`; on iOS that makes a
 * scroll container a containing block for `position: fixed` descendants, so the
 * sheet anchored itself to the screen instead of the viewport and its footer
 * ended up under the tab bar. The portal puts every sheet outside that
 * container, and outside any ancestor stacking context.
 */
export function Sheet({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="sheet">
        <div className="grabber" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
