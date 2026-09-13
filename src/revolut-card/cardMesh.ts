/**
 * Procedural ISO ID-1 metal card mesh.
 * Face / back / bevels / edge band. Hard edges at bevel seams (duplicated verts).
 */

export const CARD_W = 85.6
export const CARD_H = 53.98
export const CARD_T = 0.8
/** Matches the 2D face (slightly tighter than ISO 3.18 mm). */
export const CORNER_R = 2.8
export const BEVEL = 0.15
export const CORNER_SEGS = 16

/** Interleaved: pos3 + n3 + uv2 + tan3 + bitan3 = 14 floats */
export const VERTEX_FLOATS = 14

export interface CardMeshData {
  readonly vertices: Float32Array
  readonly indices: Uint32Array
  readonly vertexCount: number
  readonly indexCount: number
}

type Pt = readonly [number, number]

function roundedRectOutline(hw: number, hh: number, r: number, segs: number): Pt[] {
  const rr = Math.min(r, hw, hh)
  const pts: Pt[] = []
  const corners: { cx: number; cy: number; a0: number; a1: number }[] = [
    { cx: hw - rr, cy: hh - rr, a0: 0, a1: Math.PI / 2 },
    { cx: -hw + rr, cy: hh - rr, a0: Math.PI / 2, a1: Math.PI },
    { cx: -hw + rr, cy: -hh + rr, a0: Math.PI, a1: (3 * Math.PI) / 2 },
    { cx: hw - rr, cy: -hh + rr, a0: (3 * Math.PI) / 2, a1: 2 * Math.PI },
  ]
  for (const c of corners) {
    for (let i = 0; i < segs; i++) {
      const a = c.a0 + ((c.a1 - c.a0) * i) / segs
      pts.push([c.cx + Math.cos(a) * rr, c.cy + Math.sin(a) * rr])
    }
  }
  return pts
}

function cross(ax: number, ay: number, az: number, bx: number, by: number, bz: number): [number, number, number] {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
}

function normalize(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1
  return [x / l, y / l, z / l]
}

