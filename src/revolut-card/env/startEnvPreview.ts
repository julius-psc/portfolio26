import { effect, frameLoop, init, surface } from 'vgpu'
import type { FrameLoopHandle, Gpu } from 'vgpu'
import { createStudioEnvironment, ENV_MIP_COUNT } from './createEnv'
import viewEnvShader from './viewEnv.wgsl'

/** Stage 3 — /env preview: equirect studio + mip strip. */
export function startEnvPreview(canvas: HTMLCanvasElement): () => void {
  let disposed = false
  let loop: FrameLoopHandle | undefined
  let gpu: Gpu | undefined
  let removeKey: (() => void) | undefined

  void (async () => {
    try {
      gpu = await init()
      gpu.onError((err) => {
        console.error('[revolut-card/env] gpu error:', err)
      })

      if (disposed) {
        gpu.dispose()
        return
      }

      const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] })

      // Bake still runs — Stage 4 will sample these. Verified via readback.
      const env = await createStudioEnvironment(gpu)
      if (disposed) {
        gpu.dispose()
        return
      }

      const probe = await env.mips[0]!.readFloats()
      let max = 0
      for (let i = 0; i < probe.length; i++) max = Math.max(max, probe[i]!)
      ;(window as unknown as { __envProbe?: number }).__envProbe = max
      console.info('[revolut-card/env] baked mip0 max:', max, 'mips:', env.mips.length)

      let mip = 0
      const view = effect(gpu, viewEnvShader, {
        label: 'revolut-card/view-env',
        set: {
          params: { mip, mipCount: ENV_MIP_COUNT },
        },
      })

      const onKey = (e: KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '5') {
          mip = Number(e.key)
          view.set({ params: { mip, mipCount: ENV_MIP_COUNT } })
        }
        if (e.key === 'ArrowRight') {
          mip = (mip + 1) % ENV_MIP_COUNT
          view.set({ params: { mip, mipCount: ENV_MIP_COUNT } })
        }
        if (e.key === 'ArrowLeft') {
          mip = (mip + ENV_MIP_COUNT - 1) % ENV_MIP_COUNT
          view.set({ params: { mip, mipCount: ENV_MIP_COUNT } })
        }
      }
      window.addEventListener('keydown', onKey)
      removeKey = () => window.removeEventListener('keydown', onKey)

      loop = frameLoop(gpu, (frame) => {
        frame.pass(canvasSurface, view)
      })
    } catch (err) {
      console.error('[revolut-card/env] WebGPU unavailable or bake failed:', err)
    }
  })()

  return () => {
    disposed = true
    removeKey?.()
    loop?.stop()
    gpu?.dispose()
  }
}
