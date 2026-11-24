// 按胸、腰、臀、大腿围画一个正面剪影（viewBox 0 0 120 240）。变化做了适当放大，方便看出差别。

export interface Girths {
  chest: number;
  waist: number;
  hip: number;
  thigh: number;
}

/** 没填或填得离谱的围度，换成合理范围内的值，免得剪影变形 */
function safe(v: number, fallback: number, lo: number, hi: number): number {
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

export function silhouettePaths(input: Girths): { body: string; arms: string } {
  const g = {
    chest: safe(input.chest, 96, 70, 130),
    waist: safe(input.waist, 84, 55, 125),
    hip: safe(input.hip, 95, 75, 130),
    thigh: safe(input.thigh, 55, 40, 75),
  };
  const C = 17 + (g.chest - 96) * 0.45;
  const W = 14 + (g.waist - 84) * 0.55;
  const H = 18 + (g.hip - 95) * 0.5;
  const t = 8.5 + (g.thigh - 55) * 0.5;
  const S = 23 + (g.chest - 96) * 0.2;
  const lc = H / 2;
  const R = (d: number) => (60 + d).toFixed(1);
  const L = (d: number) => (60 - d).toFixed(1);

  const body = [
    `M ${L(6)} 38 L ${R(6)} 38`,
    `L ${R(S)} 47`,
    `Q ${R(S + 0.5)} 54 ${R(C)} 62`,
    `Q ${R((C + W) / 2 + 1)} 80 ${R(W)} 97`,
    `Q ${R(W)} 110 ${R(H)} 121`,
    `L ${R(lc + t)} 142`,
    `L ${R(lc + 6.5)} 182`,
    `L ${R(lc + 7)} 198`,
    `L ${R(lc + 3.5)} 222`,
    `L ${R(lc + 6)} 231`,
    `L ${R(lc - 3.5)} 231`,
    `L ${R(lc - 3)} 222`,
    `L ${R(lc - 4.5)} 198`,
    `L ${R(lc - 5)} 182`,
    `L ${R(1.2)} 146`,
    `L 60 141`,
    `L ${L(1.2)} 146`,
    `L ${L(lc - 5)} 182`,
    `L ${L(lc - 4.5)} 198`,
    `L ${L(lc - 3)} 222`,
    `L ${L(lc - 3.5)} 231`,
    `L ${L(lc + 6)} 231`,
    `L ${L(lc + 3.5)} 222`,
    `L ${L(lc + 7)} 198`,
    `L ${L(lc + 6.5)} 182`,
    `L ${L(lc + t)} 142`,
    `L ${L(H)} 121`,
    `Q ${L(W)} 110 ${L(W)} 97`,
    `Q ${L((C + W) / 2 + 1)} 80 ${L(C)} 62`,
    `Q ${L(S + 0.5)} 54 ${L(S)} 47`,
    'Z',
  ].join(' ');

  const arm = (P: (d: number) => string) =>
    `M ${P(S - 1)} 47 L ${P(S + 4)} 53 L ${P(C + 8)} 96 L ${P(C + 9.5)} 126 ` +
    `Q ${P(C + 7)} 136 ${P(C + 4)} 127 L ${P(C + 2.5)} 98 L ${P(C)} 66 Z`;

  return { body, arms: `${arm(R)} ${arm(L)}` };
}
