import {
  draw,
  effect,
  frameLoop,
  geometry,
  init,
  sampler,
  surface,
  target,
  clock,
} from 'vgpu'
import type { FrameLoopHandle, Gpu } from 'vgpu'
import { perspectiveCamera } from 'vgpu/scene'
import cardShader from './card.wgsl'
import presentShader from './present.wgsl'
import { buildCardMesh, CARD_H, CARD_W } from './cardMesh'
import { createStudioEnvironment } from './env/createEnv'
import { bakeFaceMaps, uploadFaceMap } from './faceMaps'
import { degToRad, mat4Identity, mat4RotateXYZTranslate } from './math'
import {
  applyKeyTilt,
  createMotionState,
  nudgePointerTarget,
  setOrientationTarget,
  setPointerTarget,
  stepMotion,
  type OrientationCalibration,
} from './motion'

/** ~35 mm equivalent vertical FOV (long-ish lens). */
const FOV_DEG = 36
/** Card fills ~28% of frame width on desktop fullscreen. */
const FILL_DESKTOP = 0.28
/** Larger on phones so the piece reads as the subject. */
const FILL_MOBILE = 0.72
/** Article embed — breathing room inside the dark frame. */
export const FILL_EMBED = 0.48
/** Frames taller than this turn the card upright; wider than PORTRAIT_EXIT turn it
 * back. The gap is hysteresis so a drag-resize near square doesn't flip-flop. */
const PORTRAIT_ENTER = 0.9
const PORTRAIT_EXIT = 1.1
/** Upright = rolled a quarter turn clockwise (as seen by the viewer). */
const ROLL_PORTRAIT_DEG = -90
/** Upright the card spans the long axis of a tall frame and reads oversized —
 * pull it back by this share of the fill, eased in with the turn. */
const UPRIGHT_SHRINK = 0.15
/** Mid-turn the tilt settles to this share, so the rolling silhouette doesn't
 * skew (screen-aligned tilt on a rotated rectangle reads as a wobble). */
const TURN_TILT_KEEP = 0.25
/** Pitch "breath" (deg) peaking mid-turn — carries the highlights across the
 * face while the tilt is settled, then eases out as the card lands. */
const TURN_BREATH_DEG = 6
/** Roll spring — ~0.6 s with a whisper of overshoot. */
const ROLL_STIFFNESS = 90
const ROLL_DAMPING = 16
/** Softbox fade speed (higher = snappier). */
const LIGHTS_LERP = 5.5

/** Shadow rests under card, offset opposite key softbox (upper-left). */
const SHADOW_BASE_U = 0.54
const SHADOW_BASE_V = 0.64

const MATERIAL_STATIC = {
  baseF0: [0.95, 0.93, 0.88, 0] as [number, number, number, number],
  roughness: [0.045, 0.22, 0.35, 0] as [number, number, number, number],
  film: [420, 1.42, 0.92, 0.35] as [number, number, number, number],
}

/**
 * Distance at which the card — rolled by `rollRad` — fills `fill` of the frame on
 * its tighter axis. Fits the rolled bounding box, so corners never clip mid-turn.
 */
function cameraDistance(aspect: number, fill: number, rollRad = 0): number {
  const c = Math.abs(Math.cos(rollRad))
  const s = Math.abs(Math.sin(rollRad))
  const boxW = c * CARD_W + s * CARD_H
  const boxH = s * CARD_W + c * CARD_H
  const halfTan = Math.tan(degToRad(FOV_DEG) / 2)
  const byWidth = boxW / fill / (2 * halfTan * aspect)
  const byHeight = boxH / fill / (2 * halfTan)
  return Math.max(byWidth, byHeight)
}

export function isMobileLike(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 900px)').matches
  )
}

function needsOrientationPermission(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState>
      }
    ).requestPermission === 'function'
  )
}

export interface RevolutCardOptions {
  /** Live target for studio softboxes — 1 = on, 0 = ambient only. */
  getLightsOn?: () => boolean
  /** Called when WebGPU init fails — host should show the static fallback. */
  onUnsupported?: (err: unknown) => void
  /**
   * iOS 13+ needs a user gesture for DeviceOrientation.
   * Called with a function the UI can invoke from a tap.
   */
  onOrientationPermissionNeeded?: (request: () => Promise<boolean>) => void
  /**
   * Live override for how much of the frame the card fills on its tighter axis
   * (e.g. tighter framing when docked in a panel). Defaults per variant.
   */
  getFill?: () => number | undefined
  /**
   * Live orientation override. Unset → decided from the canvas aspect (upright
   * in tall frames). Hosts that know better — a side panel's drag width — force it.
   */
  getOrientation?: () => 'portrait' | 'landscape' | undefined
  /**
   * Live pixel lock: render the card's long edge at exactly this many CSS px,
   * whatever the frame size or roll — resizing the frame then never scales the
   * card, and turning it never refits. Overrides the fill framing when set.
   */
  getCardPx?: () => number | undefined
  /**
   * `embed` — article figure (larger fill, pointer only over canvas).
   * `stage` — fullscreen demo (window pointer tracking).
   */
  variant?: 'embed' | 'stage'
}

