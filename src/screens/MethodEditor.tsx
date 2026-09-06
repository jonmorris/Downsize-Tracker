import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { ACCENTS, ACCENT_KEYS } from '../defaults'
import { useStore } from '../store'
import type { Method } from '../types'

interface Props {
  method: Method | null
  onClose: () => void
}

export function MethodEditor({ method, onClose }: Props) {
  const { addMethod, updateMethod } = useStore()
  const [label, setLabel] = useState(method?.label ?? '')
  const [doneLabel, setDoneLabel] = useState(method?.doneLabel ?? '')
  const [tracksMoney, setTracksMoney] = useState(method?.tracksMoney ?? false)
  const [canList, setCanList] = useState(method?.canList ?? false)
  const [accent, setAccent] = useState(method?.accent ?? ACCENT_KEYS[0])
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!label.trim()) {
      setError('Give it a name, like "Donate".')
      return
    }
    const payload = {
      label: label.trim(),
      doneLabel: doneLabel.trim() || label.trim(),
      tracksMoney,
      canList,
      accent,
    }
    if (method) await updateMethod(method.id, payload)
    else await addMethod(payload)
    onClose()
  }

  return (
    <Sheet
      title={method ? 'Edit plan' : 'New plan'}
      onClose={onClose}
      footer={
        <button className="btn btn--primary btn--block" onClick={save}>
          {method ? 'Save changes' : 'Add plan'}
        </button>
      }
    >
      {error && <div className="banner">{error}</div>}

      <div className="field">
        <label htmlFor="method-label">Name</label>
        <input
          id="method-label"
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Donate"
          autoComplete="off"
        />
        <span className="hint">How it reads in the item form: "what do you plan to do with it".</span>
      </div>

      <div className="field">
        <label htmlFor="method-done">Once it's handled</label>
        <input
          id="method-done"
          className="input"
          value={doneLabel}
          onChange={(e) => setDoneLabel(e.target.value)}
          placeholder="Donated"
          autoComplete="off"
        />
        <span className="hint">The past tense, used on the item's button and its dashboard tile.</span>
      </div>

      <div className="switch-row">
        <span className="txt">
          <b>Brings in money</b>
          <span>Asks for a final price and counts toward your sales goal.</span>
        </span>
        <button
          className="switch"
          aria-pressed={tracksMoney}
          aria-label="Brings in money"
          onClick={() => setTracksMoney(!tracksMoney)}
        >
          <i />
        </button>
      </div>

      <div className="switch-row">
        <span className="txt">
          <b>Has a listed stage</b>
          <span>Adds a "List it" step for while it's posted and waiting.</span>
        </span>
        <button
          className="switch"
          aria-pressed={canList}
          aria-label="Has a listed stage"
          onClick={() => setCanList(!canList)}
        >
          <i />
        </button>
      </div>

      <div className="field">
        <span className="field-label">Colour</span>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {ACCENT_KEYS.map((key) => (
            <button
              key={key}
              className="chip"
              aria-pressed={accent === key}
              aria-label={key}
              onClick={() => setAccent(key)}
            >
              <i className="swatch" style={{ background: ACCENTS[key] }} />
              {key}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
