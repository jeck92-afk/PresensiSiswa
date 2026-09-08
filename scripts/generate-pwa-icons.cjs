const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG encoder using built-in Node.js zlib
function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4; // RGBA
  const rowSize = width * bytesPerPixel;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Drawing function for SIADIK icon: Deep Navy/Blue circular badge with gold rings and book/graduation icon
function drawSiadikIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w * 0.46;

  // Background for maskable is full bleed deep blue
  if (isMaskable) {
    if (dist > maxRadius) {
      return [15, 23, 42, 255]; // #0f172a
    }
  } else {
    // Normal circle badge
    if (dist > maxRadius) {
      return [0, 0, 0, 0]; // Transparent
    }
  }

  // Outer gold rim
  if (dist > maxRadius - 6) {
    return [245, 158, 11, 255]; // Gold #f59e0b
  }

  // Inner deep gradient field
  const gradFactor = (y / h);
  const r = Math.round(15 + gradFactor * 20);
  const g = Math.round(23 + gradFactor * 35);
  const b = Math.round(42 + gradFactor * 70); // #0f172a to deep royal blue

  // Inner gold ring
  if (Math.abs(dist - (maxRadius * 0.88)) < 1.5) {
    return [254, 240, 138, 220]; // Light gold
  }

  // Draw central Book / Shield / Education motif
  // Upper triangle / graduation cap / flame
  const relY = (y - cy) / (w * 0.5);
  const relX = (x - cx) / (w * 0.5);

  // Flame top
  if (relY >= -0.6 && relY <= -0.15) {
    const flameW = (relY + 0.6) * 0.35 * (1 - (relY + 0.15) * 0.8);
    if (Math.abs(relX) < Math.max(0.02, flameW)) {
      if (Math.abs(relX) < flameW * 0.4) {
        return [254, 240, 138, 255]; // Bright yellow-white
      }
      return [245, 158, 11, 255]; // Orange gold
    }
  }

  // Open Book shape in center
  if (relY >= -0.1 && relY <= 0.38) {
    const bookWidth = 0.55;
    if (Math.abs(relX) < bookWidth) {
      // Spine
      if (Math.abs(relX) < 0.03) {
        return [203, 213, 225, 255]; // Spine line
      }
      // Book pages
      const pageCurve = 0.08 * Math.sin(Math.PI * Math.abs(relX) / bookWidth);
      if (relY >= -0.05 + pageCurve && relY <= 0.32 + pageCurve) {
        // Page lines
        const linePos = (relY - (-0.05 + pageCurve)) * 10;
        if (Math.sin(linePos * 6) > 0.6 && Math.abs(relX) > 0.08 && Math.abs(relX) < 0.45) {
          return [148, 163, 184, 255]; // Slate text line
        }
        return [248, 250, 252, 255]; // Crisp white page
      }
      // Book cover bottom
      if (relY > 0.32 + pageCurve && relY <= 0.37 + pageCurve) {
        return [12, 74, 110, 255]; // Navy cover
      }
    }
  }

  // Bottom gold banner
  if (relY >= 0.42 && relY <= 0.6) {
    const bannerW = 0.62;
    if (Math.abs(relX) < bannerW) {
      return [245, 158, 11, 255]; // Gold ribbon
    }
  }

  return [r, g, b, 255];
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PWA Icons in:', publicDir);

// Generate 192x192
const icon192 = createPNG(192, 192, (x, y, w, h) => drawSiadikIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Generated pwa-192x192.png');

// Generate 512x512
const icon512 = createPNG(512, 512, (x, y, w, h) => drawSiadikIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Generated pwa-512x512.png');

// Generate maskable 512x512
const iconMaskable = createPNG(512, 512, (x, y, w, h) => drawSiadikIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
console.log('Generated pwa-maskable-512x512.png');

// Generate Apple Touch Icon 180x180
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawSiadikIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Generated apple-touch-icon.png');
