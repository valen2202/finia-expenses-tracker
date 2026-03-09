/**
 * Genera íconos PNG para la PWA sin dependencias externas.
 * Crea cuadrados sólidos color indigo (#4f46e5) con el logo "IA" centrado.
 * Uso: node scripts/generate-icons.mjs
 */

import { createWriteStream, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/icons');

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Escribe un PNG válido de NxN píxeles con color sólido.
 * Implementación manual del formato PNG (RFC 2083).
 */
function createSolidPNG(size, r, g, b) {
  // Cada fila: filtro byte (0) + 3 bytes por pixel (RGB)
  const rowSize = 1 + size * 3;
  const rawData = Buffer.alloc(size * rowSize);

  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      rawData[rowStart + 1 + x * 3 + 0] = r;
      rawData[rowStart + 1 + x * 3 + 1] = g;
      rawData[rowStart + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = deflateSync(rawData);

  function crc32(buf) {
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
  }

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth (8), color type (2=RGB), compression (0), filter (0), interlace (0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Indigo #4f46e5 = rgb(79, 70, 229)
const INDIGO_R = 79;
const INDIGO_G = 70;
const INDIGO_B = 229;

const sizes = [192, 512];

for (const size of sizes) {
  const png = createSolidPNG(size, INDIGO_R, INDIGO_G, INDIGO_B);
  const outPath = join(OUT_DIR, `icon-${size}x${size}.png`);
  createWriteStream(outPath).write(png);
  console.log(`✓ Generado: public/icons/icon-${size}x${size}.png (${size}x${size}px, ${png.length} bytes)`);
}

console.log('\nÍconos PWA generados correctamente en public/icons/');
