import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Sea Lion Mascot Emblem SVG (512x512)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="logoSeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="60%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0369A1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background rounded squircle with gradient frame -->
  <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="14" y="14" width="484" height="484" rx="98" fill="#0f172a" />
  <circle cx="256" cy="256" r="230" fill="url(#glow)" />

  <!-- Sea Lion Mascot scaled to 512x512 -->
  <g transform="translate(46, 46) scale(4.2)">
    <!-- Sea Lion Head & Body -->
    <path
      d="M 50 16 C 72 16 84 32 84 56 C 84 76 74 92 50 92 C 26 92 16 76 16 56 C 16 32 28 16 50 16 Z"
      fill="url(#logoSeal)"
    />

    <!-- Side Ear Flaps -->
    <path d="M 18 45 C 13 45 12 52 17 55 Z" fill="#0369A1" />
    <path d="M 82 45 C 87 45 88 52 83 55 Z" fill="#0369A1" />

    <!-- Cream Snout -->
    <ellipse cx="50" cy="62" rx="16" ry="11" fill="#FEF08A" />

    <!-- Whiskers -->
    <path d="M 38 60 Q 24 58 16 60" stroke="#475569" stroke-width="1.5" stroke-linecap="round" fill="none" />
    <path d="M 38 64 Q 24 66 18 70" stroke="#475569" stroke-width="1.5" stroke-linecap="round" fill="none" />
    <path d="M 62 60 Q 76 58 84 60" stroke="#475569" stroke-width="1.5" stroke-linecap="round" fill="none" />
    <path d="M 62 64 Q 76 66 82 70" stroke="#475569" stroke-width="1.5" stroke-linecap="round" fill="none" />

    <!-- Shiny Nose -->
    <path
      d="M 46 56 C 46 54 54 54 54 56 C 54 59 52 61 50 61 C 48 61 46 59 46 56 Z"
      fill="#0F172A"
    />
    <circle cx="49" cy="56" r="1" fill="#FFFFFF" />

    <!-- Cute Smile -->
    <path
      d="M 45 64 Q 48 67 50 64 Q 52 67 55 64"
      stroke="#0F172A"
      stroke-width="1.5"
      stroke-linecap="round"
      fill="none"
    />

    <!-- Rosy Cheeks -->
    <circle cx="32" cy="60" r="4.5" fill="#FB7185" opacity="0.45" />
    <circle cx="68" cy="60" r="4.5" fill="#FB7185" opacity="0.45" />

    <!-- Big Expressive Cartoon Eyes -->
    <ellipse cx="36" cy="44" rx="6.5" ry="8" fill="#0F172A" />
    <circle cx="34.5" cy="41.5" r="2.8" fill="#FFFFFF" />
    <circle cx="39" cy="46" r="1.3" fill="#FFFFFF" />

    <ellipse cx="64" cy="44" rx="6.5" ry="8" fill="#0F172A" />
    <circle cx="62.5" cy="41.5" r="2.8" fill="#FFFFFF" />
    <circle cx="67" cy="46" r="1.3" fill="#FFFFFF" />

    <!-- Cute Eyebrows -->
    <path d="M 31 33 Q 36 30 41 33" stroke="#0284C7" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 59 33 Q 64 30 69 33" stroke="#0284C7" stroke-width="2" stroke-linecap="round" fill="none" />

    <!-- Wireless White & Emerald Headphones -->
    <path
      d="M 22 44 C 22 18 78 18 78 44"
      stroke="#F8FAFC"
      stroke-width="3.2"
      stroke-linecap="round"
      fill="none"
    />
    <rect x="15" y="40" width="7" height="13" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <rect x="78" y="40" width="7" height="13" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
  </g>
</svg>`;

// Write SVGs
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf-8');

// Generate PNGs using Sharp
async function run() {
  const svgBuffer = Buffer.from(svgContent);

  // 1. apple-touch-icon.png (180x180 standard for iOS)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 2. icon-192.png (Android / PWA)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 3. icon-512.png (Android / PWA Splash / Cover)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 4. favicon-32.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));

  // 5. og-image.png (1200x630 social preview card)
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900
    },
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(360, 360).toBuffer(),
        top: 135,
        left: 420,
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  // 6. Write web manifest
  const manifest = {
    name: 'SimpleENG - Pratique seu Inglês',
    short_name: 'SimpleENG',
    description: 'Transforme anotações da sua aula de inglês em treinos diários gamificados.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };

  fs.writeFileSync(
    path.join(publicDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log('Successfully generated all icons and manifest in public/!');
}

run().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
