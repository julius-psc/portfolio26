/**
 * Stage 7 — spring motion: pointer tracking + idle figure-eight drift.
 * Stage 8 — entrance settle from over-rotated / further away.
 */

export interface MotionAngles {
  pitch: number
  yaw: number
}

export interface MotionState {
  current: MotionAngles
  velocity: MotionAngles
  /** Pointer-driven target (degrees). */
  pointer: MotionAngles
  lastInputMs: number
  /** Wall-clock origin for idle phase. */
  idlePhase0: number
  /** Entrance: world Z offset (further from camera), springs to 0. */
  z: number
  zVel: number
  startedAtMs: number
}

const PITCH_RANGE = 12
const YAW_RANGE = 18
/** Slight rest tilt so chrome isn't dead-on. */
const REST_PITCH = 6

const STIFFNESS = 120
const DAMPING = 14
const STIFFNESS_REDUCED = 220
const DAMPING_REDUCED = 28

const IDLE_DELAY_MS = 2000
const IDLE_BLEND_MS = 900
const IDLE_PERIOD_S = 12
const IDLE_AMP = 4

/** Suppress idle until entrance has had time to settle. */
const ENTRANCE_GUARD_MS = 1100
const ENTRANCE_YAW = -15
const ENTRANCE_PITCH = REST_PITCH + 9
/** Further from camera (card −Z); ~900ms settle with stiffness 120. */
const ENTRANCE_Z = 36

const FIXED_DT = 1 / 120
const MAX_STEPS = 8

export function createMotionState(
  nowMs = performance.now(),
  opts: { entrance?: boolean } = {},
): MotionState {
  const entrance = opts.entrance !== false
  return {
    current: entrance
      ? { pitch: ENTRANCE_PITCH, yaw: ENTRANCE_YAW }
      : { pitch: REST_PITCH, yaw: 0 },
    velocity: { pitch: 0, yaw: 0 },
    pointer: { pitch: REST_PITCH, yaw: 0 },
    lastInputMs: nowMs,
    idlePhase0: nowMs / 1000,
    z: entrance ? ENTRANCE_Z : 0,
    zVel: 0,
    startedAtMs: nowMs,
  }
}

/** Map pointer into [-1, 1] relative to element center, then to degrees. */
export function setPointerTarget(
  state: MotionState,
  clientX: number,
  clientY: number,
  rect: DOMRect,
  nowMs = performance.now(),
): void {
  const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
  const ny = ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1
  const cx = Math.max(-1, Math.min(1, nx))
  const cy = Math.max(-1, Math.min(1, ny))
  state.pointer.yaw = cx * YAW_RANGE
  state.pointer.pitch = REST_PITCH - cy * PITCH_RANGE
  state.lastInputMs = nowMs
}

function idleTarget(timeS: number, phase0: number): MotionAngles {
  const t = ((timeS - phase0) / IDLE_PERIOD_S) * Math.PI * 2
  // Figure-eight: yaw ~ sin(t), pitch ~ sin(2t)
  return {
    yaw: Math.sin(t) * IDLE_AMP,
    pitch: REST_PITCH + Math.sin(t * 2) * IDLE_AMP,
  }
}

function springStep(
  current: number,
  velocity: number,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
): { value: number; velocity: number } {
  const force = stiffness * (target - current) - damping * velocity
  const v = velocity + force * dt
  const value = current + v * dt
  return { value, velocity: v }
}

export interface MotionStepResult {
  pitch: number
  yaw: number
  /** World translation so the card pivots slightly behind itself. */
  offsetX: number
  offsetY: number
  offsetZ: number
}

/**
 * Advance springs with a fixed timestep. `dt` is wall seconds since last frame.
 * Returns degrees + a small positional offset.
 */
export function stepMotion(
  state: MotionState,
  dt: number,
  nowMs: number,
  reducedMotion: boolean,
): MotionStepResult {
  if (reducedMotion) {
    state.current.pitch = state.pointer.pitch
    state.current.yaw = state.pointer.yaw
    state.velocity.pitch = 0
    state.velocity.yaw = 0
    state.z = 0
    state.zVel = 0
    return {
      pitch: state.current.pitch,
      yaw: state.current.yaw,
      offsetX: state.current.yaw * 0.04,
      offsetY: -state.current.pitch * 0.025,
      offsetZ: 0,
    }
  }

  const stiffness = STIFFNESS
  const damping = DAMPING

  let target = state.pointer
  const sinceStart = nowMs - state.startedAtMs
  const entranceDone = sinceStart >= ENTRANCE_GUARD_MS
  if (entranceDone) {
    const idle = idleTarget(nowMs / 1000, state.idlePhase0)
    const since = nowMs - state.lastInputMs
    const blend = Math.max(0, Math.min(1, (since - IDLE_DELAY_MS) / IDLE_BLEND_MS))
    const b = blend * blend * (3 - 2 * blend)
    target = {
      pitch: state.pointer.pitch + (idle.pitch - state.pointer.pitch) * b,
      yaw: state.pointer.yaw + (idle.yaw - state.pointer.yaw) * b,
    }
  }

  let remaining = Math.min(dt, FIXED_DT * MAX_STEPS)
  while (remaining > 1e-6) {
    const step = Math.min(FIXED_DT, remaining)
    const px = springStep(
      state.current.pitch,
      state.velocity.pitch,
      target.pitch,
      step,
      stiffness,
      damping,
    )
    const yx = springStep(
      state.current.yaw,
      state.velocity.yaw,
      target.yaw,
      step,
      stiffness,
      damping,
    )
    const zx = springStep(state.z, state.zVel, 0, step, stiffness, damping)
    state.current.pitch = px.value
    state.velocity.pitch = px.velocity
    state.current.yaw = yx.value
    state.velocity.yaw = yx.velocity
    state.z = zx.value
    state.zVel = zx.velocity
    remaining -= step
  }

  // Pivot behind the card — small translation coupled to rotation
  const offsetX = state.current.yaw * 0.04
  const offsetY = -state.current.pitch * 0.025

  return {
    pitch: state.current.pitch,
    yaw: state.current.yaw,
    offsetX,
    offsetY,
    offsetZ: -state.z,
  }
}
