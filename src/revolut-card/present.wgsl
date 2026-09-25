struct Present {
  // xy = shadow center UV, z = strength 0–1, w = card upright 0–1
  shadow: vec4f,
}

@group(0) @binding(0) var scene: texture_2d<f32>;
@group(0) @binding(1) var sceneSampler: sampler;
@group(0) @binding(2) var<uniform> present: Present;

fn acesTonemap(x: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}

/** Compress luminance only — keeps pearl hue instead of washing softbox peaks to white. */
fn tonemapHuePreserve(hdr: vec3f) -> vec3f {
  let peak = max(max(hdr.x, hdr.y), hdr.z);
  if (peak < 1e-5) {
    return vec3f(0.0);
  }
  let mapped = acesTonemap(vec3f(peak)).x;
  return clamp(hdr * (mapped / peak), vec3f(0.0), vec3f(1.0));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let hdr = textureSampleLevel(scene, sceneSampler, uv, 0.0).rgb;
  let card = tonemapHuePreserve(hdr * 1.5);

  // Near-black radial falloff — card sits in space
  let p = uv * 2.0 - 1.0;
  let r = length(p * vec2f(1.0, 1.12));
  let center = vec3f(0.11, 0.11, 0.12);
  let edge = vec3f(0.01, 0.01, 0.012);
  var bg = mix(center, edge, smoothstep(0.05, 1.05, r));

  // Contact shadow — opposite key softbox (upper-left → lower-right)
  let sc = present.shadow.xy;
  // Ellipse follows the card's roll: wide when landscape, tall when upright.
  let d = (uv - sc) / mix(vec2f(0.28, 0.16), vec2f(0.16, 0.28), present.shadow.w);
  let soft = exp(-dot(d, d) * 1.4);
  bg *= 1.0 - soft * present.shadow.z * 0.85;

  // Card over bg (clear is black → edges keep radial)
  var col = max(bg, card);

  // Subtle vignette
  let vig = 1.0 - smoothstep(0.55, 1.4, r) * 0.38;
  col *= vig;

  return vec4f(col, 1.0);
}
