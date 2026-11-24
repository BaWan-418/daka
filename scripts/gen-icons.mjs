// 生成 App 图标（黑底、金色圆、黑色对勾），不依赖任何图片库
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [0x1c, 0x1b, 0x19];
const GOLD = [0xf5, 0xc4, 0x51];
const GOLD_DARK = [0xc9, 0x97, 0x1c];

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** scale：金色圆相对画面的大小（maskable 图标要留安全边距） */
function icon(size, scale) {
  const SS = 4;
  const r = 0.36 * scale;
  const ring = 0.035 * scale;
  const check = [[0.5 - 0.15 * scale, 0.5 + 0.01 * scale], [0.5 - 0.04 * scale, 0.5 + 0.12 * scale], [0.5 + 0.17 * scale, 0.5 - 0.11 * scale]];
  const stroke = 0.075 * scale;
  return png(size, (x, y) => {
    let acc = [0, 0, 0];
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const u = (x + (sx + 0.5) / SS) / size;
        const v = (y + (sy + 0.5) / SS) / size;
        const d = Math.hypot(u - 0.5, v - 0.5);
        let c = BG;
        if (d <= r) {
          c = d >= r - ring ? GOLD_DARK : GOLD;
          const dc = Math.min(
            distToSeg(u, v, check[0][0], check[0][1], check[1][0], check[1][1]),
            distToSeg(u, v, check[1][0], check[1][1], check[2][0], check[2][1]),
          );
          if (dc <= stroke / 2) c = BG;
        }
        acc = acc.map((a, i) => a + c[i]);
      }
    }
    return acc.map((a) => Math.round(a / (SS * SS)));
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 1));
writeFileSync('public/icons/icon-192.png', icon(192, 1));
writeFileSync('public/icons/icon-512.png', icon(512, 1));
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.78));
console.log('icons written to public/icons');
