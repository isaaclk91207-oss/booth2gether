import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('uploads');

interface PhotoMetadata {
  url: string;
  userId: string;
  shotIndex: number;
}

interface GenerateStripOptions {
  roomId: string;
  hostName: string;
  guestName: string;
  hostPhotos: PhotoMetadata[];
  guestPhotos: PhotoMetadata[];
}

const STRIP_WIDTH = 600;
const PHOTO_GAP = 12;
const GRID_PADDING = 20;
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 60;
const BORDER_RADIUS = 8;

async function downloadImage(url: string): Promise<Buffer> {
  if (url.startsWith('/uploads/')) {
    const filePath = path.resolve(url.slice(1));
    return fs.readFileSync(filePath);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function roundCorners(input: Buffer, radius: number): Promise<Buffer> {
  return sharp(input)
    .resize({ fit: 'cover' })
    .composite([{
      input: Buffer.from(
        `<svg><rect width="100%" height="100%" rx="${radius}" ry="${radius}"/></svg>`
      ),
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();
}

async function createPhotoGrid(
  photos: PhotoMetadata[],
  cellWidth: number,
  cellHeight: number,
): Promise<Buffer> {
  const gridWidth = cellWidth * 2 + PHOTO_GAP;
  const gridHeight = cellHeight * 2 + PHOTO_GAP;

  const sorted = [...photos].sort((a, b) => a.shotIndex - b.shotIndex);

  const positions = [
    { x: 0, y: 0 },
    { x: cellWidth + PHOTO_GAP, y: 0 },
    { x: 0, y: cellHeight + PHOTO_GAP },
    { x: cellWidth + PHOTO_GAP, y: cellHeight + PHOTO_GAP },
  ];

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < Math.min(sorted.length, 4); i++) {
    const photo = sorted[i];
    if (!photo) continue;
    const imgBuffer = await downloadImage(photo.url);
    const resized = await sharp(imgBuffer)
      .resize(cellWidth, cellHeight, { fit: 'cover' })
      .toBuffer();

    const rounded = await roundCorners(resized, BORDER_RADIUS);
    const pos = positions[i];
    if (!pos) continue;

    composites.push({
      input: rounded,
      left: pos.x,
      top: pos.y,
    });
  }

  const canvas = sharp({
    create: {
      width: gridWidth,
      height: gridHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  return canvas.composite(composites).png().toBuffer();
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export async function generatePhotoStrip(options: GenerateStripOptions): Promise<string> {
  const {
    roomId,
    hostName,
    guestName,
    hostPhotos,
    guestPhotos,
  } = options;

  const cellW = Math.floor((STRIP_WIDTH - GRID_PADDING * 2 - PHOTO_GAP) / 2);
  const cellH = Math.floor(cellW * 0.75);

  const [hostGrid, guestGrid] = await Promise.all([
    createPhotoGrid(hostPhotos, cellW, cellH),
    createPhotoGrid(guestPhotos, cellW, cellH),
  ]);

  const gridWidth = cellW * 2 + PHOTO_GAP;
  const gridHeight = cellH * 2 + PHOTO_GAP;

  const totalHeight = HEADER_HEIGHT + gridHeight * 2 + PHOTO_GAP * 3 + FOOTER_HEIGHT + GRID_PADDING * 2;
  const totalWidth = STRIP_WIDTH;

  const dateStr = formatDate(new Date());
  const titleText = `${hostName} & ${guestName}`;

  const svgOverlay = Buffer.from(`
    <svg width="${totalWidth}" height="${totalHeight}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)" rx="16" ry="16"/>

      <!-- Border -->
      <rect x="2" y="2" width="${totalWidth - 4}" height="${totalHeight - 4}"
            fill="none" stroke="#e94560" stroke-width="3" rx="14" ry="14"
            stroke-dasharray="8,4" opacity="0.6"/>

      <!-- Header -->
      <text x="${totalWidth / 2}" y="${HEADER_HEIGHT / 2 - 5}"
            text-anchor="middle" font-family="Georgia, serif" font-size="22"
            font-weight="bold" fill="#e94560">${titleText}</text>
      <text x="${totalWidth / 2}" y="${HEADER_HEIGHT / 2 + 20}"
            text-anchor="middle" font-family="Georgia, serif" font-size="13"
            fill="#a0a0a0">${dateStr}</text>

      <!-- Divider after header -->
      <line x1="${GRID_PADDING}" y1="${HEADER_HEIGHT}"
            x2="${totalWidth - GRID_PADDING}" y2="${HEADER_HEIGHT}"
            stroke="#e94560" stroke-width="1" opacity="0.4"/>

      <!-- Section labels -->
      <text x="${totalWidth / 2}" y="${HEADER_HEIGHT + GRID_PADDING + gridHeight + PHOTO_GAP / 2 + 5}"
            text-anchor="middle" font-family="Arial, sans-serif" font-size="11"
            fill="#e94560" text-transform="uppercase" letter-spacing="3">STORY</text>

      <!-- Footer -->
      <text x="${totalWidth / 2}" y="${totalHeight - FOOTER_HEIGHT / 2 + 5}"
            text-anchor="middle" font-family="Arial, sans-serif" font-size="11"
            fill="#606060" letter-spacing="2">MADE WITH BOOTH2GETHER</text>

      <!-- Footer divider -->
      <line x1="${GRID_PADDING}" y1="${totalHeight - FOOTER_HEIGHT}"
            x2="${totalWidth - GRID_PADDING}" y2="${totalHeight - FOOTER_HEIGHT}"
            stroke="#e94560" stroke-width="1" opacity="0.4"/>

      <!-- Corner decorations -->
      <circle cx="16" cy="16" r="4" fill="#e94560" opacity="0.5"/>
      <circle cx="${totalWidth - 16}" cy="16" r="4" fill="#e94560" opacity="0.5"/>
      <circle cx="16" cy="${totalHeight - 16}" r="4" fill="#e94560" opacity="0.5"/>
      <circle cx="${totalWidth - 16}" cy="${totalHeight - 16}" r="4" fill="#e94560" opacity="0.5"/>
    </svg>
  `);

  const hostGridY = HEADER_HEIGHT + GRID_PADDING;
  const guestGridY = HEADER_HEIGHT + GRID_PADDING + gridHeight + PHOTO_GAP;

  const outputFilename = `strip_${roomId}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 255 },
    },
  })
    .composite([
      { input: svgOverlay, left: 0, top: 0 },
      { input: hostGrid, left: GRID_PADDING, top: hostGridY },
      { input: guestGrid, left: GRID_PADDING, top: guestGridY },
    ])
    .png()
    .toFile(outputPath);

  return `/uploads/${outputFilename}`;
}
