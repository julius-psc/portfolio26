import { octDecode, studioRadiance } from "./studio.wgsl";

struct Bake {
  lights: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var<uniform> bake: Bake;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dir = octDecode(uv);
  let radiance = studioRadiance(dir, bake.lights);
  return vec4f(radiance, 1.0);
}
