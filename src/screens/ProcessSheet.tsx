import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { useStore } from '../store'
import type { Item, Method } from '../types'
import { money, parseMoney } from '../util'

interface Props {
  item: Item
  method: Method | undefined
  onClose: () => void
  onDone?: (message: string) => void
}

/** Asks for the real sale price when a money-tracking item is marked done. */
export function ProcessSheet({ item, method, onClose, onDone }: Props) {
  const { processItem } = useStore()
  const [price, setPrice] = useState(item.estValue !== null ? String(item.estValue) : '')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 80)
    return () => clearTimeout(id)
  }, [])

  const confirm = async (amount: number | null) => {
    setBusy(true)
    await processItem(item.id, amount)
    onDone?.(amount ? `${method?.doneLabel ?? 'Done'} for ${money(amount)}` : (method?.doneLabel ?? 'Done'))
    onClose()
  }

  const parsed = parseMoney(price)

  return (
    <Sheet
      title={`${method?.doneLabel ?? 'Done'}: ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={() => void confirm(null)} disabled={busy}>
            Skip
          </button>
          <button className="btn btn--primary btn--block" onClick={() => void confirm(parsed)} disabled={busy}>
            Log {parsed !== null ? money(parsed) : 'sale'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="sale-price">What did it actually go for?</label>
        <div className="money-input money-input--big">
          <span>$</span>
          <input
            id="sale-price"
            ref={inputRef}
            className="input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            enterKeyHint="done"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirm(parsed)
            }}
          />
        </div>
        <span className="hint">
          {item.estValue !== null
            ? `You estimated ${money(item.estValue)}. This is what counts toward your goal.`
            : 'This is what counts toward your goal.'}
        </span>
      </div>
    </Sheet>
  )
}
