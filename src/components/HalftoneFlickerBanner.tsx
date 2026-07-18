import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shaders ──────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// uTextMask: white = show halftone, black = discard (transparent)
// When no text is used a 1×1 all-white texture is bound → mask is always 1
const fragmentShader = /* glsl */ `
  uniform float     uTime;
  uniform vec2      uResolution;
  uniform float     uGridScale;
  uniform float     uFlickerAmount;
  uniform float     uSpeed;
  uniform float     uContrast;
  uniform float     uBlobScale;
  uniform vec3      uForeground;
  uniform vec3      uBackground;
  uniform float     uOpacity;
  uniform sampler2D uTextMask;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p  = p * 2.1 + vec2(3.7, 1.5);
      a *= 0.5;
    }
    return v;
  }

  float blobField(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p               + t * 0.11),
      fbm(p + vec2(5.2, 1.3) + t * 0.09)
    );
    return fbm(p + 3.2 * q + t * 0.07);
  }

  void main() {
    float mask = texture2D(uTextMask, vUv).r;
    if (mask < 0.01) discard;

    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;

    float t        = uTime * uSpeed;
    float cellSize = 1.0 / uGridScale;

    vec2 cellId     = floor(uv / cellSize);
    vec2 cellCenter = (cellId + 0.5) * cellSize;

    float lum = blobField(cellCenter * uBlobScale, t);
    lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);

    float flickerPhase = hash(cellId) * 3.0;
    float flickerT     = floor(uTime * 4.0 + flickerPhase);
    float flicker      = (hash(cellId + flickerT * vec2(17.3, 5.7)) - 0.5) * uFlickerAmount;

    float lit   = step(0.5, lum + flicker);
    vec3  color = mix(uBackground, uForeground, lit);

    gl_FragColor = vec4(color, mask * uOpacity);
  }
`;

// ─── Texture helpers ──────────────────────────────────────────────────────────

function makeWhiteTexture(): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1, 1,
    THREE.RGBAFormat
  );
  tex.needsUpdate = true;
  return tex;
}

function buildTextMask(
  text: string,
  texW: number,
  texH: number,
  fontFamily: string,
  fontWeight: number | string
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width  = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, texW, texH);

  const maxSize = texH * 0.8;
  ctx.font = `${fontWeight} ${maxSize}px ${fontFamily}`;
  const measuredW = ctx.measureText(text).width;
  const scale     = Math.min(1, (texW * 0.95) / measuredW);
  const fontSize  = maxSize * scale;

  ctx.font         = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle    = "#fff";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, texW / 2, texH / 2);

  return new THREE.CanvasTexture(canvas);
}

// ─── Inner mesh ───────────────────────────────────────────────────────────────

interface ShaderPlaneProps {
  text: string | undefined;
  fontFamily: string;
  fontWeight: number | string;
  gridScale: number;
  flickerAmount: number;
  speed: number;
  contrast: number;
  blobScale: number;
  foregroundColor: string;
  backgroundColor: string;
  opacity: number;
}

function ShaderPlane({
  text,
  fontFamily,
  fontWeight,
  gridScale,
  flickerAmount,
  speed,
  contrast,
  blobScale,
  foregroundColor,
  backgroundColor,
  opacity,
}: ShaderPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();

  const textMask = useMemo(() => {
    if (!text) return makeWhiteTexture();
    const texW = 2048;
    const texH = Math.round(texW * size.height / size.width);
    return buildTextMask(text, texW, Math.max(texH, 64), fontFamily, fontWeight);
  }, [text, fontFamily, fontWeight, size.width, size.height]);

  useEffect(() => () => { textMask.dispose(); }, [textMask]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTime:          { value: 0 },
      uResolution:    { value: new THREE.Vector2(size.width, size.height) },
      uGridScale:     { value: gridScale },
      uFlickerAmount: { value: flickerAmount },
      uSpeed:         { value: speed },
      uContrast:      { value: contrast },
      uBlobScale:     { value: blobScale },
      uForeground:    { value: new THREE.Color(foregroundColor) },
      uBackground:    { value: new THREE.Color(backgroundColor) },
      uOpacity:       { value: opacity },
      uTextMask:      { value: textMask },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  useEffect(() => {
    uniforms.uTextMask.value = textMask;
  }, [textMask, uniforms]);

  useFrame(({ clock }) => {
    const mat = meshRef.current?.material as THREE.ShaderMaterial | undefined;
    if (!mat) return;
    mat.uniforms.uTime.value          = clock.getElapsedTime();
    mat.uniforms.uGridScale.value     = gridScale;
    mat.uniforms.uFlickerAmount.value = flickerAmount;
    mat.uniforms.uSpeed.value         = speed;
    mat.uniforms.uContrast.value      = contrast;
    mat.uniforms.uBlobScale.value     = blobScale;
    (mat.uniforms.uForeground.value as THREE.Color).set(foregroundColor);
    (mat.uniforms.uBackground.value as THREE.Color).set(backgroundColor);
    mat.uniforms.uOpacity.value       = opacity;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={!!text || opacity < 1}
      />
    </mesh>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export interface HalftoneFlickerBannerProps {
  /** When provided, renders the text as a halftone mask instead of a full background */
  text?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  height?: number | string;
  className?: string;
  gridScale?: number;
  flickerAmount?: number;
  speed?: number;
  contrast?: number;
  blobScale?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  foregroundColorDark?: string;
  backgroundColorDark?: string;
  opacity?: number;
  /** Force dark palette. Defaults to false (always light). */
  dark?: boolean;
}

export default function HalftoneFlickerBanner({
  text,
  fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif",
  fontWeight = 800,
  height = 160,
  className,
  gridScale = 55,
  flickerAmount = 0.18,
  speed = 0.35,
  contrast = 3.5,
  blobScale = 1.6,
  foregroundColor = "#111111",
  backgroundColor = "#f5f4f0",
  foregroundColorDark = "#71717a",
  backgroundColorDark = "#09090b",
  opacity = 1,
  dark = false,
}: HalftoneFlickerBannerProps) {
  const fg = dark ? foregroundColorDark : foregroundColor;
  const bg = dark ? backgroundColorDark : backgroundColor;

  return (
    <div
      className={className}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
        display: "block",
        overflow: "hidden",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 1], near: 0.01, far: 10, fov: 75 }}
        gl={{ antialias: false, alpha: !!text || opacity < 1 }}
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <ShaderPlane
          text={text}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          gridScale={gridScale}
          flickerAmount={flickerAmount}
          speed={speed}
          contrast={contrast}
          blobScale={blobScale}
          foregroundColor={fg}
          backgroundColor={bg}
          opacity={opacity}
        />
      </Canvas>
    </div>
  );
}