export function buildCardMesh(): CardMeshData {
  const hw = CARD_W / 2
  const hh = CARD_H / 2
  const halfT = CARD_T / 2
  const bevel = BEVEL
  const segs = CORNER_SEGS

  const outer = roundedRectOutline(hw, hh, CORNER_R, segs)
  const inner = roundedRectOutline(hw - bevel, hh - bevel, Math.max(0.01, CORNER_R - bevel), segs)
  const n = outer.length

  const verts: number[] = []
  const indices: number[] = []

  const pushVert = (
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    u: number,
    v: number,
    tx: number,
    ty: number,
    tz: number,
    bx: number,
    by: number,
    bz: number,
  ) => {
    verts.push(x, y, z, nx, ny, nz, u, v, tx, ty, tz, bx, by, bz)
    return verts.length / VERTEX_FLOATS - 1
  }

  const uvOf = (x: number, y: number): [number, number] => [(x + hw) / CARD_W, (y + hh) / CARD_H]

  // ── Face (+Z), normal up ──────────────────────────────────────────
  {
    const faceZ = halfT
    const center = pushVert(0, 0, faceZ, 0, 0, 1, 0.5, 0.5, 1, 0, 0, 0, 1, 0)
    const ring: number[] = []
    for (let i = 0; i < n; i++) {
      const [x, y] = inner[i]!
      const [u, v] = uvOf(x, y)
      ring.push(pushVert(x, y, faceZ, 0, 0, 1, u, v, 1, 0, 0, 0, 1, 0))
    }
    for (let i = 0; i < n; i++) {
      indices.push(center, ring[i]!, ring[(i + 1) % n]!)
    }
  }

  // ── Back (−Z), normal down ────────────────────────────────────────
  {
    const backZ = -halfT
    const center = pushVert(0, 0, backZ, 0, 0, -1, 0.5, 0.5, 1, 0, 0, 0, -1, 0)
    const ring: number[] = []
    for (let i = 0; i < n; i++) {
      const [x, y] = inner[i]!
      const [u, v] = uvOf(x, y)
      ring.push(pushVert(x, y, backZ, 0, 0, -1, u, v, 1, 0, 0, 0, -1, 0))
    }
    // CW when viewed from −Z so front-face stays CCW from outside
    for (let i = 0; i < n; i++) {
      indices.push(center, ring[(i + 1) % n]!, ring[i]!)
    }
  }

  // ── Top bevel ─────────────────────────────────────────────────────
  {
    const zIn = halfT
    const zOut = halfT - bevel
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const [ix0, iy0] = inner[i]!
      const [ix1, iy1] = inner[j]!
      const [ox0, oy0] = outer[i]!
      const [ox1, oy1] = outer[j]!

      const ex = ix1 - ix0
      const ey = iy1 - iy0
      const ez = 0
      // Chamfer runs from inner→outer and down in Z
      const sx = ox0 - ix0
      const sy = oy0 - iy0
      const sz = zOut - zIn
      let [nx, ny, nz] = normalize(...cross(ex, ey, ez, sx, sy, sz))
      // Ensure normal points generally outward/up
      if (nz < 0) {
        nx = -nx
        ny = -ny
        nz = -nz
      }

      const [tx, ty, tz] = normalize(ex, ey, ez)
      const [bx, by, bz] = normalize(...cross(nx, ny, nz, tx, ty, tz))

      const [u0, v0] = uvOf(ix0, iy0)
      const [u1, v1] = uvOf(ix1, iy1)
      const [u2, v2] = uvOf(ox1, oy1)
      const [u3, v3] = uvOf(ox0, oy0)

      const a = pushVert(ix0, iy0, zIn, nx, ny, nz, u0, v0, tx, ty, tz, bx, by, bz)
      const b = pushVert(ix1, iy1, zIn, nx, ny, nz, u1, v1, tx, ty, tz, bx, by, bz)
      const c = pushVert(ox1, oy1, zOut, nx, ny, nz, u2, v2, tx, ty, tz, bx, by, bz)
      const d = pushVert(ox0, oy0, zOut, nx, ny, nz, u3, v3, tx, ty, tz, bx, by, bz)
      indices.push(a, b, c, a, c, d)
    }
  }

  // ── Bottom bevel ──────────────────────────────────────────────────
  {
    const zIn = -halfT
    const zOut = -(halfT - bevel)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const [ix0, iy0] = inner[i]!
      const [ix1, iy1] = inner[j]!
      const [ox0, oy0] = outer[i]!
      const [ox1, oy1] = outer[j]!

      const ex = ix1 - ix0
      const ey = iy1 - iy0
      const sx = ox0 - ix0
      const sy = oy0 - iy0
      const sz = zOut - zIn
      let [nx, ny, nz] = normalize(...cross(ex, ey, 0, sx, sy, sz))
      if (nz > 0) {
        nx = -nx
        ny = -ny
        nz = -nz
      }

      const [tx, ty, tz] = normalize(ex, ey, 0)
      const [bx, by, bz] = normalize(...cross(nx, ny, nz, tx, ty, tz))

      const [u0, v0] = uvOf(ix0, iy0)
      const [u1, v1] = uvOf(ix1, iy1)
      const [u2, v2] = uvOf(ox1, oy1)
      const [u3, v3] = uvOf(ox0, oy0)

      const a = pushVert(ix0, iy0, zIn, nx, ny, nz, u0, v0, tx, ty, tz, bx, by, bz)
      const b = pushVert(ix1, iy1, zIn, nx, ny, nz, u1, v1, tx, ty, tz, bx, by, bz)
      const c = pushVert(ox1, oy1, zOut, nx, ny, nz, u2, v2, tx, ty, tz, bx, by, bz)
      const d = pushVert(ox0, oy0, zOut, nx, ny, nz, u3, v3, tx, ty, tz, bx, by, bz)
      // Winding from below
      indices.push(a, c, b, a, d, c)
    }
  }

  // ── Edge band (vertical) ──────────────────────────────────────────
  {
    const zTop = halfT - bevel
    const zBot = -(halfT - bevel)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const [x0, y0] = outer[i]!
      const [x1, y1] = outer[j]!
      const ex = x1 - x0
      const ey = y1 - y0
      // CCW outline: outward is rotate-edge 90° CW → (ey, -ex)
      const outward = normalize(ey, -ex, 0)

      const [tx, ty, tz] = normalize(ex, ey, 0)
      const [bx, by, bz] = [0, 0, 1]

      const a = pushVert(x0, y0, zTop, outward[0], outward[1], 0, 0, 1, tx, ty, tz, bx, by, bz)
      const b = pushVert(x1, y1, zTop, outward[0], outward[1], 0, 1, 1, tx, ty, tz, bx, by, bz)
      const c = pushVert(x1, y1, zBot, outward[0], outward[1], 0, 1, 0, tx, ty, tz, bx, by, bz)
      const d = pushVert(x0, y0, zBot, outward[0], outward[1], 0, 0, 0, tx, ty, tz, bx, by, bz)
      indices.push(a, b, c, a, c, d)
    }
  }

  return {
    vertices: new Float32Array(verts),
    indices: new Uint32Array(indices),
    vertexCount: verts.length / VERTEX_FLOATS,
    indexCount: indices.length,
  }
}
