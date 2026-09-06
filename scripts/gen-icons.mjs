// Generates the PWA icon set as PNGs with no image dependencies.
// The mark: a cream arrow dropping into an open-top tray, on terracotta.
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const BG = [0xc4, 0x64, 0x3f]
const FG = [0xfa, 0xf7, 0xf2]

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const inRoundedRect = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.max(x0 + r, Math.min(x1 - r, x))
  const cy = Math.max(y0 + r, Math.min(y1 - r, y))
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= x0 + r && x <= x1 - r) || (y >= y0 + r && y <= y1 - r)
}

const inTriangle = (x, y, ax, ay, bx, by, cx, cy) => {
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
  const a = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d
  const b = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d
  return a >= 0 && b >= 0 && a + b <= 1
}

// Glyph in unit space, scaled about the centre so maskable icons keep safe padding.
function inGlyph(ux, uy, scale) {
  const x = 0.5 + (ux - 0.5) / scale
  const y = 0.5 + (uy - 0.5) / scale
  if (inRoundedRect(x, y, 0.455, 0.15, 0.545, 0.44, 0.03)) return true
  if (inTriangle(x, y, 0.34, 0.395, 0.66, 0.395, 0.5, 0.6)) return true
  if (inRoundedRect(x, y, 0.225, 0.5, 0.325, 0.85, 0.035)) return true
  if (inRoundedRect(x, y, 0.675, 0.5, 0.775, 0.85, 0.035)) return true
  if (inRoundedRect(x, y, 0.225, 0.75, 0.775, 0.85, 0.035)) return true
  return false
}

function render(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const radius = maskable ? 0 : 0.2235
  const glyphScale = maskable ? 0.62 : 1
  const S = 3 // supersampling grid per axis
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0
      let fg = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const ux = (x + (sx + 0.5) / S) / size
          const uy = (y + (sy + 0.5) / S) / size
          const onBg = radius === 0 || inRoundedRect(ux, uy, 0, 0, 1, 1, radius)
          if (!onBg) continue
          bg++
          if (inGlyph(ux, uy, glyphScale)) fg++
        }
      }
      const total = S * S
      const alpha = bg / total
      const mix = bg === 0 ? 0 : fg / bg
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(BG[c] * (1 - mix) + FG[c] * mix)
      px[i + 3] = Math.round(alpha * 255)
    }
  }
  return encodePng(size, size, px)
}

mkdirSync(OUT, { recursive: true })
const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
]
for (const [name, size, opts] of targets) {
  writeFileSync(join(OUT, name), render(size, opts))
  console.log('wrote', name, size)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22.35" fill="#c4643f"/>
  <g fill="#faf7f2">
    <rect x="45.5" y="15" width="9" height="29" rx="3"/>
    <path d="M34 39.5 H66 L50 60 Z"/>
    <rect x="22.5" y="50" width="10" height="35" rx="3.5"/>
    <rect x="67.5" y="50" width="10" height="35" rx="3.5"/>
    <rect x="22.5" y="75" width="55" height="10" rx="3.5"/>
  </g>
</svg>
`
writeFileSync(join(OUT, 'favicon.svg'), svg)
console.log('wrote favicon.svg')
