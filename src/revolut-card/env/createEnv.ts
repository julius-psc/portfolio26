import { effect, sampler, target } from 'vgpu'
import type { Gpu, Target } from 'vgpu'
import bakeEnvShader from './bakeEnv.wgsl'
import prefilterEnvShader from './prefilterEnv.wgsl'

export const ENV_SIZE = 256
export const ENV_MIP_COUNT = 6
/** Once at load — 32 is enough for soft studio softboxes. */
const SAMPLE_COUNT = 32

export interface StudioEnvironment {
  readonly mips: readonly Target[]
  /** Ambient-only (lights=0) octahedral map — same size as mip0. */
  readonly ambient: Target
  readonly sampler: ReturnType<typeof sampler>
}

/** Bake octahedral studio env + GGX roughness mip chain (mips 0–5). Once at load. */
export async function createStudioEnvironment(gpu: Gpu): Promise<StudioEnvironment> {
  const envSampler = sampler(gpu, {
    minFilter: 'linear',
    magFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })

  const mips: Target[] = []
  for (let i = 0; i < ENV_MIP_COUNT; i++) {
    const size = Math.max(1, ENV_SIZE >> i)
    mips.push(
      target(gpu, {
        size: [size, size],
        format: 'rgba16float',
        label: `revolut-card/env-mip${i}`,
      }),
    )
  }

  const ambient = target(gpu, {
    size: [ENV_SIZE, ENV_SIZE],
    format: 'rgba16float',
    label: 'revolut-card/env-ambient',
  })

  const bake = effect(gpu, bakeEnvShader, {
    label: 'revolut-card/bake-env',
    set: { bake: [1, 0, 0, 0] },
  })
  bake.draw(mips[0]!)

  bake.set({ bake: [0, 0, 0, 0] })
  bake.draw(ambient)

  const prefilter = effect(gpu, prefilterEnvShader, {
    label: 'revolut-card/prefilter-env',
    set: {
      envMap: mips[0],
      envSamp: envSampler,
      params: { roughness: 0.2, sampleCount: SAMPLE_COUNT },
    },
  })

  for (let i = 1; i < ENV_MIP_COUNT; i++) {
    const roughness = i / (ENV_MIP_COUNT - 1)
    prefilter.set({ params: { roughness, sampleCount: SAMPLE_COUNT } })
    prefilter.draw(mips[i]!)
  }

  await gpu.settled()
  return { mips, ambient, sampler: envSampler }
}
