/**
 * Ink Bleed Theme Changer
 * Adapted from https://github.com/codemure-official/ink-bleed-theme-changer
 *
 * Implements a WebGL2 procedural ink-spread transition between light and dark themes
 * with organic domain-warped FBM noise, branching tendril filaments, paper fibres,
 * diffusion haze, speckles, and pigment pooling.
 */

export type Theme = "light" | "dark";

export interface Point {
  x: number;
  y: number;
}

export const NOISE_SIZE = 256;
export const NOISE_CELLS = 32;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function channel(rand: () => number): Float32Array {
  const gx = new Float32Array(NOISE_CELLS * NOISE_CELLS);
  const gy = new Float32Array(NOISE_CELLS * NOISE_CELLS);
  for (let i = 0; i < gx.length; i++) {
    const a = rand() * Math.PI * 2;
    gx[i] = Math.cos(a);
    gy[i] = Math.sin(a);
  }
  const texelsPerCell = NOISE_SIZE / NOISE_CELLS;
  const out = new Float32Array(NOISE_SIZE * NOISE_SIZE);
  const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (cx: number, cy: number): number =>
    ((cy + NOISE_CELLS) % NOISE_CELLS) * NOISE_CELLS + ((cx + NOISE_CELLS) % NOISE_CELLS);

  for (let y = 0; y < NOISE_SIZE; y++) {
    const py = (y + 0.5) / texelsPerCell;
    const cy = Math.floor(py);
    const fy = py - cy;
    const v = fade(fy);
    for (let x = 0; x < NOISE_SIZE; x++) {
      const px = (x + 0.5) / texelsPerCell;
      const cx = Math.floor(px);
      const fx = px - cx;
      const u = fade(fx);
      const i00 = at(cx, cy);
      const i10 = at(cx + 1, cy);
      const i01 = at(cx, cy + 1);
      const i11 = at(cx + 1, cy + 1);
      const n00 = gx[i00]! * fx + gy[i00]! * fy;
      const n10 = gx[i10]! * (fx - 1) + gy[i10]! * fy;
      const n01 = gx[i01]! * fx + gy[i01]! * (fy - 1);
      const n11 = gx[i11]! * (fx - 1) + gy[i11]! * (fy - 1);
      const nx0 = n00 + (n10 - n00) * u;
      const nx1 = n01 + (n11 - n01) * u;
      out[y * NOISE_SIZE + x] = nx0 + (nx1 - nx0) * v;
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]! * 1.45));
  return out;
}

function createNoiseTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const rand = mulberry32(0x1b1eed);
  const channels = [channel(rand), channel(rand), channel(rand), channel(rand)];
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
  for (let i = 0; i < NOISE_SIZE * NOISE_SIZE; i++) {
    for (let c = 0; c < 4; c++) {
      data[i * 4 + c] = Math.round((channels[c]![i]! * 0.5 + 0.5) * 255);
    }
  }
  const tex = gl.createTexture();
  if (!tex) throw new Error("createTexture failed");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, NOISE_SIZE, NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return tex;
}

const FULLSCREEN_VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const INK_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec3 uTargetColor;
uniform float uCanvasScale;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uCleanup;
uniform float uTime;
uniform float uRef;
uniform vec2 uSeed;
uniform mat2 uSeedRot;

uniform float uTendril;
uniform float uNoiseScale;
uniform float uSoftness;
uniform float uDrift;
uniform vec3 uRimColor;

out vec4 outColor;

const float A_LOBE = 0.22;
const float A_BLOB = 0.20;
const float A_SUM = A_LOBE + A_BLOB;
const float TENDRIL_REACH = 0.24;
const float FIBRE_PX = 1.8;
const float THIN_MAX_PX = 26.0;
const float SPECK_PX = 18.0;
const float HAZE_PX = 16.0;

uniform sampler2D uNoise;
const float INV_CELLS = 1.0 / 32.0;

float gnoise(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).r * 2.0 - 1.0;
}

float gnoise2(vec2 p) {
  return textureLod(uNoise, p * INV_CELLS, 0.0).g * 2.0 - 1.0;
}

const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8) * 2.03;

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.875;
}

float fbm4(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.9375;
}

float fbm5(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; }
  return s / 0.96875;
}

