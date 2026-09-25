/**
 * Spring motion: pointer / orientation / touch tracking + idle figure-eight drift.
 */

export interface MotionAngles {
  pitch: number
  yaw: number
}

export interface MotionState {
  current: MotionAngles
  velocity: MotionAngles
  /** Input-driven target (degrees). */
  pointer: MotionAngles
  lastInputMs: number
  /** Wall-clock origin for idle phase. */
  idlePhase0: number
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

/** Device-orientation sensitivity (degrees of card per degree of phone tilt). */
const ORIENT_PITCH_GAIN = 0.55
const ORIENT_YAW_GAIN = 0.65

const FIXED_DT = 1 / 120
const MAX_STEPS = 8

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function createMotionState(nowMs = performance.now()): MotionState {
  return {
    current: { pitch: REST_PITCH, yaw: 0 },
    velocity: { pitch: 0, yaw: 0 },
    pointer: { pitch: REST_PITCH, yaw: 0 },
    lastInputMs: nowMs,
    idlePhase0: nowMs / 1000,
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
  const cx = clamp(nx, -1, 1)
  const cy = clamp(ny, -1, 1)
  state.pointer.yaw = cx * YAW_RANGE
  state.pointer.pitch = REST_PITCH - cy * PITCH_RANGE
  state.lastInputMs = nowMs
}

/**
 * Touch-drag: accumulate deltas into the pointer target (fallback when tilt
 * permission is denied / unavailable).
 */
export function nudgePointerTarget(
  state: MotionState,
  dxPx: number,
  dyPx: number,
  rect: DOMRect,
  nowMs = performance.now(),
): void {
  const yawPerPx = (2 * YAW_RANGE) / Math.max(1, rect.width)
  const pitchPerPx = (2 * PITCH_RANGE) / Math.max(1, rect.height)
  state.pointer.yaw = clamp(state.pointer.yaw + dxPx * yawPerPx, -YAW_RANGE, YAW_RANGE)
  state.pointer.pitch = clamp(
    state.pointer.pitch - dyPx * pitchPerPx,
    REST_PITCH - PITCH_RANGE,
    REST_PITCH + PITCH_RANGE,
  )
  state.lastInputMs = nowMs
}

/** Arrow-key tilt rate (degrees per second while held). */
export const KEY_TILT_SPEED = 48

/** Apply continuous keyboard tilt for currently held arrow keys. */
export function applyKeyTilt(
  state: MotionState,
  keys: ReadonlySet<string>,
  dt: number,
  nowMs = performance.now(),
): boolean {
  let dyaw = 0
  let dpitch = 0
  if (keys.has('ArrowLeft')) dyaw -= 1
  if (keys.has('ArrowRight')) dyaw += 1
  if (keys.has('ArrowUp')) dpitch += 1
  if (keys.has('ArrowDown')) dpitch -= 1
  if (dyaw === 0 && dpitch === 0) return false

  const step = KEY_TILT_SPEED * dt
  state.pointer.yaw = clamp(state.pointer.yaw + dyaw * step, -YAW_RANGE, YAW_RANGE)
  state.pointer.pitch = clamp(
    state.pointer.pitch + dpitch * step,
    REST_PITCH - PITCH_RANGE,
    REST_PITCH + PITCH_RANGE,
  )
  state.lastInputMs = nowMs
  return true
}

export interface OrientationCalibration {
  beta: number
  gamma: number
}

/** Map device orientation (calibrated) into pointer target degrees. */
export function setOrientationTarget(
  state: MotionState,
  beta: number,
  gamma: number,
  calib: OrientationCalibration,
  nowMs = performance.now(),
): void {
  const dPitch = (beta - calib.beta) * ORIENT_PITCH_GAIN
  const dYaw = (gamma - calib.gamma) * ORIENT_YAW_GAIN
  state.pointer.pitch = clamp(
    REST_PITCH + dPitch,
    REST_PITCH - PITCH_RANGE,
    REST_PITCH + PITCH_RANGE,
  )
  state.pointer.yaw = clamp(dYaw, -YAW_RANGE, YAW_RANGE)
  state.lastInputMs = nowMs
}

function idleTarget(timeS: number, phase0: number): MotionAngles {
  const t = ((timeS - phase0) / IDLE_PERIOD_S) * Math.PI * 2
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
  const stiffness = reducedMotion ? STIFFNESS_REDUCED : STIFFNESS
  const damping = reducedMotion ? DAMPING_REDUCED : DAMPING

  let target = state.pointer
  if (!reducedMotion) {
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
    state.current.pitch = px.value
    state.velocity.pitch = px.velocity
    state.current.yaw = yx.value
    state.velocity.yaw = yx.velocity
    remaining -= step
  }

  const offsetX = state.current.yaw * 0.04
  const offsetY = -state.current.pitch * 0.025

  return {
    pitch: state.current.pitch,
    yaw: state.current.yaw,
    offsetX,
    offsetY,
    offsetZ: 0,
  }
}
