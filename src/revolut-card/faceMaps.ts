/**
 * Canvas-baked face maps for the Revolut card.
 * Albedo / roughness / normal (from height) for etched wordmark, recessed chip, name.
 */

import wordmarkUrl from '../assets/revolut-card/Revolut-Wordmark.svg?url'
import chipUrl from '../assets/revolut-card/Chip-Card.svg?url'
import type { Gpu, Texture } from 'vgpu'

export const FACE_MAP_W = 1024
export const FACE_MAP_H = Math.round(FACE_MAP_W / (85.6 / 53.98))

const ROUGH_FACE = 0.045
const ROUGH_CHIP = 0.28
const ROUGH_ETCH = 0.4

/** Height: 1 = face, lower = carved in. */
const H_FACE = 1
const H_CHIP = 0.36
const H_CHIP_PAD = 0.16
const H_ETCH = 0.08

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  return img
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
  ctx.fill()
}

/** Solid fill punched by alpha of `img`. */
function stampedFill(
  img: CanvasImageSource,
  dw: number,
  dh: number,
  fill: string,
): HTMLCanvasElement {
  const tmp = document.createElement('canvas')
  tmp.width = Math.max(1, Math.ceil(dw))
  tmp.height = Math.max(1, Math.ceil(dh))
  const tctx = tmp.getContext('2d')!
  tctx.fillStyle = fill
  tctx.fillRect(0, 0, tmp.width, tmp.height)
  tctx.globalCompositeOperation = 'destination-in'
  tctx.drawImage(img, 0, 0, tmp.width, tmp.height)
  return tmp
}

function heightToNormal(height: Float32Array, w: number, h: number, strength: number): ImageData {
  const out = new ImageData(w, h)
  const at = (x: number, y: number) => {
    const xx = Math.min(w - 1, Math.max(0, x))
    const yy = Math.min(h - 1, Math.max(0, y))
    return height[yy * w + xx]!
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx =
        -at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1)
      const dy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1)
      const nx = -dx * strength
      const ny = -dy * strength
      const nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
      const i = (y * w + x) * 4
      out.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255)
      out.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255)
      out.data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255)
      out.data[i + 3] = 255
    }
  }
  return out
}

export interface FaceMaps {
  readonly albedo: ImageData
  readonly roughness: ImageData
  readonly normal: ImageData
  readonly width: number
  readonly height: number
}