void main() {
  vec2 devPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 css = devPx / uCanvasScale;
  vec2 rel = css - uCenter;
  float d = length(rel);
  float R = uRadius;
  float cleanup = uCleanup;

  float inner = R * (1.0 - A_SUM) + cleanup - FIBRE_PX - THIN_MAX_PX - uSoftness * 2.0;
  float outer = R * (1.0 + A_SUM) * (1.0 + TENDRIL_REACH * uTendril) + cleanup + FIBRE_PX + SPECK_PX + uSoftness * 2.0;
  
  if (d < inner) {
    outColor = vec4(uTargetColor, 1.0);
    return;
  }
  if (d > outer) {
    outColor = vec4(0.0);
    return;
  }

  float t = uTime * uDrift;
  vec2 p = rel / uRef;
  vec2 dir = uSeedRot * (rel / max(d, 1e-3));
  float ns = uNoiseScale;

  vec2 q = p * (2.4 * ns) + uSeed;
  vec2 w = vec2(
    fbm3(q + vec2(0.0, 0.31 * t)),
    fbm3(q + vec2(5.2, 1.3) - vec2(0.27 * t, 0.0))
  );

  float blob = fbm5(q + 2.3 * w + vec2(0.12 * t, -0.08 * t));
  vec2 lq = dir * 0.9 + uSeed.yx * 0.37 + vec2(0.06 * t);
  float lobes = gnoise(lq) * 0.75 + gnoise(lq * 2.1 + 9.1) * 0.25;
  float reach = clamp(1.0 + A_LOBE * 1.6 * lobes + A_BLOB * 1.5 * blob, 1.0 - A_SUM, 1.0 + A_SUM);
  float f = d - R * reach;

  float gate = smoothstep(-0.35, 0.4, fbm3(dir * 1.6 + uSeed * 0.61 + 3.7));
  vec2 tq = dir * (2.2 * ns) + (d / uRef) * vec2(2.6, -1.9) * ns + 1.2 * w + uSeed * 1.7 + vec2(0.0, 0.18 * t);
  float n = fbm4(tq);
  float ridgePx = abs(n) * max(d, 24.0) / (4.0 * ns);
  float lenN = gnoise(dir * 3.1 + uSeed * 0.43 + vec2(0.1 * t)) * 0.5 + 0.5;
  float L = uTendril * TENDRIL_REACH * R * gate * (0.35 + 0.65 * lenN);
  float along = clamp(f / max(L, 1.0), 0.0, 1.0);
  float width = clamp(R * 0.022, 1.5, 9.0) * (1.0 - along * along) * gate;
  float ft = max(f - L, ridgePx - width);
  float k = 6.0;
  float hh = clamp(0.5 + 0.5 * (ft - f) / k, 0.0, 1.0);
  f = mix(ft, f, hh) - k * hh * (1.0 - hh);

  vec2 fq = css * 0.34 + uSeed * 13.0;
  float fibre = gnoise2(fq) * 0.65 + gnoise2(OCT * fq + 5.3) * 0.35;
  f += fibre * FIBRE_PX;

  f -= cleanup;

  float soft = max(uSoftness, 0.6);
  float inked = 1.0 - smoothstep(-soft, soft, f);

  float thinW = mix(3.0, THIN_MAX_PX, clamp(blob * 0.8 + 0.3, 0.0, 1.0));
  float density = mix(0.6, 1.0, smoothstep(0.0, thinW, -f));
  float cov = inked * density;

  float hazeW = mix(4.0, HAZE_PX, clamp(0.5 + 0.5 * blob, 0.0, 1.0));
  float haze = (1.0 - smoothstep(0.0, hazeW, f)) * smoothstep(-0.3, 0.6, 0.35 * fibre + w.x);
  cov = max(cov, haze * 0.24 * step(0.0, f));

  float ahead = clamp(f / SPECK_PX, 0.0, 1.0);
  if (f > 0.0 && ahead < 1.0) {
    float sn = gnoise2(css * 0.55 + uSeed * 7.0 + 41.0) * 0.5 + 0.5;
    float th = mix(0.80, 0.96, ahead);
    cov = max(cov, smoothstep(th, th + 0.04, sn) * 0.75 * (1.0 - ahead));
  }

  float rimX = (f + soft * 1.1) / (soft * 1.4 + 1.2);
  float rim = exp(-rimX * rimX) * inked;
  vec3 col = mix(uTargetColor, uRimColor, rim * 0.45);

  outColor = vec4(col, cov);
}
`;

const TARGET_COLORS: Record<Theme, [number, number, number]> = {
  dark: [0.055, 0.055, 0.07], // deep dark tone matching dark mode
  light: [0.99, 0.985, 0.98], // soft warm cream white matching light mode
};

const RIM_COLORS: Record<Theme, [number, number, number]> = {
  dark: [0.0, 0.0, 0.01],
  light: [1.0, 0.996, 0.985],
};

const SPREAD = {
  growth: 0.75,
  cleanupFrom: 0.45,
  cleanupReach: 0.4,
  cleanupPow: 2,
};

function farthestCorner(p: Point): number {
  if (typeof window === "undefined") return 1000;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return (
    Math.max(
      Math.hypot(p.x, p.y),
      Math.hypot(w - p.x, p.y),
      Math.hypot(p.x, h - p.y),
      Math.hypot(w - p.x, h - p.y)
    ) + 12
  );
}

class InkTransitionManager {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private noiseTex: WebGLTexture | null = null;
  private uniforms = new Map<string, WebGLUniformLocation>();
  private animId: number | null = null;
  private isAnimating = false;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.warn("[InkBleed] WebGL2 not supported, will use CSS transition fallback.");
      return;
    }

    this.gl = gl;
    try {
      this.setupShaders(gl);
      this.noiseTex = createNoiseTexture(gl);
      this.resize();
      window.addEventListener("resize", () => this.resize());
    } catch (e) {
      console.error("[InkBleed] Shader setup error:", e);
      this.gl = null;
    }
  }

  private setupShaders(gl: WebGL2RenderingContext): void {
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, FULLSCREEN_VERT);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, INK_FRAG);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fs) || "Shader compile error");
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
    }

    this.program = prog;
    this.vao = gl.createVertexArray()!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  private getUniform(name: string): WebGLUniformLocation | null {
    if (!this.gl || !this.program) return null;
    if (!this.uniforms.has(name)) {
      const loc = this.gl.getUniformLocation(this.program, name);
      if (loc) this.uniforms.set(name, loc);
    }
    return this.uniforms.get(name) ?? null;
  }

  resize(): void {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  toggle(point?: Point): void {
    const currentTheme = getCurrentTheme();
    const targetTheme: Theme = currentTheme === "dark" ? "light" : "dark";

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fallback if no WebGL2 or prefers reduced motion
    if (!this.gl || !this.canvas || reducedMotion) {
      this.cssFallback(targetTheme);
      return;
    }

    this.startInkSpread(targetTheme, point);
  }

  private cssFallback(targetTheme: Theme): void {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    root.style.setProperty("--theme-fade", "0.45s");
    applyTheme(targetTheme);
    window.setTimeout(() => {
      root.classList.remove("theme-fade");
    }, 480);
  }

  private startInkSpread(targetTheme: Theme, point?: Point): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    const canvas = this.canvas!;
    const gl = this.gl!;
    this.resize();

    const center = point ?? {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const maxDist = farthestCorner(center);
    const seed = {
      x: Math.random() * 64 - 32,
      y: Math.random() * 64 - 32,
      angle: Math.random() * Math.PI * 2,
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const duration = 1.15; // seconds
    let startTime: number | null = null;
    let domFlipped = false;

    canvas.style.opacity = "1";
    canvas.classList.add("is-active");
    this.isAnimating = true;

    const targetColor = TARGET_COLORS[targetTheme];
    const rimColor = RIM_COLORS[targetTheme];

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const linear = Math.min(1, elapsed / duration);

      // Ease-out cubic (same as power3.out in GSAP)
      const progress = 1 - Math.pow(1 - linear, 3);

      // Flip the live DOM underneath when the ink has swept across the center
      if (linear >= 0.55 && !domFlipped) {
        applyTheme(targetTheme);
        domFlipped = true;
      }

      // Cleanup term ensures all distant corners are guaranteed covered
      const ramp = Math.max(0, (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom));
      const cleanup =
        Math.pow(ramp, SPREAD.cleanupPow) * maxDist * SPREAD.cleanupReach +
        Math.max(0, (linear - 0.97) / 0.03) * maxDist;
      const radius = progress * maxDist * SPREAD.growth;

      // Render WebGL frame
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.program);
      gl.bindVertexArray(this.vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.noiseTex);
      gl.uniform1i(this.getUniform("uNoise"), 0);

      gl.uniform3f(this.getUniform("uTargetColor"), targetColor[0], targetColor[1], targetColor[2]);
      gl.uniform3f(this.getUniform("uRimColor"), rimColor[0], rimColor[1], rimColor[2]);
      gl.uniform1f(this.getUniform("uCanvasScale"), dpr);
      gl.uniform2f(this.getUniform("uRes"), canvas.width, canvas.height);
      gl.uniform2f(this.getUniform("uCenter"), center.x, center.y);
      gl.uniform1f(this.getUniform("uRadius"), radius);
      gl.uniform1f(this.getUniform("uCleanup"), cleanup);
      gl.uniform1f(this.getUniform("uTime"), elapsed);
      gl.uniform1f(this.getUniform("uRef"), Math.max(window.innerWidth, window.innerHeight));
      gl.uniform2f(this.getUniform("uSeed"), seed.x, seed.y);

      const cos = Math.cos(seed.angle);
      const sin = Math.sin(seed.angle);
      gl.uniformMatrix2fv(this.getUniform("uSeedRot"), false, [cos, sin, -sin, cos]);

      gl.uniform1f(this.getUniform("uTendril"), 1.0);
      gl.uniform1f(this.getUniform("uNoiseScale"), 1.0);
      gl.uniform1f(this.getUniform("uSoftness"), 1.4);
      gl.uniform1f(this.getUniform("uDrift"), 1.0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (linear < 1) {
        this.animId = requestAnimationFrame(tick);
      } else {
        if (!domFlipped) {
          applyTheme(targetTheme);
        }
        // Fade out overlay onto the already-flipped page
        canvas.style.opacity = "0";
        setTimeout(() => {
          canvas.classList.remove("is-active");
          this.isAnimating = false;
        }, 160);
      }
    };

    this.animId = requestAnimationFrame(tick);
  }
}

export const inkManager = new InkTransitionManager();

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
  try {
    localStorage.setItem("theme", theme);
  } catch {}
  window.dispatchEvent(new CustomEvent("picsnips:theme-change", { detail: { theme } }));
}
