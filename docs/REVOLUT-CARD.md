# REVOLUT — a chrome card, rendered properly

A single-artifact portfolio piece: one metal payment card, floating in a dark studio, that reflects its environment with physically plausible chrome and a thin-film iridescent coating. It responds to pointer movement on desktop and device tilt on mobile. There is nothing else on the page.

---

## How to use this document

This is a staged build spec, not a prompt to run in one shot. Work **one stage at a time**. Each stage has a goal, a build list, an explicit "do not build yet" list, and acceptance criteria.

Rules for the assistant working from this doc:

1. Do not skip ahead. Do not implement Stage 5 features while building Stage 2.
2. At the end of each stage, stop and report against the acceptance criteria. Wait for the human to confirm before starting the next stage.
3. If a stage's acceptance criteria can't be met, say so rather than moving on. A wrong foundation compounds.
4. Prefer explicit, readable code over clever code. This is a reference piece; it will be read by other engineers.
5. No placeholder assets. Every texture is generated in code or authored deliberately.

---

## 1. What we're building

### The object

A metal payment card, ISO/IEC 7810 ID-1 format, rendered in real time in the browser with WebGPU.

The issuer branding is **REVOLUT** — a chrome metal card treated as a materials study, not a product marketing page. The face stays nearly empty so the metal does the work.

### The scene

Dark studio. The card sits at rest slightly tilted, catching a bright horizon band and two soft rectangular lights. Nothing else is in frame. No copy, no nav, no "built with" badge in the corner.

### The interaction

- **Desktop**: the card tracks the pointer with mass — it lags, overshoots slightly, and settles. Reflections sweep across the surface faster than the card rotates.
- **Mobile**: the card is driven by device orientation. Tilting the phone moves the metal.
- **Idle**: a very slow drift so the piece is alive when no one is touching it. This is what makes it loop as video.

### The thesis

Chrome is binary. It either reads as metal or it reads as a gradient, and almost every attempt at this on the web lands on gradient. The reason is that most implementations move the highlight *with* the surface, one-to-one. Real reflection doesn't do that. The whole piece succeeds or fails on that one property.

---

## 2. Non-goals

Explicitly out of scope. Adding any of these is a failure, not an improvement.

- A second card, a card selector, or a flip-to-back animation.
- A settings/debug panel in the shipped build (a dev-only one is fine, gated behind a flag).
- Any payment network mark (Visa, Mastercard, etc.). The Revolut wordmark on the card is intentional; nothing else.
- A loading screen with a progress bar. The piece should be up in under a second.
- Scroll-triggered anything.
- Text on the page other than what is on the card itself.
- Physically correct path-traced rendering. We want *plausible*, tuned by eye, at 120fps.

---

## 3. Stack

| Concern | Choice | Note |
|---|---|---|
| Render API | WebGPU | Primary target. |
| Shading language | WGSL | |
| Build | Vite + TypeScript | No framework. This is one canvas. |
| Math | `gl-matrix` or ~80 lines of hand-rolled vec/mat | Hand-rolled is preferred; the matrix stack here is trivial and a dependency-free repo reads better. |
| Fallback | WebGL2 path, or static hero | See Stage 10. |
| Assets | Zero binary textures | Everything procedural or canvas-generated. |

### On WebGPU specifically

Be clear-eyed: this effect is achievable in WebGL2, and a simplified version is achievable in CSS. What WebGPU genuinely buys us:

- **Compute shaders** for generating the prefiltered environment map at load, instead of shipping cubemap assets. This is the real technical justification and it should be visible in the writeup.
- **Storage buffers** for the roughness-mip chain without render-target ping-pong.
- **Explicit pipeline state**, which makes the material's structure legible to anyone reading the source.

Safari support remains the reason demo links break. Stage 10 is not optional.

---

## 4. Physical reference

Get these right. They are free precision and they are the difference between "a card" and "the card."

| Property | Value |
|---|---|
| Width | 85.60 mm |
| Height | 53.98 mm |
| Aspect ratio | 1.5858 : 1 |
| Corner radius | 3.18 mm |
| Thickness (metal card) | 0.80 mm |
| Edge treatment | Slight bevel, ~0.15 mm, catching a bright rim |

EMV contact plate:

