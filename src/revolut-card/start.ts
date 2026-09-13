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
import { buildCardMesh, CARD_W } from './cardMesh'
import { createStudioEnvironment } from './env/createEnv'
import { bakeFaceMaps, uploadFaceMap } from './faceMaps'
import { degToRad, mat4Identity, mat4RotateXYTranslate } from './math'
import { createMotionState, setPointerTarget, stepMotion } from './motion'

/** ~35 mm equivalent vertical FOV (long-ish lens). */
const FOV_DEG = 36
/** Card fills ~28% of frame width at rest. */
const FILL = 0.28
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

function cameraDistance(aspect: number): number {
  const vfov = degToRad(FOV_DEG)
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
  const visibleWidth = CARD_W / FILL
  return visibleWidth / (2 * Math.tan(hfov / 2))
}

function isMobileLike(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 900px)').matches
  )
}

export interface RevolutCardOptions {
  /** Live target for studio softboxes — 1 = on, 0 = ambient only. */
  getLightsOn?: () => boolean
}

/** Chrome card — stages 0–9. */
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

  void (async () => {
    try {
      gpu = await init()
    } catch (err) {
      console.error('[revolut-card] WebGPU unavailable:', err)
      return
    }
    if (disposed) {
      gpu.dispose()
      return
    }

    // Load env + face maps in parallel (warm cache target < 1s)
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
    const dprMax = mobile ? 1.5 : 2
    const canvasSurface = surface(gpu, canvas, { dpr: [1, dprMax] })
    const sceneTarget = target(gpu, {
      size: [canvasSurface.size[0], canvasSurface.size[1]],
      format: 'rgba16float',
      depth: true,
      // MSAA is fill-heavy — keep on desktop, skip on phones
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
    const dist0 = cameraDistance(aspect0)
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

    unsubResize = canvasSurface.onResize(({ width, height }) => {
      sceneTarget.resize([width, height])
      const aspect = width / Math.max(1, height)
      const dist = cameraDistance(aspect)
      cam.set({ aspect, position: [0, 0, dist] })
      card.set({
        camera: {
          viewProjection: cam.viewProjection,
          cameraPos: [0, 0, dist],
        },
      })
    })

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const motion = createMotionState(performance.now(), { entrance: !reducedMotion })

    const onPointer = (e: PointerEvent) => {
      setPointerTarget(motion, e.clientX, e.clientY, canvas.getBoundingClientRect())
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    cleanups.push(() => window.removeEventListener('pointermove', onPointer))

    const time = clock(gpu)
    let lastTime = time.time
    let prevLights = lightsAmount
    let prevShadowU = SHADOW_BASE_U
    let prevShadowV = SHADOW_BASE_V

    loop = frameLoop(gpu, (frame) => {
      const now = time.time
      const dt = Math.min(0.05, Math.max(0, now - lastTime))
      lastTime = now

      const lightsTarget = getLightsOn() ? 1 : 0
      const lightsAlpha = reducedMotion ? 1 : 1 - Math.exp(-LIGHTS_LERP * dt)
      lightsAmount += (lightsTarget - lightsAmount) * lightsAlpha

      const pose = stepMotion(motion, dt, performance.now(), reducedMotion)
      mat4RotateXYTranslate(
        modelMat,
        degToRad(pose.pitch),
        degToRad(pose.yaw),
        pose.offsetX,
        pose.offsetY,
        pose.offsetZ,
      )
      normalMat.set(modelMat)
      normalMat[12] = 0
      normalMat[13] = 0
      normalMat[14] = 0

      const shadowU = SHADOW_BASE_U + pose.offsetX * 0.004
      const shadowV = SHADOW_BASE_V - pose.offsetY * 0.004 + pose.offsetZ * 0.0015

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
        Math.abs(shadowV - prevShadowV) > 1e-5
      ) {
        present.set({
          present: { shadow: [shadowU, shadowV, lightsAmount, 0] },
        })
        prevLights = lightsAmount
        prevShadowU = shadowU
        prevShadowV = shadowV
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
