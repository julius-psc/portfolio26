import { studioRadiance } from "./studio.wgsl";

struct Params {
  mip: f32,
  mipCount: f32,
  _pad0: f32,
  _pad1: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn radicalInverseVdC(bitsIn: u32) -> f32 {
  var bits = bitsIn;
  bits = (bits << 16u) | (bits >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return f32(bits) * 2.3283064365386963e-10;
}

fn hammersley(i: u32, n: u32) -> vec2f {
  return vec2f(f32(i) / f32(n), radicalInverseVdC(i));
}

fn importanceSampleGGX(xi: vec2f, N: vec3f, roughness: f32) -> vec3f {
  let a = roughness * roughness;
  let phi = 2.0 * 3.14159265 * xi.x;
  let cosTheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
  let sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 0.0));
  let H = vec3f(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
  var up = vec3f(1.0, 0.0, 0.0);
  if (abs(N.z) < 0.999) { up = vec3f(0.0, 0.0, 1.0); }
  let tangent = normalize(cross(up, N));
  let bitangent = cross(N, tangent);
  return normalize(tangent * H.x + bitangent * H.y + N * H.z);
}

fn prefilterLive(R: vec3f, roughness: f32) -> vec3f {
  if (roughness < 0.05) {
    return studioRadiance(R, 1.0);
  }
  let sampleCount = 32u;
  var color = vec3f(0.0);
  var weight = 0.0;
  for (var i = 0u; i < sampleCount; i++) {
    let xi = hammersley(i, sampleCount);
    let H = importanceSampleGGX(xi, R, roughness);
    let L = normalize(2.0 * dot(R, H) * H - R);
    let NdotL = max(dot(R, L), 0.0);
    if (NdotL > 0.0) {
      color += studioRadiance(L, 1.0) * NdotL;
      weight += NdotL;
    }
  }
  return color / max(weight, 1e-4);
}

fn tonemap(c: vec3f) -> vec3f {
  return c / (c + vec3f(1.0));
}

fn dirFromEquirect(uv: vec2f) -> vec3f {
  let theta = uv.x * 6.2831853;
  let phi = uv.y * 3.14159265; // y=0 top → +Y sky
  return normalize(vec3f(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta)));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let stripH = 0.16;

  // Bottom strip — live GGX at roughness for mips 0..5 (visual check of the chain)
  if (uv.y > 1.0 - stripH) {
    let localY = (uv.y - (1.0 - stripH)) / stripH;
    let cell = floor(uv.x * 6.0);
    let localX = fract(uv.x * 6.0);
    let roughness = cell / 5.0;
    let dir = dirFromEquirect(vec2f(localX, localY));
    return vec4f(tonemap(prefilterLive(dir, roughness)), 1.0);
  }

  let v = uv.y / (1.0 - stripH);
  let mip = clamp(params.mip, 0.0, params.mipCount - 1.0);
  let roughness = mip / max(params.mipCount - 1.0, 1.0);
  let dir = dirFromEquirect(vec2f(uv.x, v));
  return vec4f(tonemap(prefilterLive(dir, roughness)), 1.0);
}
