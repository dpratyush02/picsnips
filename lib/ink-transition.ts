/**
 * Ink Bleed Theme Changer
 * Adapted from https://github.com/codemure-official/ink-bleed-theme-changer
 *
 * Implements a WebGL2 procedural ink-spread transition between light and dark themes
 * with organic domain-warped FBM noise, branching tendril filaments, paper fibres,
 * diffusion haze, speckles, and pigment pooling.
 *
 * The transition samples two full-page snapshots (uFrom and uTo) so the actual page content
 * (text, buttons, cards, images) is revealed in real-time inside the expanding ink wavefront.
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

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uFromSize;     // texture px
uniform vec2 uToSize;       // texture px
uniform vec4 uFromMap;      // (texture px per device px, offset x, offset y, flipY)
uniform vec4 uToMap;
uniform float uCanvasScale; // device px per CSS px
uniform vec2 uRes;          // canvas device px

uniform vec2 uCenter;       // CSS px, viewport-relative
uniform float uRadius;      // CSS px, eased base radius
uniform float uCleanup;     // CSS px, extra uniform reach that guarantees full coverage at the end
uniform float uTime;        // seconds since click
uniform float uRef;         // CSS px, noise reference length (max viewport side)
uniform vec2 uSeed;
uniform mat2 uSeedRot;

uniform float uTendril;     // tendril intensity, 0..2
uniform float uNoiseScale;  // noise frequency multiplier
uniform float uSoftness;    // frontier half-width, CSS px
uniform float uDrift;       // time evolution speed
uniform vec3 uRimColor;     // pigment colour pooled at the frontier

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

vec3 sampleDoc(sampler2D tex, vec2 size, vec4 map, vec2 devPx) {
  vec2 texPx = devPx * map.x + map.yz;
  if (map.w > 0.5) texPx.y = size.y - texPx.y;
  vec2 uv = clamp(texPx, vec2(0.5), size - 0.5) / size;
  return texture(tex, uv).rgb;
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
    outColor = vec4(sampleDoc(uTo, uToSize, uToMap, devPx), 1.0);
    return;
  }
  if (d > outer) {
    outColor = vec4(sampleDoc(uFrom, uFromSize, uFromMap, devPx), 1.0);
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

  vec3 from = sampleDoc(uFrom, uFromSize, uFromMap, devPx);
  vec3 to = sampleDoc(uTo, uToSize, uToMap, devPx);
  vec3 col = mix(from, to, cov);

  float rimX = (f + soft * 1.1) / (soft * 1.4 + 1.2);
  float rim = exp(-rimX * rimX) * inked;
  col = mix(col, uRimColor, rim * 0.45);

  outColor = vec4(col, 1.0);
}
`;

export const RIM_COLOR: Record<Theme, [number, number, number]> = {
  dark: [0.0, 0.0, 0.01],
  light: [1.0, 0.996, 0.985],
};

const BACKGROUND: Record<Theme, string> = {
  light: "#fbfaf7",
  dark: "#0d0d12",
};

export const SPREAD = {
  growth: 0.72,
  cleanupFrom: 0.45,
  cleanupReach: 0.4,
  cleanupPow: 2,
};

export interface Snapshot {
  theme: Theme;
  canvas: HTMLCanvasElement;
  scale: number;
  key: string;
  ms: number;
}

interface ThemeTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
  scale: number;
  key: string;
}

interface CompositeTexture {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export type InkSource = Theme | "composite";

export interface InkFrame {
  from: InkSource;
  to: Theme;
  center: Point;
  progress: number;
  radius: number;
  cleanup: number;
  maxDist: number;
  time: number;
  seed: { x: number; y: number; angle: number };
}

interface Sampler {
  texture: WebGLTexture;
  width: number;
  height: number;
  ratio: number;
  offsetX: number;
  offsetY: number;
  flipY: boolean;
}

function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function renderScale(): number {
  if (typeof window === "undefined") return 1;
  const cap = isCoarsePointer() ? 1.5 : 2;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function documentSize(): { width: number; height: number } {
  if (typeof document === "undefined") return { width: 1200, height: 800 };
  const el = document.documentElement;
  return { width: el.clientWidth, height: Math.max(el.scrollHeight, el.clientHeight) };
}

export function layoutKey(scale: number): string {
  const { width, height } = documentSize();
  return `${width}x${height}@${scale}`;
}

export async function capturePage(
  theme: Theme,
  scale: number,
  maxTextureSize: number
): Promise<Snapshot> {
  const t0 = performance.now();
  const key = layoutKey(scale);
  const { width, height } = documentSize();
  const safeScale = Math.min(scale, maxTextureSize / width, maxTextureSize / height);

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(document.body, {
    scale: safeScale,
    backgroundColor: BACKGROUND[theme],
    x: 0,
    y: 0,
    width,
    height,
    scrollX: 0,
    scrollY: 0,
    windowWidth: width,
    windowHeight: document.documentElement.clientHeight,
    logging: false,
    useCORS: true,
    onclone: (doc) => {
      doc.documentElement.dataset.theme = theme;
      if (theme === "dark") {
        doc.documentElement.classList.add("dark");
      } else {
        doc.documentElement.classList.remove("dark");
      }
      doc.querySelectorAll<HTMLElement>("[data-ink-live]").forEach((el) => {
        el.style.visibility = "hidden";
      });
      const inkCanvas = doc.querySelector(".ink-canvas");
      if (inkCanvas) (inkCanvas as HTMLElement).style.display = "none";
    },
  });

  return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
}

export class InkRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly maxTextureSize: number;

  private gl: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private noise!: WebGLTexture;
  private textures = new Map<Theme, ThemeTexture>();
  private composites: CompositeTexture[] = [];
  private activeComposite = -1;
  private canvasScale = 1;
  private uniforms = new Map<string, WebGLUniformLocation>();
  private lost = false;

  static create(canvas: HTMLCanvasElement): InkRenderer | null {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;
    try {
      return new InkRenderer(canvas, gl);
    } catch (err) {
      console.error("[InkBleed] WebGL2 init error:", err);
      return null;
    }
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    this.init();
  }

  private init(): void {
    const gl = this.gl;
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
    this.uniforms.clear();
    this.vao = gl.createVertexArray()!;
    this.noise = createNoiseTexture(gl);
    this.composites = [];
    this.activeComposite = -1;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  }

  private uniform(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) {
      const loc = this.gl.getUniformLocation(this.program, name);
      if (loc) this.uniforms.set(name, loc);
    }
    return this.uniforms.get(name) ?? null;
  }

  watchContext(onLost: () => void, onRestored: () => void): void {
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
      this.textures.clear();
      this.composites = [];
      this.activeComposite = -1;
      onLost();
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.lost = false;
      this.init();
      onRestored();
    });
  }

  get isLost(): boolean {
    return this.lost;
  }

  resize(scale: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * scale));
    const h = Math.max(1, Math.round(rect.height * scale));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.canvasScale = rect.width > 0 ? w / rect.width : scale;
  }

  upload(snapshot: Snapshot): void {
    if (this.lost) return;
    const gl = this.gl;
    let entry = this.textures.get(snapshot.theme);
    if (!entry) {
      entry = { texture: this.createTexture(), width: 0, height: 0, scale: 0, key: "" };
      this.textures.set(snapshot.theme, entry);
    }
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, snapshot.canvas);
    entry.width = snapshot.canvas.width;
    entry.height = snapshot.canvas.height;
    entry.scale = snapshot.scale;
    entry.key = snapshot.key;
  }

  hasValid(theme: Theme, key: string): boolean {
    return !this.lost && this.textures.get(theme)?.key === key;
  }

  freeze(frame: InkFrame): boolean {
    if (this.lost) return false;
    const gl = this.gl;
    const index = this.activeComposite === 0 ? 1 : 0;
    const target = this.ensureComposite(index);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    const ok = this.render(frame);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) return false;
    target.scrollX = window.scrollX;
    target.scrollY = window.scrollY;
    this.activeComposite = index;
    return true;
  }

  draw(frame: InkFrame): void {
    if (this.lost) return;
    this.render(frame);
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private ensureComposite(index: number): CompositeTexture {
    const gl = this.gl;
    const { width, height } = this.canvas;
    let c = this.composites[index];
    if (!c) {
      const framebuffer = gl.createFramebuffer();
      if (!framebuffer) throw new Error("createFramebuffer failed");
      c = { texture: this.createTexture(), framebuffer, width: 0, height: 0, scrollX: 0, scrollY: 0 };
      this.composites[index] = c;
    }
    if (c.width !== width || c.height !== height) {
      gl.bindTexture(gl.TEXTURE_2D, c.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, c.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, c.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      c.width = width;
      c.height = height;
    }
    return c;
  }

  private sampler(source: InkSource): Sampler | null {
    if (source === "composite") {
      const c = this.composites[this.activeComposite];
      if (!c) return null;
      return {
        texture: c.texture,
        width: c.width,
        height: c.height,
        ratio: 1,
        offsetX: Math.round((window.scrollX - c.scrollX) * this.canvasScale),
        offsetY: Math.round((window.scrollY - c.scrollY) * this.canvasScale),
        flipY: true,
      };
    }
    const t = this.textures.get(source);
    if (!t) return null;
    return {
      texture: t.texture,
      width: t.width,
      height: t.height,
      ratio: t.scale / this.canvasScale,
      offsetX: Math.floor(window.scrollX * t.scale + 0.5),
      offsetY: Math.floor(window.scrollY * t.scale + 0.5),
      flipY: false,
    };
  }

  private render(frame: InkFrame): boolean {
    const from = this.sampler(frame.from);
    const to = this.sampler(frame.to);
    if (!from || !to) return false;

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, to.texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noise);

    gl.uniform1i(this.uniform("uFrom"), 0);
    gl.uniform1i(this.uniform("uTo"), 1);
    gl.uniform1i(this.uniform("uNoise"), 2);
    gl.uniform2f(this.uniform("uFromSize"), from.width, from.height);
    gl.uniform2f(this.uniform("uToSize"), to.width, to.height);
    gl.uniform4f(this.uniform("uFromMap"), from.ratio, from.offsetX, from.offsetY, from.flipY ? 1 : 0);
    gl.uniform4f(this.uniform("uToMap"), to.ratio, to.offsetX, to.offsetY, to.flipY ? 1 : 0);
    gl.uniform1f(this.uniform("uCanvasScale"), this.canvasScale);
    gl.uniform2f(this.uniform("uRes"), this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniform("uCenter"), frame.center.x, frame.center.y);
    gl.uniform1f(this.uniform("uRadius"), frame.radius);
    gl.uniform1f(this.uniform("uCleanup"), frame.cleanup);
    gl.uniform1f(this.uniform("uTime"), frame.time);
    gl.uniform1f(this.uniform("uRef"), Math.max(this.canvas.width, this.canvas.height) / this.canvasScale);
    gl.uniform2f(this.uniform("uSeed"), frame.seed.x, frame.seed.y);

    const cos = Math.cos(frame.seed.angle);
    const sin = Math.sin(frame.seed.angle);
    gl.uniformMatrix2fv(this.uniform("uSeedRot"), false, [cos, sin, -sin, cos]);

    gl.uniform1f(this.uniform("uTendril"), 1.0);
    gl.uniform1f(this.uniform("uNoiseScale"), 1.0);
    gl.uniform1f(this.uniform("uSoftness"), 1.4);
    gl.uniform1f(this.uniform("uDrift"), 1.0);
    gl.uniform3fv(this.uniform("uRimColor"), RIM_COLOR[frame.to]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }
}

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

function randomSeed(): InkFrame["seed"] {
  return {
    x: Math.random() * 64 - 32,
    y: Math.random() * 64 - 32,
    angle: Math.random() * Math.PI * 2,
  };
}

class InkTransitionManager {
  private renderer: InkRenderer | null = null;
  private animId: number | null = null;
  private frame: Omit<InkFrame, "progress" | "radius" | "time" | "cleanup"> | null = null;
  private captureGen = 0;
  private capturing = false;
  private captureQueued = false;
  private resizeTimer = 0;
  private duration = 1.25; // seconds
  private lastClick: { point: Point; seed: InkFrame["seed"]; from: Theme } | null = null;

  init(canvas: HTMLCanvasElement): void {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      document.documentElement.dataset.ink = "css";
      return;
    }

    const renderer = InkRenderer.create(canvas);
    if (!renderer) {
      document.documentElement.dataset.ink = "css";
      return;
    }

    this.renderer = renderer;
    document.documentElement.dataset.ink = "webgl";
    renderer.resize(renderScale());

    renderer.watchContext(
      () => this.cancel(),
      () => this.scheduleCapture(0)
    );

    window.addEventListener("resize", () => {
      this.renderer?.resize(renderScale());
      if (this.frame) this.draw(0, 0);
      this.scheduleCapture(250);
    });

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => this.scheduleCapture(250)).observe(document.body);
    }

    // Capture initial snapshots when fonts and DOM are settled
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => this.scheduleCapture(80));
    } else {
      this.scheduleCapture(120);
    }
  }

  get isAnimating(): boolean {
    return this.frame !== null;
  }

  toggle(point?: Point): void {
    const currentTheme = getCurrentTheme();
    const to: Theme = currentTheme === "dark" ? "light" : "dark";
    const renderer = this.renderer;
    const scale = renderScale();
    const key = layoutKey(scale);
    const interrupting = this.frame !== null;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canAnimate =
      renderer !== null &&
      !renderer.isLost &&
      !reducedMotion &&
      renderer.hasValid(to, key) &&
      (interrupting || renderer.hasValid(currentTheme, key));

    if (!canAnimate || !renderer) {
      this.cancel();
      this.cssFallback(to);
      if (renderer && !reducedMotion) this.scheduleCapture(0);
      return;
    }

    let from: InkSource = currentTheme;
    if (interrupting) {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      renderer.resize(scale);
      const frozen = this.currentFrame(0.5, 0.5);
      from = frozen && renderer.freeze(frozen) ? "composite" : currentTheme;
    }

    const center = point ?? {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const maxDist = farthestCorner(center);
    const seed = randomSeed();

    this.lastClick = { point: center, seed, from: currentTheme };
    this.frame = { from, to, center, maxDist, seed };

    renderer.resize(scale);
    renderer.canvas.style.opacity = "1";
    renderer.canvas.classList.add("is-active");

    // Immediately render frame 0 so the overlay matches current screen pixel-perfectly
    this.draw(0, 0);

    // Flip the live DOM underneath in the very same task
    applyTheme(to);

    let startTime: number | null = null;
    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const linear = Math.min(1, elapsed / this.duration);
      // power3.out ease
      const progress = 1 - Math.pow(1 - linear, 3);

      this.draw(progress, elapsed);

      if (linear < 1) {
        this.animId = requestAnimationFrame(tick);
      } else {
        this.finish();
      }
    };

    this.animId = requestAnimationFrame(tick);
  }

  private currentFrame(progress: number, time: number): InkFrame | null {
    if (!this.frame) return null;
    const { maxDist } = this.frame;
    const linear = Math.min(1, time / this.duration);
    const ramp = Math.max(0, (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom));
    const cleanup =
      Math.pow(ramp, SPREAD.cleanupPow) * maxDist * SPREAD.cleanupReach +
      Math.max(0, (linear - 0.97) / 0.03) * maxDist;
    const radius = progress * maxDist * SPREAD.growth;
    return { ...this.frame, progress, time, radius, cleanup };
  }

  private draw(progress: number, time: number): void {
    const frame = this.currentFrame(progress, time);
    if (this.renderer && frame) this.renderer.draw(frame);
  }

  private finish(): void {
    const canvas = this.renderer?.canvas;
    if (!canvas) return;
    canvas.style.opacity = "0";
    window.setTimeout(() => this.hide(), 160);
  }

  private hide(): void {
    this.frame = null;
    this.renderer?.canvas.classList.remove("is-active");
    if (this.captureQueued) this.scheduleCapture(0);
  }

  private cancel(): void {
    if (!this.frame) return;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.hide();
  }

  private cssFallback(targetTheme: Theme): void {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    root.style.setProperty("--theme-fade", "0.45s");
    applyTheme(targetTheme);
    window.setTimeout(() => {
      root.classList.remove("theme-fade");
      if (this.captureQueued) this.scheduleCapture(0);
    }, 480);
  }

  scheduleCapture(delay: number): void {
    if (typeof window === "undefined") return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => void this.captureAll(), delay);
  }

  private async captureAll(): Promise<void> {
    const renderer = this.renderer;
    if (!renderer || renderer.isLost) return;

    if (
      this.capturing ||
      this.frame ||
      document.documentElement.classList.contains("theme-fade")
    ) {
      this.captureQueued = true;
      return;
    }

    const scale = renderScale();
    const key = layoutKey(scale);
    const current = getCurrentTheme();
    const other: Theme = current === "dark" ? "light" : "dark";
    const themes: Theme[] = [current, other].filter((t) => !renderer.hasValid(t, key));
    this.captureQueued = false;
    if (themes.length === 0) return;

    const gen = ++this.captureGen;
    this.capturing = true;
    try {
      for (const theme of themes) {
        const snap = await capturePage(theme, scale, renderer.maxTextureSize);
        if (gen !== this.captureGen) return;
        if (snap.key !== layoutKey(renderScale())) {
          this.captureQueued = true;
          break;
        }
        renderer.upload(snap);
      }
    } catch (err) {
      console.warn("[InkBleed] Background capture note:", err);
    } finally {
      this.capturing = false;
    }

    if (this.captureQueued) this.scheduleCapture(250);
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
