// Generates the original illustrated technology art in assets/original/technologies.
// Deterministic and dependency-free: run `node scripts/generate-tech-art.mjs` after editing.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'original', 'technologies');

const PALETTES = {
  Science: { deep: '#150f3f', mid: '#4a35c9', bright: '#8f7bff', pale: '#ddd4ff' },
  Exploration: { deep: '#06303a', mid: '#0f8b9a', bright: '#35d6d8', pale: '#c9fff7' },
  Economy: { deep: '#3a2a06', mid: '#b5810f', bright: '#f2c23e', pale: '#fff0b8' },
  Industry: { deep: '#3d1707', mid: '#c2521a', bright: '#ff8f3f', pale: '#ffdcb8' },
  Military: { deep: '#3d0a14', mid: '#b3263a', bright: '#ff5a66', pale: '#ffd0d0' },
  Civics: { deep: '#0a3320', mid: '#1f9a5c', bright: '#4fe08f', pale: '#d4ffe3' }
};

const defs = p => `<defs>
<radialGradient id="bg" cx=".5" cy=".36" r=".82"><stop offset="0" stop-color="${p.mid}"/><stop offset=".52" stop-color="${p.deep}"/><stop offset="1" stop-color="#040913"/></radialGradient>
<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.pale}"/><stop offset=".5" stop-color="${p.bright}" stop-opacity=".55"/><stop offset="1" stop-color="${p.mid}" stop-opacity=".35"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6fafc"/><stop offset=".48" stop-color="#a9bbc9"/><stop offset="1" stop-color="#46586a"/></linearGradient>
<linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a7e90"/><stop offset="1" stop-color="#1b2632"/></linearGradient>
<linearGradient id="acc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.pale}"/><stop offset=".5" stop-color="${p.bright}"/><stop offset="1" stop-color="${p.mid}"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${p.pale}" stop-opacity=".95"/><stop offset=".4" stop-color="${p.bright}" stop-opacity=".55"/><stop offset="1" stop-color="${p.bright}" stop-opacity="0"/></radialGradient>
<radialGradient id="core"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${p.pale}"/><stop offset="1" stop-color="${p.bright}"/></radialGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="plate"><rect x="4" y="4" width="120" height="120" rx="20"/></clipPath>
</defs>`;

// Small seeded generator, so each icon has its own stable star field.
function stars(id, p) {
  let seed = [...id].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  const next = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let out = '';
  for (let i = 0; i < 16; i++) {
    const big = next() > .8;
    out += `<circle cx="${(8 + next() * 112).toFixed(1)}" cy="${(8 + next() * 112).toFixed(1)}" r="${big ? 1.1 : .6}" fill="${big ? p.pale : '#fff'}" opacity="${(.25 + next() * .5).toFixed(2)}"/>`;
  }
  return out;
}

