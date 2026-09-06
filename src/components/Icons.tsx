type P = { className?: string; style?: React.CSSProperties }
const base = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconHome = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5V14h-7v6.5H5A1.5 1.5 0 0 1 3.5 19z" /></svg>
)
export const IconList = (p: P) => (
  <svg {...base} {...p}><path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" /></svg>
)
export const IconGear = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-2.55 1.06V20a1.8 1.8 0 1 1-3.6 0v-.1A1.5 1.5 0 0 0 8.9 18.5a1.5 1.5 0 0 0-1.65.3l-.05.05A1.8 1.8 0 1 1 4.65 16.3l.05-.05A1.5 1.5 0 0 0 3.64 13.7H3.5a1.8 1.8 0 1 1 0-3.6h.1A1.5 1.5 0 0 0 5.5 8.9a1.5 1.5 0 0 0-.3-1.65l-.05-.05A1.8 1.8 0 1 1 7.7 4.65l.05.05a1.5 1.5 0 0 0 1.65.3h.1A1.5 1.5 0 0 0 10.4 3.6V3.5a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65v.1a1.5 1.5 0 0 0 1.37.9h.14a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.37.9z" /></svg>
)
export const IconPlus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></svg>
)
export const IconX = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const IconUp = (p: P) => <svg {...base} {...p}><path d="m6 14 6-6 6 6" /></svg>
export const IconDown = (p: P) => <svg {...base} {...p}><path d="m6 10 6 6 6-6" /></svg>
export const IconCamera = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 8.5h3l1.6-2.4h6.8l1.6 2.4h3A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8a1.5 1.5 0 0 1 .5-1.5z" /><circle cx="12" cy="13.5" r="3.4" /></svg>
)
export const IconTrash = (p: P) => (
  <svg {...base} {...p}><path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7M7 6.5l.8 12.2a1.4 1.4 0 0 0 1.4 1.3h5.6a1.4 1.4 0 0 0 1.4-1.3L17 6.5" /></svg>
)
export const IconPencil = (p: P) => (
  <svg {...base} {...p}><path d="M16.5 3.9a2 2 0 0 1 2.8 2.8L7.6 18.4l-3.8 1 1-3.8z" /></svg>
)
export const IconFilter = (p: P) => (
  <svg {...base} {...p}><path d="M4 6.5h16M7 12h10M10.5 17.5h3" /></svg>
)
export const IconCheck = (p: P) => <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>
export const IconUndo = (p: P) => (
  <svg {...base} {...p}><path d="M4 9.5h9.5a5.5 5.5 0 1 1 0 11H8" /><path d="m7.5 5.5-3.5 4 3.5 4" /></svg>
)
export const IconTag = (p: P) => (
  <svg {...base} {...p}><path d="M11.6 3.5H20v8.4l-8.7 8.7a1.6 1.6 0 0 1-2.3 0l-6.1-6.1a1.6 1.6 0 0 1 0-2.3z" /><circle cx="16.2" cy="7.8" r="1.3" /></svg>
)
export const IconLink = (p: P) => (
  <svg {...base} {...p}><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7l-1.3 1.3" /><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.3-1.3" /></svg>
)
export const IconDownload = (p: P) => (
  <svg {...base} {...p}><path d="M12 4v11m0 0 4-4m-4 4-4-4M4.5 19.5h15" /></svg>
)
export const IconUpload = (p: P) => (
  <svg {...base} {...p}><path d="M12 19.5v-11m0 0 4 4m-4-4-4 4M4.5 4.5h15" /></svg>
)