/** Chrome card — stages 0–10. */
export function startRevolutCard(
  canvas: HTMLCanvasElement,
  options: RevolutCardOptions = {},
): () => void {
  let disposed = false
  let loop: FrameLoopHandle | undefined
  let gpu: Gpu | undefined
  let unsubResize: (() => void) | undefined
  const cleanups: Array<() => void> = []
  const getLightsOn = options.getLightsOn ?? (() => true)
  const variant = options.variant ?? 'stage'
  const embed = variant === 'embed'

  void (async () => {
    try {
      gpu = await init()
    } catch (err) {
      console.error('[revolut-card] WebGPU unavailable:', err)
      options.onUnsupported?.(err)
      return
    }
    if (disposed) {
      gpu.dispose()
      return
    }

    const [env, faceMaps] = await Promise.all([
      createStudioEnvironment(gpu),
      bakeFaceMaps(),
    ])
    if (disposed) {
      gpu.dispose()
      return
    }

    const albedoTex = uploadFaceMap(gpu, faceMaps.albedo, 'revolut-card/albedo')
    const roughTex = uploadFaceMap(gpu, faceMaps.roughness, 'revolut-card/roughness')
    const normalTex = uploadFaceMap(gpu, faceMaps.normal, 'revolut-card/normal')
    const faceSamp = sampler(gpu, {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })

    const mobile = isMobileLike()
    const baseFill = embed ? FILL_EMBED : mobile ? FILL_MOBILE : FILL_DESKTOP
    const getFill = () => options.getFill?.() ?? baseFill
    const dprMax = mobile ? 1.5 : 2
    const canvasSurface = surface(gpu, canvas, { dpr: [1, dprMax] })
    const sceneTarget = target(gpu, {
      size: [canvasSurface.size[0], canvasSurface.size[1]],
      format: 'rgba16float',
      depth: true,
      msaa: !mobile,
    })

    const mesh = buildCardMesh()
    const cardGeom = geometry(gpu, {
      label: 'revolut-card/mesh',
      buffers: [
        {
          attributes: {
            position: 'float32x3',
            normal: 'float32x3',
            uv: 'float32x2',
            tangent: 'float32x3',
            bitangent: 'float32x3',
          },
          data: mesh.vertices.slice(),
        },
      ],
      indices: Array.from(mesh.indices),
    })

    const aspect0 = canvasSurface.size[0] / Math.max(1, canvasSurface.size[1])
    // Start already in the right orientation — no turn on first paint.
    let aspect = aspect0
    const forced = options.getOrientation?.()
    let portrait = forced ? forced === 'portrait' : aspect0 < PORTRAIT_ENTER
    let roll = portrait ? ROLL_PORTRAIT_DEG : 0
    let rollVelocity = 0
    let fill = getFill()
    let cardPx = options.getCardPx?.()
    let cssHeight = canvas.clientHeight

    const computeDistance = () => {
      if (cardPx && cssHeight > 0) {
        // Long edge spans cardPx of cssHeight px of vertical view at this distance.
        return (CARD_W * cssHeight) / (2 * Math.tan(degToRad(FOV_DEG) / 2) * cardPx)
      }
      const upright = Math.min(1, Math.abs(roll / ROLL_PORTRAIT_DEG))
      const effectiveFill = fill * (1 - UPRIGHT_SHRINK * upright)
      return cameraDistance(aspect, effectiveFill, degToRad(roll))
    }
    const dist0 = computeDistance()
    const cam = perspectiveCamera({
      fov: FOV_DEG,
      aspect: aspect0,
      near: 1,
      far: 2000,
      position: [0, 0, dist0],
      target: [0, 0, 0],
    })

    const modelMat = mat4Identity()
    const normalMat = mat4Identity()

    let lightsAmount = getLightsOn() ? 1 : 0

    const card = draw(gpu, {
      label: 'revolut-card/card',
      shader: cardShader,
      geometry: cardGeom,
      cull: 'back',
      set: {
        camera: {
          viewProjection: cam.viewProjection,
          cameraPos: [0, 0, dist0],
        },
        model: { model: modelMat, normalMatrix: normalMat },
        material: {
          ...MATERIAL_STATIC,
          lights: [lightsAmount, 0, 0, 0],
        },
        albedoMap: albedoTex,
        roughMap: roughTex,
        normalMap: normalTex,
        faceSamp,
        envMip0: env.mips[0],
        envMip1: env.mips[1],
        envMip2: env.mips[2],
        envMip3: env.mips[3],
        envMip4: env.mips[4],
        envMip5: env.mips[5],
        envAmb: env.ambient,
        envSamp: env.sampler,
      },
    })

    const present = effect(gpu, presentShader, {
      label: 'revolut-card/present',
      set: {
        scene: sceneTarget,
        sceneSampler: sampler(gpu, { minFilter: 'nearest', magFilter: 'nearest' }),
        present: { shadow: [SHADOW_BASE_U, SHADOW_BASE_V, lightsAmount, 0] },
      },
    })

    const updateCamera = () => {
      const dist = computeDistance()
      cam.set({ aspect, position: [0, 0, dist] })
      card.set({
        camera: {
          viewProjection: cam.viewProjection,
          cameraPos: [0, 0, dist],
        },
      })
    }

    unsubResize = canvasSurface.onResize(({ width, height }) => {
      sceneTarget.resize([width, height])
      aspect = width / Math.max(1, height)
      cssHeight = canvas.clientHeight
      if (!options.getOrientation?.()) {
        if (portrait ? aspect > PORTRAIT_EXIT : aspect < PORTRAIT_ENTER) portrait = !portrait
      }
      updateCamera()
    })

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const motion = createMotionState(performance.now())

    // --- Input: desktop pointer, mobile tilt / touch-drag, keyboard ---
    let orientationActive = false
    let orientationCalib: OrientationCalibration | null = null
    let touchDragging = false
    let lastTouchX = 0
    let lastTouchY = 0

    const onPointerMove = (e: PointerEvent) => {
      if (mobile) return
      if (orientationActive) return
      setPointerTarget(motion, e.clientX, e.clientY, canvas.getBoundingClientRect())
    }
    if (embed) {
      canvas.addEventListener('pointermove', onPointerMove, { passive: true })
      cleanups.push(() => canvas.removeEventListener('pointermove', onPointerMove))
    } else {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      cleanups.push(() => window.removeEventListener('pointermove', onPointerMove))
    }

    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      if (!orientationCalib) {
        orientationCalib = { beta: e.beta, gamma: e.gamma }
      }
      orientationActive = true
      setOrientationTarget(motion, e.beta, e.gamma, orientationCalib)
    }

    const startOrientationListening = () => {
      window.addEventListener('deviceorientation', onDeviceOrientation, true)
      cleanups.push(() =>
        window.removeEventListener('deviceorientation', onDeviceOrientation, true),
      )
    }

    const requestOrientationPermission = async (): Promise<boolean> => {
      try {
        const DO = DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<PermissionState>
        }
        if (typeof DO.requestPermission === 'function') {
          const state = await DO.requestPermission()
          if (state !== 'granted') return false
        }
        startOrientationListening()
        return true
      } catch {
        return false
      }
    }

    if (mobile) {
      if (needsOrientationPermission()) {
        options.onOrientationPermissionNeeded?.(requestOrientationPermission)
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        startOrientationListening()
      }

      // Touch-drag fallback (also works before / without tilt permission)
      const onPointerDown = (e: PointerEvent) => {
        if (orientationActive) return
        if (e.pointerType === 'mouse') return
        touchDragging = true
        lastTouchX = e.clientX
        lastTouchY = e.clientY
        canvas.setPointerCapture(e.pointerId)
      }
      const onPointerDrag = (e: PointerEvent) => {
        if (!touchDragging || orientationActive) return
        const rect = canvas.getBoundingClientRect()
        nudgePointerTarget(motion, e.clientX - lastTouchX, e.clientY - lastTouchY, rect)
        lastTouchX = e.clientX
        lastTouchY = e.clientY
      }
      const onPointerUp = (e: PointerEvent) => {
        if (!touchDragging) return
        touchDragging = false
        try {
          canvas.releasePointerCapture(e.pointerId)
        } catch {
          /* already released */
        }
      }
      canvas.addEventListener('pointerdown', onPointerDown)
      canvas.addEventListener('pointermove', onPointerDrag, { passive: true })
      canvas.addEventListener('pointerup', onPointerUp)
      canvas.addEventListener('pointercancel', onPointerUp)
      cleanups.push(() => {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointermove', onPointerDrag)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('pointercancel', onPointerUp)
      })
    }

    const keysDown = new Set<string>()
    const isArrow = (key: string) =>
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown'
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isArrow(e.key) || e.repeat || isTypingTarget(e.target)) return
      // Article embed: don't steal scroll — only when the canvas is focused
      if (embed && document.activeElement !== canvas) return
      keysDown.add(e.key)
      e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isArrow(e.key)) return
      keysDown.delete(e.key)
    }
    const onWindowBlur = () => keysDown.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)
    cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
    })

    const onDeviceLost = () => {
      options.onUnsupported?.(new Error('WebGPU device lost'))
    }
    // Best-effort — vgpu may not expose adapter events; listen on canvas context if present
    canvas.addEventListener('webgpucontextlost' as keyof HTMLElementEventMap, onDeviceLost as EventListener)
    cleanups.push(() =>
      canvas.removeEventListener(
        'webgpucontextlost' as keyof HTMLElementEventMap,
        onDeviceLost as EventListener,
      ),
    )

    const time = clock(gpu)
    let lastTime = time.time
    let prevLights = lightsAmount
    let prevShadowU = SHADOW_BASE_U
    let prevShadowV = SHADOW_BASE_V
    let prevUpright = -1

    loop = frameLoop(gpu, (frame) => {
      const now = time.time
      const dt = Math.min(0.05, Math.max(0, now - lastTime))
      lastTime = now

      const lightsTarget = getLightsOn() ? 1 : 0
      const lightsAlpha = reducedMotion ? 1 : 1 - Math.exp(-LIGHTS_LERP * dt)
      lightsAmount += (lightsTarget - lightsAmount) * lightsAlpha

      applyKeyTilt(motion, keysDown, dt)
      const pose = stepMotion(motion, dt, performance.now(), reducedMotion)

      // Turn upright in tall frames. The room stays put while the card rolls, so
      // the reflections sweep across the face as it turns.
      const forcedOrientation = options.getOrientation?.()
      if (forcedOrientation) portrait = forcedOrientation === 'portrait'
      const rollTarget = portrait ? ROLL_PORTRAIT_DEG : 0
      const nextFill = getFill()
      const rolling = Math.abs(rollTarget - roll) > 1e-3 || Math.abs(rollVelocity) > 1e-3
      if (rolling) {
        if (reducedMotion) {
          roll = rollTarget
          rollVelocity = 0
        } else {
          rollVelocity +=
            (ROLL_STIFFNESS * (rollTarget - roll) - ROLL_DAMPING * rollVelocity) * dt
          roll += rollVelocity * dt
        }
      }
      const nextCardPx = options.getCardPx?.()
      // A pixel-locked card keeps one distance through the turn — only refit
      // when the framing inputs themselves change.
      if ((rolling && !cardPx) || nextFill !== fill || nextCardPx !== cardPx) {
        fill = nextFill
        cardPx = nextCardPx
        updateCamera()
      }
      // 0 = landscape, 1 = upright — swings the contact shadow with the card.
      const upright = Math.min(1, Math.abs(roll / ROLL_PORTRAIT_DEG))

      // One continuous gesture: tilt fades out as the card turns and returns as it
      // lands (0 at either rest, 1 at the quarter-turn midpoint), with a breath of
      // pitch in between. Scaling the pose also damps pointer input mid-turn.
      const midTurn = Math.sin(Math.PI * upright)
      const tiltScale = 1 - (1 - TURN_TILT_KEEP) * midTurn
      const pitch = pose.pitch * tiltScale + TURN_BREATH_DEG * midTurn
      const yaw = pose.yaw * tiltScale
      const offsetX = pose.offsetX * tiltScale
      const offsetY = pose.offsetY * tiltScale

      mat4RotateXYZTranslate(
        modelMat,
        degToRad(pitch),
        degToRad(yaw),
        degToRad(roll),
        offsetX,
        offsetY,
        pose.offsetZ,
      )
      normalMat.set(modelMat)
      normalMat[12] = 0
      normalMat[13] = 0
      normalMat[14] = 0

      const shadowU = SHADOW_BASE_U + offsetX * 0.004
      const shadowV = SHADOW_BASE_V - offsetY * 0.004 + pose.offsetZ * 0.0015

      card.set({
        model: { model: modelMat, normalMatrix: normalMat },
        material: {
          ...MATERIAL_STATIC,
          lights: [lightsAmount, 0, 0, 0],
        },
      })

      if (
        Math.abs(lightsAmount - prevLights) > 1e-4 ||
        Math.abs(shadowU - prevShadowU) > 1e-5 ||
        Math.abs(shadowV - prevShadowV) > 1e-5 ||
        Math.abs(upright - prevUpright) > 1e-4
      ) {
        present.set({
          present: { shadow: [shadowU, shadowV, lightsAmount, upright] },
        })
        prevLights = lightsAmount
        prevShadowU = shadowU
        prevShadowV = shadowV
        prevUpright = upright
      }

      frame.pass(
        { target: sceneTarget, clear: [0, 0, 0, 1], clearDepth: 1 },
        (pass) => {
          pass.draw(card)
        },
      )
      frame.pass(canvasSurface, present)
    })
  })()

  return () => {
    disposed = true
    unsubResize?.()
    for (const fn of cleanups) fn()
    loop?.stop()
    gpu?.dispose()
  }
}