const glow = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#glow)"/>`;
const windows = (points, size = 3.4) => points.map(([x, y]) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx=".7" fill="url(#core)"/>`).join('');

const TECHS = {
  'orbital-industry': ['Industry', `${glow(64, 70, 46)}
<path d="M18 74a46 15 0 0 1 92 0" fill="none" stroke="url(#acc)" stroke-width="5" opacity=".65"/>
<rect x="74" y="27" width="10" height="26" rx="2" fill="url(#hull)"/><rect x="88" y="34" width="8" height="19" rx="2" fill="url(#hull)"/>
<rect x="74" y="27" width="10" height="4" fill="url(#acc)"/><rect x="88" y="34" width="8" height="4" fill="url(#acc)"/>
<path d="M32 88V58l15 9V58l15 9V58l14 9V52h22v36Z" fill="url(#metal)"/><path d="M32 88h66v5H32Z" fill="url(#hull)"/>
${windows([[38, 74], [46, 74], [54, 74], [62, 74], [70, 74], [78, 74], [86, 74]])}
<path d="M18 74a46 15 0 0 0 92 0" fill="none" stroke="url(#acc)" stroke-width="5"/>
<circle cx="18" cy="74" r="4.5" fill="url(#core)"/><circle cx="110" cy="74" r="4.5" fill="url(#core)"/>`],

  'stellar-survey': ['Exploration', `${glow(64, 66, 48)}
<circle cx="64" cy="66" r="44" fill="#05202a" stroke="url(#acc)" stroke-width="3"/>
<circle cx="64" cy="66" r="30" fill="none" stroke="url(#edge)" stroke-width="1.6"/><circle cx="64" cy="66" r="15" fill="none" stroke="url(#edge)" stroke-width="1.6"/>
<path d="M64 22v88M20 66h88" stroke="url(#edge)" stroke-width="1" opacity=".55"/>
<path d="M64 66 94 34A44 44 0 0 1 108 66Z" fill="url(#acc)" opacity=".62"/>
<path d="M64 66 94 34" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="64" cy="66" r="5" fill="url(#core)"/>
<path d="M88 50l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff"/><circle cx="42" cy="48" r="3" fill="url(#core)"/><circle cx="46" cy="88" r="2.4" fill="url(#core)"/>`],

  'fusion-grid': ['Economy', `${glow(64, 66, 50)}
<ellipse cx="64" cy="66" rx="44" ry="20" fill="none" stroke="url(#hull)" stroke-width="12"/>
<ellipse cx="64" cy="66" rx="44" ry="20" fill="none" stroke="url(#metal)" stroke-width="5"/>
<circle cx="64" cy="66" r="21" fill="url(#core)"/>
<path d="M68 42 52 69h11l-5 21 18-30H64Z" fill="#3a2a06" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M20 66a44 20 0 0 0 88 0" fill="none" stroke="url(#metal)" stroke-width="6"/>
<circle cx="32" cy="79" r="3.4" fill="url(#core)"/><circle cx="96" cy="79" r="3.4" fill="url(#core)"/><circle cx="64" cy="86" r="3.4" fill="url(#core)"/>`],

  'fleet-logistics': ['Military', `${glow(64, 58, 46)}
<path d="M64 20 78 58l-14-7-14 7Z" fill="url(#metal)"/><path d="M64 20 64 51l-14 7Z" fill="url(#hull)" opacity=".55"/><path d="M60 54h8l-4 14Z" fill="url(#core)"/>
<path d="M32 50 44 82l-12-6-12 6Z" fill="url(#metal)"/><path d="M32 50v26l-12 6Z" fill="url(#hull)" opacity=".55"/><path d="M29 79h6l-3 12Z" fill="url(#core)"/>
<path d="M96 50l12 32-12-6-12 6Z" fill="url(#metal)"/><path d="M96 50v26l-12 6Z" fill="url(#hull)" opacity=".55"/><path d="M93 79h6l-3 12Z" fill="url(#core)"/>
<path d="M44 100 64 88l20 12" fill="none" stroke="url(#acc)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M50 112 64 103l14 9" fill="none" stroke="url(#acc)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`],

  'quantum-labs': ['Science', `${glow(64, 64, 50)}
<ellipse cx="64" cy="64" rx="48" ry="17" fill="none" stroke="url(#acc)" stroke-width="3" transform="rotate(30 64 64)"/>
<ellipse cx="64" cy="64" rx="48" ry="17" fill="none" stroke="url(#acc)" stroke-width="3" transform="rotate(-30 64 64)"/>
<ellipse cx="64" cy="64" rx="48" ry="17" fill="none" stroke="url(#acc)" stroke-width="3" transform="rotate(90 64 64)"/>
<path d="M64 44 82 54v20L64 84 46 74V54Z" fill="url(#hull)" stroke="url(#metal)" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M64 44 82 54 64 64 46 54Z" fill="url(#metal)"/><path d="M64 64v20" stroke="url(#metal)" stroke-width="2"/>
<circle cx="64" cy="64" r="7.5" fill="url(#core)"/>
<circle cx="105" cy="88" r="5" fill="url(#core)"/><circle cx="23" cy="88" r="5" fill="url(#core)"/><circle cx="64" cy="16" r="5" fill="url(#core)"/>`],

  'colonial-charters': ['Exploration', `${glow(64, 60, 46)}
<circle cx="84" cy="36" r="17" fill="url(#acc)"/><path d="M71 28c8 4 18 2 28 5M68 40c10 4 20 2 32 3" stroke="#06303a" stroke-width="2.4" fill="none" opacity=".55"/>
<path d="M84 19V6" stroke="url(#metal)" stroke-width="2.6"/><path d="M84 6h14l-4 5 4 5H84Z" fill="#fff"/>
<path d="M30 42h54c-6 8-6 44 0 58H36c-6-14-6-46-6-58Z" fill="url(#metal)"/>
<path d="M30 42c-7 0-10 5-10 9h13c-1-3-1-9-3-9Z" fill="url(#hull)"/><path d="M84 100c7 0 10-5 10-9H80c0 3 2 9 4 9Z" fill="url(#hull)"/>
<path d="M40 56h32M40 66h32M42 76h20" stroke="#35505f" stroke-width="3" stroke-linecap="round"/>
<circle cx="66" cy="88" r="8" fill="url(#acc)" stroke="#fff" stroke-width="1.5"/><path d="M62 88l3 3 5-6" fill="none" stroke="#06303a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`],

  'synthetic-smelting': ['Industry', `${glow(58, 74, 48)}
<path d="M30 22h46l-5 32H35Z" fill="url(#metal)"/><path d="M30 22h46l-1.6 8H31.6Z" fill="url(#hull)"/>
<path d="M36 22c4-5 30-5 34 0" fill="url(#core)"/>
<path d="M70 44 92 34l4 8-20 13Z" fill="url(#hull)"/>
<path d="M90 42c6 12 2 26-2 40" fill="none" stroke="url(#core)" stroke-width="8" stroke-linecap="round"/>
<path d="M26 104l8-20h28l8 20Z" fill="url(#metal)"/><path d="M26 104h44v5H26Z" fill="url(#hull)"/>
<path d="M72 104l7-18h22l7 18Z" fill="url(#acc)"/><path d="M72 104h36v5H72Z" fill="url(#hull)"/>`],

  'planetary-banking': ['Economy', `${glow(64, 58, 46)}
<circle cx="64" cy="52" r="29" fill="url(#hull)"/><path d="M38 41c14 6 34 3 50-1M36 57c17 6 37 4 55-1" stroke="url(#acc)" stroke-width="3" fill="none" opacity=".75"/>
<path d="M14 58c0-7 22-13 50-13s50 6 50 13-22 13-50 13S14 65 14 58Z" fill="none" stroke="url(#acc)" stroke-width="5"/>
<path d="M35 52a29 29 0 0 0 58 0" fill="url(#hull)" opacity=".55"/>
<g><ellipse cx="42" cy="104" rx="20" ry="7" fill="url(#hull)"/><path d="M22 96v8c0 4 40 4 40 0v-8Z" fill="url(#acc)"/><ellipse cx="42" cy="96" rx="20" ry="7" fill="url(#core)"/></g>
<g><path d="M66 86v16c0 5 40 5 40 0V86Z" fill="url(#acc)"/><ellipse cx="86" cy="86" rx="20" ry="7" fill="url(#core)"/><path d="M66 94c0 5 40 5 40 0" fill="none" stroke="#7a560a" stroke-width="1.6"/></g>
<text x="86" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#7a560a">C</text>`],

  'shield-matrix': ['Military', `${glow(64, 62, 52)}
<path d="M64 14 106 28v34c0 25-18 42-42 52-24-10-42-27-42-52V28Z" fill="url(#hull)" stroke="url(#metal)" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M64 24 98 35v27c0 19-14 34-34 43Z" fill="url(#acc)" opacity=".5"/>
<g fill="none" stroke="url(#core)" stroke-width="2.4" stroke-linejoin="round">
<path d="M64 36l11 6v13l-11 6-11-6V42Z"/><path d="M64 61l11 6v13l-11 6-11-6V67Z"/><path d="M42 49l11 6v12l-11 6-9-5V54Z" opacity=".7"/><path d="M86 49l-11 6v12l11 6 9-5V54Z" opacity=".7"/></g>
<circle cx="64" cy="61" r="7" fill="url(#core)"/>`],

  'capital-ships': ['Military', `${glow(70, 62, 50)}
<path d="M10 66 44 50h44l30 12v8L88 84H44Z" fill="url(#hull)" stroke="url(#metal)" stroke-width="2" stroke-linejoin="round"/>
<path d="M10 66 44 50h44l30 12H62Z" fill="url(#metal)"/>
<path d="M50 50 58 36h26l6 14Z" fill="url(#metal)"/><rect x="62" y="40" width="18" height="4" rx="1" fill="url(#core)"/>
<path d="M38 84l-6 12h34l6-12Z" fill="url(#hull)"/>
${windows([[50, 69], [58, 69], [66, 69], [74, 69], [82, 69], [90, 69]], 3.6)}
<path d="M118 62h-9v8h9Z" fill="url(#core)"/><circle cx="121" cy="66" r="6" fill="url(#glow)"/>
<path d="M28 58l-6 3M36 54l-6 3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`],

  'terraforming': ['Exploration', `${glow(64, 64, 52)}
<circle cx="64" cy="64" r="42" fill="#7a5235"/>
<path d="M64 22a42 42 0 0 1 0 84Z" fill="url(#acc)"/>
<path d="M36 40c8-3 16 2 20 8s-4 10-12 9-14-13-8-17ZM30 72c6-3 14 0 16 6s-8 10-12 6-8-10-4-12Z" fill="#573723"/>
<path d="M80 34c10 2 17 12 16 20s-12 5-17-3-5-17 1-17ZM78 74c8-4 18-1 16 6s-13 14-18 8 0-12 2-14Z" fill="#0d6b4d"/>
<path d="M64 18v92" stroke="#fff" stroke-width="2.6" stroke-dasharray="5 5"/>
<path d="M28 42a42 42 0 0 1 36-20" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>
<circle cx="64" cy="64" r="7" fill="url(#core)"/>`],

  'stellar-nexus': ['Science', `${glow(64, 64, 54)}
<g stroke="url(#acc)" stroke-width="3"><path d="M64 64 28 34M64 64 100 34M64 64 22 84M64 64l42 20M64 64v44"/><path d="M28 34h72L106 84 64 108 22 84Z" fill="none" opacity=".45" stroke-width="2"/></g>
<circle cx="28" cy="34" r="8" fill="url(#hull)" stroke="url(#core)" stroke-width="3"/><circle cx="100" cy="34" r="8" fill="url(#hull)" stroke="url(#core)" stroke-width="3"/>
<circle cx="22" cy="84" r="8" fill="url(#hull)" stroke="url(#core)" stroke-width="3"/><circle cx="106" cy="84" r="8" fill="url(#hull)" stroke="url(#core)" stroke-width="3"/><circle cx="64" cy="108" r="8" fill="url(#hull)" stroke="url(#core)" stroke-width="3"/>
<path d="M64 38l7 19 19 7-19 7-7 19-7-19-19-7 19-7Z" fill="url(#core)"/>`],

  'culture-networks': ['Civics', `${glow(64, 58, 50)}
<path d="M48 44a18 18 0 1 1 8 15l-10 7 2-13a18 18 0 0 1 0-9Z" fill="url(#acc)"/>
<path d="M54 42h24M54 50h16" stroke="#0a3320" stroke-width="3" stroke-linecap="round"/>
<g stroke="url(#metal)" stroke-width="2.6"><path d="M32 84 64 96 96 84"/></g>
<circle cx="32" cy="76" r="8" fill="url(#metal)"/><path d="M18 106c0-13 28-13 28 0Z" fill="url(#metal)"/>
<circle cx="96" cy="76" r="8" fill="url(#metal)"/><path d="M82 106c0-13 28-13 28 0Z" fill="url(#metal)"/>
<circle cx="64" cy="84" r="9" fill="url(#core)"/><path d="M48 116c0-16 32-16 32 0Z" fill="url(#acc)"/>`],

  'frontier-habitats': ['Exploration', `${glow(64, 58, 48)}
<circle cx="98" cy="30" r="11" fill="url(#acc)" opacity=".85"/>
<path d="M0 100c30-14 98-14 128 0v28H0Z" fill="#7a5235"/><path d="M0 100c30-14 98-14 128 0v5C98 92 30 92 0 105Z" fill="#a8764a"/>
<path d="M22 94a42 42 0 0 1 84 0Z" fill="url(#acc)" opacity=".32" stroke="url(#core)" stroke-width="3"/>
<path d="M36 94V72l12-8 12 8v22ZM64 94V60h20v34ZM88 94V78h10v16Z" fill="url(#metal)"/>
<path d="M36 94h62v3H36Z" fill="url(#hull)"/>
${windows([[44, 76], [52, 76], [44, 84], [52, 84], [70, 66], [77, 66], [70, 75], [77, 75], [70, 84], [77, 84]])}
<path d="M64 52a42 42 0 0 0-30 13" fill="none" stroke="#fff" stroke-width="2.6" opacity=".5" stroke-linecap="round"/>`],

  'exotic-materials': ['Industry', `${glow(64, 64, 52)}
<path d="M64 12 86 46 72 104H54L42 46Z" fill="url(#acc)"/><path d="M64 12V104H54L42 46Z" fill="#fff" opacity=".22"/><path d="M64 12 86 46H42Z" fill="#fff" opacity=".35"/>
<path d="M32 50 46 72 40 108H24L18 72Z" fill="url(#acc)" opacity=".85"/><path d="M32 50V108H24L18 72Z" fill="#fff" opacity=".2"/>
<path d="M96 42 112 68 104 108H88L80 68Z" fill="url(#acc)" opacity=".92"/><path d="M96 42V108H88L80 68Z" fill="#fff" opacity=".2"/>
<path d="M12 112c30-10 74-10 104 0v6H12Z" fill="url(#hull)"/>
<path d="M78 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM28 34l1.500 4 4 1.500-4 1.500-1.500 4-1.500-4-4-1.500 4-1.500Z" fill="#fff"/>`],

  'civic-administration': ['Civics', `${glow(64, 52, 48)}
<path d="M64 12v12" stroke="url(#metal)" stroke-width="3"/><circle cx="64" cy="11" r="4" fill="url(#core)"/>
<path d="M36 54a28 30 0 0 1 56 0Z" fill="url(#acc)"/><path d="M64 24a28 30 0 0 0-28 30h16c0-14 5-26 12-30Z" fill="#fff" opacity=".28"/>
<path d="M30 54h68v7H30Z" fill="url(#metal)"/>
<path d="M36 61h8v33h-8ZM50 61h8v33h-8ZM70 61h8v33h-8ZM84 61h8v33h-8Z" fill="url(#metal)"/>
<path d="M60 94V70a4 4 0 0 1 8 0v24Z" fill="url(#core)"/>
<path d="M28 94h72v6H28ZM20 100h88v8H20Z" fill="url(#metal)"/><path d="M20 106h88v2H20Z" fill="url(#hull)"/>`]
};

function art(id, [category, body]) {
  const p = PALETTES[category];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${id}">
<!-- Original Orbital Empires art, generated by scripts/generate-tech-art.mjs. -->
${defs(p)}
<rect x="4" y="4" width="120" height="120" rx="20" fill="url(#bg)"/>
<g clip-path="url(#plate)">${stars(id, p)}
${body}
<rect x="4" y="4" width="120" height="48" fill="url(#sheen)"/></g>
<rect x="5" y="5" width="118" height="118" rx="19" fill="none" stroke="url(#edge)" stroke-width="2"/>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const [id, spec] of Object.entries(TECHS)) writeFileSync(join(OUT, id + '.svg'), art(id, spec));
console.log('Wrote', Object.keys(TECHS).length, 'technology images to', OUT);
