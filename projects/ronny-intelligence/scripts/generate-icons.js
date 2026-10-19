import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Standard icon SVG (1:1 with dark slate background and glowing logo)
  const createSvg = (size, paddingRatio = 0.18, bgColor = '#090A0C') => {
    const pad = size * paddingRatio;
    const innerSize = size - pad * 2;
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="ronnyTeal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00E5BE" />
          <stop offset="100%" stop-color="#00BFA0" />
        </linearGradient>
        <linearGradient id="ronnyBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#1E6BFF" />
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
      
      <!-- Logo Centered -->
      <g transform="translate(${pad}, ${pad}) scale(${innerSize / 100})">
        <rect x="10" y="36" width="15" height="50" rx="7.5" fill="url(#ronnyTeal)" />
        <rect x="31" y="14" width="15.5" height="72" rx="7.75" fill="url(#ronnyBlue)" />
        <path d="M38 14 H64 C76 14 85 23 85 35 C85 47 76 56 64 56 H42" stroke="url(#ronnyBlue)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="63" cy="35" r="7.5" fill="#FFFFFF" />
        <circle cx="63" cy="35" r="4.2" fill="#0A59F7" />
        <path d="M52 51 L77 82 C79 84.5 83 86 86.5 86 H88 C90 86 91 84 90 82.5 L67 48 Z" fill="url(#ronnyBlue)" />
      </g>
    </svg>
    `;
  };

  // Maskable icon SVG (full bleed background, inner content in safe 80% zone)
  const createMaskableSvg = (size) => {
    const pad = size * 0.22; // 22% padding ensures safe zone
    const innerSize = size - pad * 2;
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="ronnyTeal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00E5BE" />
          <stop offset="100%" stop-color="#00BFA0" />
        </linearGradient>
        <linearGradient id="ronnyBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#1E6BFF" />
        </linearGradient>
      </defs>
      <!-- Full bleed background for Android clipping -->
      <rect width="${size}" height="${size}" fill="url(#bgGradMask)" />
      
      <!-- Inner Safe Content -->
      <g transform="translate(${pad}, ${pad}) scale(${innerSize / 100})">
        <rect x="10" y="36" width="15" height="50" rx="7.5" fill="url(#ronnyTeal)" />
        <rect x="31" y="14" width="15.5" height="72" rx="7.75" fill="url(#ronnyBlue)" />
        <path d="M38 14 H64 C76 14 85 23 85 35 C85 47 76 56 64 56 H42" stroke="url(#ronnyBlue)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="63" cy="35" r="7.5" fill="#FFFFFF" />
        <circle cx="63" cy="35" r="4.2" fill="#0A59F7" />
        <path d="M52 51 L77 82 C79 84.5 83 86 86.5 86 H88 C90 86 91 84 90 82.5 L67 48 Z" fill="url(#ronnyBlue)" />
      </g>
    </svg>
    `;
  };

  console.log('Generating 192x192 icon...');
  await sharp(Buffer.from(createSvg(192)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating 512x512 icon...');
  await sharp(Buffer.from(createSvg(512)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating 512x512 maskable icon...');
  await sharp(Buffer.from(createMaskableSvg(512)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(Buffer.from(createSvg(180, 0.15)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating apple-touch-icon-180x180.png...');
  await sharp(Buffer.from(createSvg(180, 0.15)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon-180x180.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