| Property | Value |
|---|---|
| Plate size | ~13.0 × 11.0 mm |
| Position | ~19 mm from left edge, vertically centred in the upper-middle third |
| Contacts | 8 pads in two columns of four, separated by fine isolation gaps |
| Material | Gold-toned, noticeably rougher than the card body |

The chip matters more than people expect. It's the one element on the face with a different material, and having it read as *gold and slightly matte* against *chrome and mirror* is a large part of the realism.

---

## 5. Card face design

**Design direction: laser-etched, not embossed.** Contemporary metal cards have moved away from raised numerals. The face carries almost nothing. This is deliberate — the material is the design, so the graphics must get out of its way.

### Face layout

```
┌──────────────────────────────────────────────┐
│                                              │
│   REVOLUT                                    │  ← wordmark, etched, upper left
│                                              │
│   ▓▓▓▓▓▓                                     │  ← EMV chip
│   ▓▓▓▓▓▓                                     │
│                                              │
│                                              │
│                                              │
│                                              │
│   A. HOLLOWAY                                │  ← cardholder, etched, small
│                                              │
└──────────────────────────────────────────────┘
```

That's it. No number on the face, no network mark, no expiry. Empty space is the point.

### Typography

Two elements, two treatments:

- **Wordmark** — a tightly-tracked grotesque, optical-sized for display. Negative tracking, around −20/1000 em. Set at roughly 4.2 mm cap height. The wordmark should be drawn as vector paths, not live text, so we control the outline precisely and can generate a height map from it.
- **Cardholder name** — the same family at a much smaller size with slightly *positive* tracking, around +40/1000 em, because small etched type needs air to stay legible against a mirror surface. Roughly 1.8 mm cap height.

Avoid the default move of setting the cardholder name in a monospace. Real cards don't, and it reads as a tell.

### Etch depth

Both elements are **debossed** — cut into the surface, not raised. Depth around 40 µm. In shading terms this means:

- Their normals tilt inward at the cut walls.
- The cut floor is rougher than the mirror face (laser etching leaves a micro-texture), so it should read matte-grey where the surrounding metal reads mirror.

That roughness contrast is what makes etched type look etched. If the letters are simply darker, it looks painted.

---

## 6. Material model

The card body is **brushed-then-polished stainless with a thin PVD coating**. Four layers, in this order of contribution:

1. **Base metal reflection** — a mirror, sampling the environment. The dominant term.
2. **Anisotropic microstructure** — faint horizontal brush direction, stretching highlights vertically. Subtle; it should be visible only at grazing angles.
3. **Thin-film interference** — a PVD coating a few hundred nanometres thick, producing the iridescent bloom. Wavelength-dependent, angle-dependent.
4. **Edge Fresnel** — the bevel catches a bright rim at all angles.

Key parameters (tune by eye, these are starting values):

```
baseF0            vec3(0.95, 0.93, 0.88)   // stainless, slightly warm
roughness          0.045                    // face
roughnessEtch      0.35                     // etched floors
roughnessChip      0.22                     // gold plate
anisotropy         0.35                     // 0 = isotropic, 1 = fully stretched
brushDirection     vec2(1.0, 0.0)           // horizontal
filmThickness      380.0                    // nanometres
filmIOR            1.42
filmStrength       0.55                     // blend weight of the interference term
```

---

## 7. Build stages

### Stage 0 — Scaffold

**Goal:** a WebGPU device rendering a solid colour into a correctly-sized canvas.

Build:
- Vite + TS project, no framework.
- Canvas sized to `devicePixelRatio`, capped at 2 to protect fill rate on high-DPI phones. Resize observer that reconfigures the swapchain.
- Adapter/device request with real error handling. If WebGPU is absent, log clearly and continue (fallback comes in Stage 10).
- Render target: `rgba16float`, with an explicit tonemap + sRGB encode at the end of the fragment shader. Do **not** use an `-srgb` swapchain format and also tonemap; pick one path and be consistent. HDR-ish intermediate is required because chrome highlights blow past 1.0 and we want them to roll off, not clip.
- 4× MSAA.
- A frame loop with a fixed-step accumulator for physics and a variable-step render.

Do not build yet: any geometry beyond a fullscreen clear, any texture, any input handling.

**Acceptance:** canvas fills viewport, correct on resize, correct on a 3× DPR phone, stable 120fps with nothing on screen, no console warnings.

---

### Stage 1 — The static card face