export async function bakeFaceMaps(): Promise<FaceMaps> {
  const w = FACE_MAP_W
  const h = FACE_MAP_H
  const [wordmark, chip] = await Promise.all([loadImage(wordmarkUrl), loadImage(chipUrl)])

  const albedoCanvas = document.createElement('canvas')
  albedoCanvas.width = w
  albedoCanvas.height = h
  const actx = albedoCanvas.getContext('2d', { willReadFrequently: true })!
  actx.fillStyle = '#f0f2f4'
  fillRoundedRect(actx, 0, 0, w, h, w * (2.8 / 85.6))

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = w
  roughCanvas.height = h
  const rctx = roughCanvas.getContext('2d', { willReadFrequently: true })!
  rctx.fillStyle = `rgb(${Math.round(ROUGH_FACE * 255)}, 0, 0)`
  fillRoundedRect(rctx, 0, 0, w, h, w * (2.8 / 85.6))

  const height = new Float32Array(w * h)
  height.fill(H_FACE)

  const stampHeight = (
    src: CanvasImageSource,
    x: number,
    y: number,
    dw: number,
    dh: number,
    hVal: number,
  ) => {
    const mask = stampedFill(src, dw, dh, '#fff')
    const mctx = mask.getContext('2d')!
    const data = mctx.getImageData(0, 0, mask.width, mask.height).data
    const x0 = Math.round(x)
    const y0 = Math.round(y)
    for (let py = 0; py < mask.height; py++) {
      for (let px = 0; px < mask.width; px++) {
        const a = data[(py * mask.width + px) * 4 + 3]!
        if (a < 16) continue
        const gx = x0 + px
        const gy = y0 + py
        if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue
        const t = a / 255
        const i = gy * w + gx
        height[i] = height[i]! * (1 - t) + hVal * t
      }
    }
  }

  const stampEtch = (src: CanvasImageSource, x: number, y: number, dw: number, dh: number) => {
    actx.drawImage(stampedFill(src, dw, dh, '#4a4e54'), x, y)
    rctx.drawImage(
      stampedFill(src, dw, dh, `rgb(${Math.round(ROUGH_ETCH * 255)},0,0)`),
      x,
      y,
    )
    stampHeight(src, x, y, dw, dh, H_ETCH)
  }

  // Wordmark — top left
  const wmW = w * 0.22
  const wmH = wmW * (wordmark.naturalHeight / wordmark.naturalWidth)
  stampEtch(wordmark, w * 0.06, h * 0.08, wmW, wmH)

  // Chip — recessed rounded grey pocket
  const chipW = w * 0.11
  const chipH = chipW * (136 / 190)
  const chipX = w * 0.09
  const chipY = h * 0.28
  const chipR = Math.max(12, chipW * 0.24)
  const pocketPad = Math.max(4, chipW * 0.06)

  actx.fillStyle = '#3d4147'
  fillRoundedRect(
    actx,
    chipX - pocketPad,
    chipY - pocketPad,
    chipW + pocketPad * 2,
    chipH + pocketPad * 2,
    chipR + pocketPad,
  )
  {
    const wall = document.createElement('canvas')
    wall.width = Math.ceil(chipW + pocketPad * 2)
    wall.height = Math.ceil(chipH + pocketPad * 2)
    const wctx = wall.getContext('2d')!
    wctx.fillStyle = '#fff'
    fillRoundedRect(wctx, 0, 0, wall.width, wall.height, chipR + pocketPad)
    stampHeight(wall, chipX - pocketPad, chipY - pocketPad, wall.width, wall.height, H_CHIP + 0.1)
  }

  actx.fillStyle = '#9aa0a8'
  fillRoundedRect(actx, chipX, chipY, chipW, chipH, chipR)
  actx.fillStyle = '#848a93'
  fillRoundedRect(
    actx,
    chipX + chipW * 0.05,
    chipY + chipH * 0.05,
    chipW * 0.9,
    chipH * 0.9,
    chipR * 0.85,
  )
  rctx.fillStyle = `rgb(${Math.round(ROUGH_CHIP * 255)}, 0, 0)`
  fillRoundedRect(
    rctx,
    chipX - pocketPad,
    chipY - pocketPad,
    chipW + pocketPad * 2,
    chipH + pocketPad * 2,
    chipR + pocketPad,
  )

  {
    const plate = document.createElement('canvas')
    plate.width = Math.ceil(chipW)
    plate.height = Math.ceil(chipH)
    const pctx = plate.getContext('2d')!
    pctx.fillStyle = '#fff'
    fillRoundedRect(pctx, 0, 0, plate.width, plate.height, chipR)
    stampHeight(plate, chipX, chipY, chipW, chipH, H_CHIP)
  }

  // Pads clipped to rounded plate
  {
    const padLayer = document.createElement('canvas')
    padLayer.width = Math.ceil(chipW)
    padLayer.height = Math.ceil(chipH)
    const pctx = padLayer.getContext('2d')!
    pctx.drawImage(stampedFill(chip, chipW, chipH, '#5a6068'), 0, 0)
    pctx.globalCompositeOperation = 'destination-in'
    pctx.fillStyle = '#fff'
    fillRoundedRect(pctx, 0, 0, padLayer.width, padLayer.height, chipR)
    actx.drawImage(padLayer, chipX, chipY)
    stampHeight(padLayer, chipX, chipY, chipW, chipH, H_CHIP_PAD)
  }

  // Cardholder
  const name = 'J. PESCHARD'
  const nameH = Math.round(h * 0.055)
  const nameFont = `500 ${Math.round(h * 0.042)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = nameFont
  const nameW = Math.ceil(measure.measureText(name).width) + 4
  const nameCanvas = document.createElement('canvas')
  nameCanvas.width = nameW
  nameCanvas.height = nameH
  const nctx = nameCanvas.getContext('2d')!
  nctx.font = nameFont
  nctx.fillStyle = '#fff'
  nctx.textBaseline = 'middle'
  nctx.fillText(name, 2, nameH * 0.55)
  stampEtch(nameCanvas, w * 0.06, h * 0.82, nameW, nameH)

  // Recess AO + emboss so carves read under bright chrome
  const albedo = actx.getImageData(0, 0, w, h)
  const lx = -0.55
  const ly = -0.65
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const hv = height[i]!
      const dx = height[i + 1]! - height[i - 1]!
      const dy = height[i + w]! - height[i - w]!
      const slope = Math.min(1, Math.hypot(dx, dy) * 3.2)
      const recess = 0.45 + 0.55 * hv
      const emboss = Math.max(-0.55, Math.min(0.55, (dx * lx + dy * ly) * 4.5))
      const ao = recess * (1 - slope * 0.35) * (1 + emboss)
      const pi = i * 4
      albedo.data[pi] = Math.round(Math.min(255, Math.max(0, albedo.data[pi]! * ao)))
      albedo.data[pi + 1] = Math.round(Math.min(255, Math.max(0, albedo.data[pi + 1]! * ao)))
      albedo.data[pi + 2] = Math.round(Math.min(255, Math.max(0, albedo.data[pi + 2]! * ao)))
    }
  }

  return {
    albedo,
    roughness: rctx.getImageData(0, 0, w, h),
    normal: heightToNormal(height, w, h, 24.0),
    width: w,
    height: h,
  }
}

/** Upload rgba8 ImageData into a sampleable Texture. */
export function uploadFaceMap(gpu: Gpu, data: ImageData, label: string): Texture {
  const tex = gpu.device.createTexture({
    label,
    size: [data.width, data.height],
    format: 'rgba8unorm',
    usage: ['texture_binding', 'copy_dst'],
  })
  gpu.gpu.queue.writeTexture(
    { texture: tex.gpu },
    data.data,
    { bytesPerRow: data.width * 4, rowsPerImage: data.height },
    { width: data.width, height: data.height },
  )
  return tex
}

/** Flat face still for the no-WebGPU fallback. */
export function albedoToDataUrl(albedo: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = albedo.width
  canvas.height = albedo.height
  canvas.getContext('2d')!.putImageData(albedo, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}
