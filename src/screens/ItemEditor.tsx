import { useEffect, useMemo, useRef, useState } from 'react'
import { IconCamera, IconTrash, IconX } from '../components/Icons'
import { Photo } from '../components/Photo'
import { Sheet } from '../components/Sheet'
import { useStore } from '../store'
import type { Item } from '../types'
import { normalizeTag, parseCount, parseMoney } from '../util'

interface Props {
  item: Item | null
  onClose: () => void
  onSaved?: (message: string) => void
}

export function ItemEditor({ item, onClose, onSaved }: Props) {
  const { categories, methods, addItem, updateItem, deleteItem } = useStore()
  const liveMethods = useMemo(() => methods.filter((m) => !m.archived || m.id === item?.methodId), [methods, item])
  const liveCategories = useMemo(
    () => categories.filter((c) => !c.archived || c.id === item?.categoryId),
    [categories, item],
  )

  const [name, setName] = useState(item?.name ?? '')
  const [methodId, setMethodId] = useState(item?.methodId ?? liveMethods[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')
  const [value, setValue] = useState(item?.estValue !== null && item ? String(item.estValue) : '')
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1')
  const [tags, setTags] = useState<string[]>(item?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [link, setLink] = useState(item?.link ?? '')
  /** undefined = leave as-is, null = remove, File = replace */
  const [photo, setPhoto] = useState<File | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => {
    if (!item) nameRef.current?.focus()
  }, [item])

  const commitTag = () => {
    const clean = normalizeTag(tagDraft)
    if (clean && !tags.includes(clean)) setTags([...tags, clean])
    setTagDraft('')
  }

  const save = async () => {
    if (!name.trim()) {
      setError('Give it a name first.')
      nameRef.current?.focus()
      return
    }
    if (!methodId) {
      setError('Pick what you plan to do with it.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const common = {
        name: name.trim(),
        categoryId: categoryId || null,
        methodId,
        quantity: parseCount(quantity),
        estValue: parseMoney(value),
        tags,
        notes,
        link: link.trim(),
      }
      if (item) {
        await updateItem(item.id, common, photo)
        onSaved?.('Saved')
      } else {
        await addItem(common, photo ?? null)
        onSaved?.('Added')
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.')
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    await deleteItem(item.id)
    onSaved?.('Deleted')
    onClose()
  }

  const showPhoto = photo !== null && (previewUrl || item?.photoId)

  return (
    <Sheet
      title={item ? 'Edit item' : 'Add item'}
      onClose={onClose}
      footer={
        <>
          {item && (
            <button className="btn btn--danger" onClick={remove} aria-label="Delete item">
              <IconTrash />
            </button>
          )}
          <button className="btn btn--primary btn--block" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : item ? 'Save changes' : 'Add item'}
          </button>
        </>
      }
    >
      {error && <div className="banner">{error}</div>}

      <div className="field">
        <label htmlFor="item-name">Item</label>
        <input
          id="item-name"
          ref={nameRef}
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nintendo Switch, box of Pokémon cards…"
          enterKeyHint="done"
          autoComplete="off"
        />
      </div>

      <div className="photo-picker">
        <div className="photo-preview">
          {showPhoto ? (
            previewUrl ? (
              <img src={previewUrl} alt="Selected" />
            ) : (
              <Photo photoId={item?.photoId ?? null} alt="Item" fallback="" />
            )
          ) : (
            <IconCamera />
          )}
        </div>
        <div className="row" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn btn--sm btn--ghost" onClick={() => fileRef.current?.click()}>
            {showPhoto ? 'Replace photo' : 'Add photo'}
          </button>
          {showPhoto && (
            <button className="btn btn--sm btn--quiet" onClick={() => setPhoto(null)}>
              <IconX /> Remove
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setPhoto(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="item-method">Plan</label>
          <select
            id="item-method"
            className="select"
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
          >
            {liveMethods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="item-category">Category</label>
          <select
            id="item-category"
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {liveCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="item-value">Estimated value</label>
          <div className="money-input">
            <span>$</span>
            <input
              id="item-value"
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="item-quantity">How many</label>
          <input
            id="item-quantity"
            className="input"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={() => setQuantity(String(parseCount(quantity)))}
            inputMode="numeric"
          />
        </div>
      </div>
      <span className="hint">
        One entry can cover a pile — "all my Pokémon cards" as 50 counts 50 toward your item goal.
        The value is for the whole lot.
      </span>

      <div className="field">
        <span className="field-label">Tags</span>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {tags.map((t) => (
            <button key={t} className="chip chip--on" onClick={() => setTags(tags.filter((x) => x !== t))}>
              #{t} <IconX style={{ width: 12, height: 12 }} />
            </button>
          ))}
        </div>
        <input
          className="input"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commitTag()
            }
          }}
          onBlur={commitTag}
          placeholder="attic, ebay-lot-3…"
          enterKeyHint="done"
          autoComplete="off"
        />
        <span className="hint">Press enter after each tag.</span>
      </div>

      <div className="field">
        <label htmlFor="item-link">Listing link</label>
        <input
          id="item-link"
          className="input"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          type="url"
          inputMode="url"
          placeholder="https://…"
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="item-notes">Notes</label>
        <textarea
          id="item-notes"
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Condition, where it is, who it's promised to…"
        />
      </div>
    </Sheet>
  )
}
