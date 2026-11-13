export type SceneId = "coast" | "city" | "dunes";

export interface Scene {
  id: SceneId;
  title: string;
  caption: string;
  svg: string;
}

const coast = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1440"/>
      <stop offset="0.42" stop-color="#9f1239"/>
      <stop offset="0.68" stop-color="#fb923c"/>
      <stop offset="1" stop-color="#fed7aa"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7c2d3a"/>
      <stop offset="0.35" stop-color="#1e3a5f"/>
      <stop offset="1" stop-color="#071422"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="640" fill="url(#sky)"/>
  <circle cx="1180" cy="230" r="120" fill="#fff4d5" opacity="0.16"/>
  <circle cx="1180" cy="230" r="64" fill="#fff4d5"/>
  <rect y="340" width="1600" height="300" fill="url(#sea)"/>
  <path d="M0 380 C220 340 340 430 540 390 C760 340 860 450 1100 400 C1320 360 1440 430 1600 390 L1600 640 L0 640 Z" fill="#0b1c30" opacity="0.9"/>
  <path d="M0 470 C260 440 480 530 760 490 C1040 450 1240 540 1600 480 L1600 640 L0 640 Z" fill="#10243d"/>
  <rect x="1164" y="340" width="32" height="170" fill="#fff4d5" opacity="0.22"/>
</svg>`;

const city = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070b16"/>
      <stop offset="0.55" stop-color="#1e1b4b"/>
      <stop offset="1" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="640" fill="url(#night)"/>
  <circle cx="1240" cy="120" r="36" fill="#f8fafc" opacity="0.85"/>
  <g fill="#e2e8f0">
    <circle cx="180" cy="90" r="1.4"/><circle cx="260" cy="140" r="1.2"/><circle cx="420" cy="70" r="1.5"/>
    <circle cx="560" cy="120" r="1.1"/><circle cx="760" cy="80" r="1.4"/><circle cx="980" cy="150" r="1.2"/>
    <circle cx="1400" cy="90" r="1.3"/><circle cx="1100" cy="60" r="1.1"/>
  </g>
  <g fill="#0b1020">
    <rect x="40" y="280" width="90" height="360"/>
    <rect x="150" y="220" width="120" height="420"/>
    <rect x="290" y="320" width="80" height="320"/>
    <rect x="390" y="180" width="150" height="460"/>
    <rect x="560" y="260" width="100" height="380"/>
    <rect x="680" y="140" width="130" height="500"/>
    <rect x="830" y="300" width="90" height="340"/>
    <rect x="940" y="200" width="160" height="440"/>
    <rect x="1120" y="250" width="110" height="390"/>
    <rect x="1250" y="160" width="140" height="480"/>
    <rect x="1410" y="300" width="150" height="340"/>
  </g>
  <g fill="#fbbf24" opacity="0.85">
    <rect x="170" y="250" width="8" height="10"/><rect x="200" y="280" width="8" height="10"/>
    <rect x="420" y="220" width="8" height="10"/><rect x="460" y="260" width="8" height="10"/>
    <rect x="710" y="180" width="8" height="10"/><rect x="760" y="230" width="8" height="10"/>
    <rect x="980" y="240" width="8" height="10"/><rect x="1040" y="300" width="8" height="10"/>
    <rect x="1290" y="200" width="8" height="10"/><rect x="1340" y="260" width="8" height="10"/>
  </g>
  <rect y="560" width="1600" height="80" fill="#05070f"/>
</svg>`;

const dunes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7c2d12"/>
      <stop offset="0.45" stop-color="#ea580c"/>
      <stop offset="1" stop-color="#ffedd5"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="640" fill="url(#dusk)"/>
  <circle cx="980" cy="210" r="54" fill="#fff7ed"/>
  <path d="M0 360 C220 300 380 420 640 360 C900 300 1040 450 1320 380 C1460 340 1520 360 1600 340 L1600 640 L0 640 Z" fill="#c2410c"/>
  <path d="M0 460 C260 400 520 520 860 450 C1140 390 1320 500 1600 440 L1600 640 L0 640 Z" fill="#9a3412"/>
  <path d="M0 540 C300 500 640 590 980 530 C1240 490 1420 560 1600 520 L1600 640 L0 640 Z" fill="#7c2d12"/>
</svg>`;

export const scenes: Scene[] = [
  {
    id: "coast",
    title: "Coast at dusk",
    caption: "A wide horizon sliced into 20 vertical frames. Upload them in order and the shoreline stays continuous.",
    svg: coast,
  },
  {
    id: "city",
    title: "Night skyline",
    caption: "Vertical strips keep every building in sequence, from the first tower to the last.",
    svg: city,
  },
  {
    id: "dunes",
    title: "Dune line",
    caption: "The same idea works for any panorama. PicSnap only cuts — it does not redraw the picture.",
    svg: dunes,
  },
];

export function sceneSrc(scene: Scene): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene.svg)}`;
}
