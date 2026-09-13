// Shared studio environment — pure WGSL module (no bindings).

fn signNotZero(v: vec2f) -> vec2f {
  return vec2f(select(-1.0, 1.0, v.x >= 0.0), select(-1.0, 1.0, v.y >= 0.0));
}

/** Unit direction → octahedral UV in [0, 1]. */
export fn octEncode(n: vec3f) -> vec2f {
  var p = n.xy / (abs(n.x) + abs(n.y) + abs(n.z));
  if (n.z < 0.0) {
    p = (vec2f(1.0) - abs(p.yx)) * signNotZero(p);
  }
  return p * 0.5 + 0.5;
}

/** Octahedral UV in [0, 1] → unit direction. */
export fn octDecode(uv: vec2f) -> vec3f {
  let f = uv * 2.0 - 1.0;
  var n = vec3f(f.x, f.y, 1.0 - abs(f.x) - abs(f.y));
  if (n.z < 0.0) {
    let xy = (vec2f(1.0) - abs(n.yx)) * signNotZero(n.xy);
    n = vec3f(xy.x, xy.y, n.z);
  }
  return normalize(n);
}

/** Rectangular softbox in direction space (plane at unit distance along `axis`). */
fn softbox(
  dir: vec3f,
  axis: vec3f,
  tangent: vec3f,
  bitangent: vec3f,
  halfW: f32,
  halfH: f32,
  softness: f32,
  intensity: f32,
  tint: vec3f,
) -> vec3f {
  let a = normalize(axis);
  let z = dot(dir, a);
  if (z < 0.05) {
    return vec3f(0.0);
  }
  let t = normalize(tangent - a * dot(tangent, a));
  let b = normalize(bitangent - a * dot(bitangent, a));
  let x = dot(dir, t) / z;
  let y = dot(dir, b) / z;
  let wx = 1.0 - smoothstep(halfW, halfW + softness, abs(x));
  let wy = 1.0 - smoothstep(halfH, halfH + softness, abs(y));
  return tint * (intensity * wx * wy);
}

/**
 * Studio radiance.
 * `lights` 0 = unlit ambient (dark metal), 1 = full softbox studio.
 */
export fn studioRadiance(dirIn: vec3f, lights: f32) -> vec3f {
  let d = normalize(dirIn);
  let L = clamp(lights, 0.0, 1.0);

  // Bare ambient — dim room, neutral metal sheen (no softboxes / no colour)
  let sky = vec3f(0.22, 0.23, 0.25);
  let floorCol = vec3f(0.05, 0.048, 0.046);
  let hemi = smoothstep(-0.03, 0.06, d.y);
  var col = mix(floorCol, sky, hemi);
  col += vec3f(0.10, 0.105, 0.11) * pow(max(d.z, 0.0), 1.1);
  let band = exp(-pow(d.y / 0.08, 2.0));
  col += vec3f(0.35, 0.37, 0.42) * band * 0.35;

  // Studio contribution (horizon, fill, softboxes) scales with lights
  var studio = vec3f(0.0);
  let studioBand = exp(-pow(d.y / 0.07, 2.0));
  studio += vec3f(0.45, 0.48, 0.58) * studioBand * 0.55;
  studio += vec3f(0.14, 0.15, 0.17) * pow(max(d.z, 0.0), 1.15);

  studio += softbox(
    d,
    normalize(vec3f(-0.28, 0.38, 0.88)),
    vec3f(1.0, 0.0, 0.1),
    vec3f(0.0, 1.0, 0.0),
    0.34,
    0.26,
    0.15,
    1.55,
    vec3f(1.0, 0.72, 0.52),
  );
  studio += softbox(
    d,
    normalize(vec3f(0.55, 0.12, 0.82)),
    vec3f(1.0, 0.0, -0.1),
    vec3f(0.0, 1.0, 0.0),
    0.28,
    0.22,
    0.13,
    0.85,
    vec3f(0.45, 0.7, 1.0),
  );
  studio += softbox(
    d,
    normalize(vec3f(0.05, -0.42, 0.88)),
    vec3f(1.0, 0.0, 0.0),
    vec3f(0.0, 0.0, 1.0),
    0.32,
    0.15,
    0.12,
    0.55,
    vec3f(0.55, 0.8, 1.0),
  );

  col += studio * L;
  return col;
}
