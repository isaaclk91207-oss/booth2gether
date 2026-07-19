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
  photos: PhotoMetadata[];
}

const STRIP_WIDTH = 600;
const PHOTO_GAP = 12;
const GRID_PADDING = 20;
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 60;
const BORDER_RADIUS = 8;
const COLUMNS = 2;

async function downloadImage(url: string): Promise<Buffer> {
  if (url.startsWith('/uploads/')) {
    const filePath = path.resolve(url.slice(1));
    const data = fs.readFileSync(filePath);
    if (data.length === 0) throw new Error(`Empty file: ${filePath}`);
    return data;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length === 0) throw new Error(`Empty response: ${url}`);
  return data;
}

async function roundCorners(input: Buffer, radius: number, width: number, height: number): Promise<Buffer> {
  return sharp(input)
    .resize(width, height, { fit: 'cover' })
    .composite([{
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`
      ),
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();
}

function computeGridPosition(
  index: number,
  total: number,
  cellWidth: number,
  cellHeight: number,
): { x: number; y: number } {
  const row = Math.floor(index / COLUMNS);
  const col = index % COLUMNS;
  const isLastRow = row === Math.floor((total - 1) / COLUMNS);
  const itemsInLastRow = total - row * COLUMNS;
  const gridWidth = cellWidth * COLUMNS + PHOTO_GAP * (COLUMNS - 1);

  let x = col * (cellWidth + PHOTO_GAP);
  const y = row * (cellHeight + PHOTO_GAP);

  if (isLastRow && itemsInLastRow === 1) {
    x = Math.floor((gridWidth - cellWidth) / 2);
  }

  return { x, y };
}

async function createPhotoGrid(
  photos: PhotoMetadata[],
  cellWidth: number,
  cellHeight: number,
): Promise<{ buffer: Buffer; height: number }> {
  const rows = Math.ceil(photos.length / COLUMNS);
  const gridWidth = cellWidth * COLUMNS + PHOTO_GAP * (COLUMNS - 1);
  const gridHeight = cellHeight * rows + PHOTO_GAP * (rows - 1);

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo) continue;
    const imgBuffer = await downloadImage(photo.url);
    const resized = await sharp(imgBuffer)
      .resize(cellWidth, cellHeight, { fit: 'cover' })
      .toBuffer();

    const rounded = await roundCorners(resized, BORDER_RADIUS, cellWidth, cellHeight);
    const pos = computeGridPosition(i, photos.length, cellWidth, cellHeight);

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

  const buffer = await canvas.composite(composites).png().toBuffer();
  return { buffer, height: gridHeight };
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function generatePhotoStrip(options: GenerateStripOptions): Promise<string> {
  const {
    roomId,
    hostName,
    guestName,
    photos,
  } = options;

  const cellW = Math.floor((STRIP_WIDTH - GRID_PADDING * 2 - PHOTO_GAP * (COLUMNS - 1)) / COLUMNS);
  const cellH = Math.floor(cellW * 0.75);

  const { buffer: photoGrid, height: gridHeight } = await createPhotoGrid(photos, cellW, cellH);

  const gridWidth = cellW * COLUMNS + PHOTO_GAP * (COLUMNS - 1);
  const totalHeight = HEADER_HEIGHT + gridHeight + PHOTO_GAP * 2 + FOOTER_HEIGHT + GRID_PADDING * 2;
  const totalWidth = STRIP_WIDTH;

  const dateStr = escapeXml(formatDate(new Date()));
  const titleText = escapeXml(`${hostName} & ${guestName}`);

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

  const photoGridY = HEADER_HEIGHT + GRID_PADDING;

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
      { input: photoGrid, left: GRID_PADDING, top: photoGridY },
    ])
    .png()
    .toFile(outputPath);

  return `/uploads/${outputFilename}`;
}