**This stage is design work, not graphics work.** We are producing the artwork that will later be sampled as a texture. Do it in 2D first so it can be judged on its own terms.

Build:
- A standalone Canvas2D (or SVG) module that draws the card face at high resolution — 2048 × 1291 px, matching the 1.5858 aspect.
- Rounded-rect card outline at the correct relative radius (3.18/85.60 = 0.0371 of the width).
- The wordmark, as vector paths.
- The cardholder name.
- The EMV chip: plate outline, 8 contact pads, isolation gaps, at the dimensions in §4.
- A dev route (`/face`) that renders this 2D artwork alone, on a neutral grey background, at 1:1.

This module outputs **three maps**, all generated from the same drawing code:

| Map | Contents | Format |
|---|---|---|
| Albedo | Base tint per region — body, chip gold, etch floors | `rgba8unorm` |
| Height | Grayscale: 0.5 = face level, darker = cut deeper | `r8unorm` |
| Roughness | Per-region roughness from §6 | `r8unorm` |

The height map is later converted to a normal map (Stage 6). Authoring height and deriving normals is far easier to get right than drawing normals directly.

Do not build yet: any 3D, any WebGPU sampling of these maps, any reflection.

**Acceptance:** the `/face` route looks like a well-designed card as a flat graphic. Proportions measured against §4 are correct to within 1%. The three maps are visually inspectable and each is obviously correct. A designer looking at just the flat face would say the layout is good — if it isn't good flat, no amount of chrome will save it.

---

### Stage 2 — Card geometry

**Goal:** the card as real 3D geometry, flat-shaded, in perspective.

Build:
- Procedural mesh generation for a rounded-rect slab: face, back, extruded edge band, and the bevel chamfer between face and edge. Parameterise corner-arc segment count; 16 per corner is plenty.
- Correct per-vertex normals, with **hard edges at the bevel boundaries** — the bevel must not smooth-shade into the face, or the rim highlight will smear. This means duplicated vertices at those seams.
- UVs on the face mapping 0–1 across the card.
- Tangents and bitangents aligned to the card's local X/Y. Needed for both normal mapping and anisotropy.
- Perspective camera, ~35 mm equivalent FOV, positioned so the card fills roughly 70% of frame width at rest. Long-ish lens: wide lenses exaggerate perspective and make it look like a game asset.
- Flat matte shading with a single directional light. No textures yet.

Do not build yet: environment, reflection, any texture sampling.

**Acceptance:** rotate the card manually via hardcoded values and confirm the silhouette is correct from every angle, the bevel is visible as a distinct facet, corners are smooth, and there are no shading artifacts at the seams.

---

### Stage 3 — Environment

**Goal:** a procedural studio environment that the card will later reflect.

This is the most under-appreciated stage. **A physically perfect chrome shader in an empty room renders as flat grey.** The material's entire appearance is the environment. Expect to spend as much time tuning this as tuning the shader.

Build:
- A compute shader that writes a cubemap (or an octahedral-mapped 2D texture; octahedral is simpler and fine at this quality level). 256² per face is enough.
- The environment, as a function of direction:
  - A **bright horizon band** — a soft gradient from dark floor to bright sky, with a sharp-ish but not hard transition at the horizon line. This single feature does most of the work of making metal read as metal.
  - **Two rectangular softboxes**, one upper-left and larger, one lower-right and smaller and dimmer. Give them soft falloff at the edges. These become the swept highlights.
  - A **dark floor** with a slight gradient, so the lower half of the card doesn't go pure black.
  - Very slight colour temperature split: cooler sky, warmer floor. Neutral environments look CG.
- A prefiltered roughness mip chain, generated by a second compute pass — GGX-importance-sampled convolution, each mip corresponding to a roughness level. We need mips 0–5; the face uses near-mip-0 and the etch floors use much higher mips.
- A dev route (`/env`) that renders the environment directly as a background so it can be judged on its own.

Do not build yet: the card sampling this. Judge the environment standalone first.

**Acceptance:** `/env` shows a plausible studio. The horizon reads clearly. Softbox edges are soft but not mushy. Mip chain visibly blurs progressively with no ringing or seams at cube face boundaries.

---

### Stage 4 — Reflection (the critical stage)

**Goal:** the card reads as polished steel. Not iridescent yet. Just metal.

Build:

Per fragment:

```wgsl
let N = normalize(worldNormal);
let V = normalize(cameraPos - worldPos);
let R = reflect(-V, N);              // R = 2(N·V)N - V
let env = sampleEnvLod(R, roughnessToLod(roughness));
let F = fresnelSchlick(max(dot(N, V), 0.0), baseF0);
color = env * F;
```

**The parallax property.** This is the thing the whole piece rests on. Because `R` depends on both the normal and the view vector, tilting the card by 5° sweeps the reflected environment across the surface by roughly 10° of environment space — and much more in screen terms near grazing angles. The highlights move *faster* than the card. If they move at the same rate, something is wrong: most likely the environment is being sampled by surface position or UV instead of by reflection direction.

Also build:
- Fresnel via Schlick, with metallic F0 (no dielectric white-out; for a conductor, F0 is the base tint and F90 approaches white).
- Sample the albedo/roughness maps from Stage 1 and apply per-region roughness. The chip should now visibly read as a different, blurrier material.
- A simple Reinhard or ACES-approx tonemap on the HDR result.

Do not build yet: thin film, anisotropy, normal mapping, interaction.

**Acceptance — read this carefully:**
- At rest, the card looks like polished stainless and **nothing else**. No rainbow.
- Manually sweep the card through ±25° of tilt. The reflected softboxes must travel across the face markedly faster than the card rotates. Record a video and step through it if you need to confirm.
- The bevel catches a bright rim at every tested angle.
- The chip reads as a distinct, rougher material.

If this stage isn't convincing, **do not proceed**. Iridescence on top of bad chrome is a gradient with extra steps.

---

### Stage 5 — Thin-film interference

**Goal:** the iridescent bloom, correctly.

The rainbow on these cards is not `hue-rotate`. It is interference in a coating a few hundred nanometres thick: light reflecting off the top of the film and light reflecting off the film/metal boundary travel different distances, and at each wavelength that path difference is either constructive or destructive.

Implement:

```
// θi = incidence angle, from dot(N, V)
// Snell: sinθt = sinθi / filmIOR
cosθt = sqrt(1 - (sin²θi / filmIOR²))

// Optical path difference through the film
opd = 2 * filmIOR * filmThickness * cosθt

// Per wavelength λ (R 680nm, G 550nm, B 440nm):
phase_λ = 2π * opd / λ
intensity_λ = 0.5 + 0.5 * cos(phase_λ)     // normalised interference term

filmColor = vec3(intensity_R, intensity_G, intensity_B)
```

Then blend: `finalF0 = mix(baseF0, baseF0 * filmColor, filmStrength)` and use that in the Fresnel term, so the iridescence modulates the reflection rather than being painted over it. This ordering matters — a film tint applied after the environment sample looks like a filter; applied to F0 it looks like a coating.

Also:
- Vary `filmThickness` spatially with a very low-frequency smooth noise, ±15%. Real PVD coatings aren't perfectly uniform, and this produces the soft irregular colour zones visible in the reference rather than clean concentric bands.
- Because phase depends on `cosθt`, the colour bands will naturally compress toward grazing angles. Verify that they do. Even bands across the whole surface means the angle dependence isn't wired up.

**Acceptance:** tilting produces colours that shift through the spectrum in a physically ordered way. Bands compress at glancing angles. At near-normal incidence the card is close to neutral chrome with only a faint tint. Turning `filmStrength` to 0 returns exactly to Stage 4's appearance.

---

### Stage 6 — Surface detail

**Goal:** the etched type reads as cut into metal, and the brush direction becomes visible.

Build:
- Convert the Stage 1 height map to a normal map (Sobel, in a compute pass at load).
- Apply it in tangent space. The etched wordmark's walls should now catch light independently of the face — as the card tilts, the letters should flare and disappear rather than sitting there statically.
- **Anisotropic specular.** Replace the isotropic roughness with an anisotropic GGX term, roughness split into `αt` along the brush tangent and `αb` along the bitangent, derived from `roughness` and `anisotropy`. Highlights stretch perpendicular to the brush direction.
- Optional, high value: a very faint high-frequency noise added to the normal at ~0.02 strength, representing micro-imperfection. Perfectly smooth surfaces read as CG. This is small and matters a lot.

**Acceptance:** etched type catches light at some angles and vanishes at others. Softbox reflections are visibly stretched vertically (brush is horizontal). Zooming in reveals detail rather than flatness.

