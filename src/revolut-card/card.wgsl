import { octEncode } from "./env/studio.wgsl";

struct Camera {
  viewProjection: mat4x4f,
  cameraPos: vec3f,
  _pad0: f32,
}

struct Model {
  model: mat4x4f,
  normalMatrix: mat4x4f,
}

struct Material {
  baseF0: vec4f, // xyz = stainless F0
  // x=face, y=chip, z=etch roughness defaults (maps override), w unused
  roughness: vec4f,
  // x=thickness nm, y=IOR, z=strength, w=anisotropy
  film: vec4f,
  // x = softbox mix 0..1 (animated from UI)
  lights: vec4f,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;
@group(0) @binding(2) var<uniform> material: Material;
@group(0) @binding(3) var albedoMap: texture_2d<f32>;
@group(0) @binding(4) var roughMap: texture_2d<f32>;
@group(0) @binding(5) var normalMap: texture_2d<f32>;
@group(0) @binding(6) var faceSamp: sampler;
@group(0) @binding(7) var envMip0: texture_2d<f32>;
@group(0) @binding(8) var envMip1: texture_2d<f32>;
@group(0) @binding(9) var envMip2: texture_2d<f32>;
@group(0) @binding(10) var envMip3: texture_2d<f32>;
@group(0) @binding(11) var envMip4: texture_2d<f32>;
@group(0) @binding(12) var envMip5: texture_2d<f32>;
@group(0) @binding(13) var envAmb: texture_2d<f32>;
@group(0) @binding(14) var envSamp: sampler;

struct VertexIn {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) tangent: vec3f,
  @location(4) bitangent: vec3f,
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) worldTangent: vec3f,
  @location(3) worldBitangent: vec3f,
  @location(4) uv: vec2f,
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
  return F0 + (vec3f(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

fn sampleEnvMip(uv: vec2f, mip: u32) -> vec3f {
  switch mip {
    case 1u: { return textureSampleLevel(envMip1, envSamp, uv, 0.0).rgb; }
    case 2u: { return textureSampleLevel(envMip2, envSamp, uv, 0.0).rgb; }
    case 3u: { return textureSampleLevel(envMip3, envSamp, uv, 0.0).rgb; }
    case 4u: { return textureSampleLevel(envMip4, envSamp, uv, 0.0).rgb; }
    case 5u: { return textureSampleLevel(envMip5, envSamp, uv, 0.0).rgb; }
    default: { return textureSampleLevel(envMip0, envSamp, uv, 0.0).rgb; }
  }
}

/** Prefiltered env LOD from roughness — no dependent mip in a loop. */
fn sampleEnvLod(dir: vec3f, roughness: f32) -> vec3f {
  let uv = octEncode(normalize(dir));
  let lod = clamp(roughness * 5.0, 0.0, 5.0);
  let lo = u32(floor(lod));
  let hi = min(lo + 1u, 5u);
  let f = fract(lod);
  return mix(sampleEnvMip(uv, lo), sampleEnvMip(uv, hi), f);
}

fn sampleEnvLit(dir: vec3f, roughness: f32, lights: f32) -> vec3f {
  let full = sampleEnvLod(dir, roughness);
  let ambUv = octEncode(normalize(dir));
  let amb = textureSampleLevel(envAmb, envSamp, ambUv, 0.0).rgb;
  return mix(amb, full, clamp(lights, 0.0, 1.0));
}

fn sampleEnvAniso(
  V: vec3f,
  N: vec3f,
  T: vec3f,
  B: vec3f,
  roughness: f32,
  aniso: f32,
  lights: f32,
) -> vec3f {
  let t = normalize(T - N * dot(N, T));
  let b = normalize(cross(N, t));
  let aspect = sqrt(max(1.0 - aniso * 0.9, 0.01));
  let a = max(roughness * roughness, 1e-4);
  let ax = max(a / aspect, 1e-4);
  let ay = max(a * aspect, 1e-4);

  let R = reflect(-V, N);
  let rt = dot(R, t);
  let rb = dot(R, b);
  let rn = dot(R, N);
  let stretch = ay / ax;
  let Rstretch = normalize(t * rt + b * rb * stretch + N * rn);

  // One prefiltered tap — LOD carries GGX blur; stretch keeps brush direction
  return sampleEnvLit(Rstretch, roughness, lights);
}

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), u.x),
    mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), u.x),
    u.y,
  );
}

fn hsv2rgb(h: f32, s: f32, v: f32) -> vec3f {
  let K = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(vec3f(h) + K.xyz) * 6.0 - K.www);
  return v * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), s);
}

fn fbm2(p: vec2f) -> f32 {
  return valueNoise(p) * 0.55
    + valueNoise(p * 2.03 + vec2f(1.7, 3.1)) * 0.30
    + valueNoise(p * 4.07 + vec2f(5.2, 1.4)) * 0.15;
}