---

### Stage 7 — Motion

**Goal:** the card has mass.

Build:
- Pointer position mapped to target rotation. Range: ±18° on Y, ±12° on X. Resist the urge to go wider; large rotations look like a toy.
- **Spring-damper integration**, not CSS transitions and not `lerp`. Per axis:
  ```
  force = stiffness * (target - current) - damping * velocity
  velocity += force * dt
  current  += velocity * dt
  ```
  Start with `stiffness = 120`, `damping = 14`, tuned so it's just under critically damped — a single small overshoot, then settle. Run this on the fixed timestep from Stage 0.
- Slight positional translation coupled to rotation, so the card appears to pivot around a point behind itself rather than spinning in place.
- **Idle drift**: when no input for 2s, ease into a slow figure-eight, amplitude ~4°, period ~12s. This is what makes the piece loop as video.
- **Mobile**: `DeviceOrientationEvent`, with the iOS 13+ permission request behind a tap. Calibrate to the device's orientation at first event rather than assuming flat. Fall back to touch-drag if permission is denied.
- `prefers-reduced-motion`: disable idle drift and reduce spring response; keep direct input tracking.

**Acceptance:** the card feels heavy. Flicking the pointer across the viewport produces overshoot and settle, not a snap. On a phone, tilting produces immediate, well-damped response with no drift or gimbal weirdness.

---

### Stage 8 — Composition

**Goal:** the page, such as it is.

Build:
- Background: near-black, but not `#000` — a very dark neutral with a subtle radial falloff so the card sits in space rather than on a void.
- A contact shadow beneath the card. Soft, offset correctly for the key light's direction from Stage 3. A cheap blurred ellipse is fine; what matters is that its direction agrees with the lighting.
- A subtle vignette. Slight, and only if it helps.
- Page load: the card should *arrive*. One orchestrated moment — it settles into frame from slightly further away and slightly over-rotated, using the same spring system, over about 900ms. One sequence only; no staggered fades on anything else.

**Acceptance:** a screenshot of the piece at rest is good enough to post on its own, with no motion, no caption, and nothing cropped out.

---

### Stage 9 — Performance

**Goal:** 120fps on desktop, 60fps on a mid-range phone.

- Profile before optimising. Most likely cost is the environment prefilter, which should run once at load, not per frame.
- Cap DPR at 2. Consider 1.5 on mobile if fill-bound.
- Ensure the mip selection isn't causing dependent texture reads in a hot loop.
- Budget: under 3ms GPU per frame at 1440p.

**Acceptance:** stable frame times with no spikes on sustained interaction. Load to first frame under 1s on a warm cache.

---

### Stage 10 — Fallback and ship

Not optional. A demo link that shows a blank canvas in Safari is worse than not posting.

- Detect WebGPU. On failure, fall back in this order:
  1. **WebGL2 path** — same shaders ported to GLSL, environment prefilter done as render-to-texture instead of compute. This is real work; budget for it or skip to option 2.
  2. **Static hero** — a pre-rendered high-quality still of the card, with a one-line note that the interactive version requires WebGPU, and a link to a recorded video.
- Graceful handling of adapter loss.
- Meta/OG image: a rendered still, not a screenshot of the page.
- Keyboard: arrow keys tilt the card. Visible focus ring on the canvas.
- Reduced-motion respected as per Stage 7.

---

## 8. Definition of done

The piece is finished when all of these are true:

- A still screenshot reads unambiguously as metal, not as a gradient.
- Tilting produces reflection movement that is visibly faster than the card's own rotation.
- Iridescent colour shifts in spectral order and compresses at grazing angles.
- Etched type appears and disappears with angle.
- The card feels heavy under the pointer.
- It works, or degrades honestly, in Safari.
- There is nothing else on the page.

---

## 9. Notes for the writeup

Worth capturing as you build, because the writeup is half the value of the piece:

- The parallax insight from Stage 4 — why most attempts look fake — is the single most shareable idea here. Lead with it.
- A side-by-side of `hue-rotate` iridescence versus real thin-film interference, tilting through the same range, makes the argument in two seconds.
- The compute-shader environment prefilter is the strongest WebGPU-specific justification. Show the mip chain.
- Publish the material as a small standalone module if the code separates cleanly. An artifact people can use outlives an artifact people liked.