fn thinFilmPearl(cosThetaI: f32, thicknessNm: f32, ior: f32, uv: vec2f) -> vec3f {
  let sin2i = max(1.0 - cosThetaI * cosThetaI, 0.0);
  let sin2t = sin2i / (ior * ior);
  let cosThetaT = sqrt(max(1.0 - sin2t, 0.0));
  let opd = 2.0 * ior * thicknessNm * cosThetaT;

  // Image-1 corner fields: orange / yellow / indigo / lime
  let cTL = vec3f(0.98, 0.32, 0.14);
  let cTR = vec3f(0.98, 0.88, 0.18);
  let cBL = vec3f(0.28, 0.32, 0.92);
  let cBR = vec3f(0.28, 0.95, 0.38);

  let warp = (fbm2(uv * 1.1 + vec2f(0.3, 1.2)) - 0.5) * 0.22;
  let wx = clamp(uv.x + warp, 0.0, 1.0);
  // Mesh UV: v up — high y = top of card
  let wy = clamp(uv.y + (fbm2(uv * 1.05 + vec2f(2.4, 0.6)) - 0.5) * 0.18, 0.0, 1.0);
  let top = mix(cTL, cTR, smoothstep(0.05, 0.95, wx));
  let bot = mix(cBL, cBR, smoothstep(0.05, 0.95, wx));
  var pools = mix(bot, top, smoothstep(0.08, 0.92, wy));

  // Slight view-dependent drift (thin-film), keep saturation high
  let drift = (opd / 520.0 - 0.5) * 0.12 + (1.0 - cosThetaI) * 0.08;
  pools = clamp(pools + vec3f(drift * 0.4, -drift * 0.15, -drift * 0.35), vec3f(0.0), vec3f(1.2));
  return pools;
}

fn faceUv(uv: vec2f) -> vec2f {
  return vec2f(uv.x, 1.0 - uv.y);
}

fn faceMaterial(uv: vec2f) -> vec4f {
  let tUv = faceUv(uv);
  let albedo = textureSample(albedoMap, faceSamp, tUv).rgb;
  let rough = textureSample(roughMap, faceSamp, tUv).r;
  return vec4f(albedo, rough);
}

fn perturbNormal(
  uv: vec2f,
  N: vec3f,
  T: vec3f,
  B: vec3f,
) -> vec3f {
  let tUv = faceUv(uv);
  var nTS = textureSample(normalMap, faceSamp, tUv).xyz * 2.0 - 1.0;
  nTS.y = -nTS.y;
  let t = normalize(T - N * dot(N, T));
  let b = normalize(B - N * dot(N, B));
  return normalize(t * nTS.x + b * nTS.y + N * nTS.z);
}

@vertex fn vs_main(input: VertexIn) -> VertexOut {
  var out: VertexOut;
  let world = model.model * vec4f(input.position, 1.0);
  out.worldPos = world.xyz;
  out.position = camera.viewProjection * world;
  out.worldNormal = normalize((model.normalMatrix * vec4f(input.normal, 0.0)).xyz);
  out.worldTangent = normalize((model.normalMatrix * vec4f(input.tangent, 0.0)).xyz);
  out.worldBitangent = normalize((model.normalMatrix * vec4f(input.bitangent, 0.0)).xyz);
  out.uv = input.uv;
  return out;
}

@fragment fn fs_main(input: VertexOut) -> @location(0) vec4f {
  let Ngeom = normalize(input.worldNormal);
  let T = normalize(input.worldTangent);
  let B = normalize(input.worldBitangent);
  let N = perturbNormal(input.uv, Ngeom, T, B);
  let V = normalize(camera.cameraPos - input.worldPos);
  let NdotV = max(dot(N, V), 0.0);
  let matSample = faceMaterial(input.uv);
  let albedo = matSample.rgb;
  let roughness = matSample.a;
  let aniso = material.film.w;

  let lights = material.lights.x;
  let thickField = fbm2(input.uv * 1.05 + vec2f(0.3, 1.1));
  let thickness = material.film.x * (0.82 + 0.36 * thickField);

  let pearl = thinFilmPearl(NdotV, thickness, material.film.y, input.uv);
  let baseF0 = material.baseF0.xyz * albedo;
  let grazing = pow(1.0 - NdotV, 1.25);
  // Iridescence only when studio light is on — off = bare stainless
  let strength = material.film.z * mix(0.9, 1.0, grazing) * lights;
  let metalLum = max(max(baseF0.x, baseF0.y), baseF0.z);
  let F0 = mix(baseF0, pearl * metalLum, clamp(strength, 0.0, 1.0));

  var env = sampleEnvAniso(V, N, T, B, roughness, aniso, lights);
  // Mild luminance knee — hue-preserve tonemap handles the rest
  let envLum = max(max(env.x, env.y), env.z);
  env = env * (1.0 / (1.0 + envLum * 0.18));
  let F = fresnelSchlick(NdotV, F0);

  // Slightly lower gain when unlit so metal stays dark chrome, not lifted grey
  let gain = mix(1.45, 1.75, lights);
  return vec4f(env * F * gain, 1.0);
}
