import type { BodyEntry } from '../lib/types';
import { formatMD, formatShort } from '../lib/dates';
import { silhouettePaths } from '../lib/silhouette';

const W = 196;
const H = 172;
const TOP = 14;
const BOTTOM = 158;
const LEFT = 22;
const RIGHT = 186;

/**
 * 折线图 + 身材剪影
 * entries：图上画的点（按日期从早到晚）；focus：当前选中的那条；ghost：用来对比的第一条
 */
export function WeightChart({
  entries, focus, ghost, onSelect,
}: {
  entries: BodyEntry[];
  focus: BodyEntry;
  ghost: BodyEntry;
  onSelect: (id: string) => void;
}) {
  const weights = entries.map((e) => e.weightKg);
  let lo = Math.floor(Math.min(...weights) - 0.5);
  let hi = Math.ceil(Math.max(...weights) + 0.5);
  if (hi - lo < 4) {
    const mid = (hi + lo) / 2;
    lo = Math.floor(mid - 2);
    hi = Math.ceil(mid + 2);
  }
  const n = entries.length;
  const x = (i: number) => (n === 1 ? (LEFT + RIGHT) / 2 : LEFT + (i * (RIGHT - LEFT)) / (n - 1));
  const y = (w: number) => TOP + ((hi - w) / (hi - lo)) * (BOTTOM - TOP);
  const pts = entries.map((e, i) => `${x(i).toFixed(1)},${y(e.weightKg).toFixed(1)}`).join(' ');
  const area = `M ${x(0).toFixed(1)} 170 ${entries.map((e, i) => `L ${x(i).toFixed(1)} ${y(e.weightKg).toFixed(1)}`).join(' ')} L ${x(n - 1).toFixed(1)} 170 Z`;
  const grid = [hi, Math.round((hi + lo) / 2), lo];
  const cur = silhouettePaths(focus);
  const old = silhouettePaths(ghost);
  const showGhost = ghost.id !== focus.id;

  return (
    <div class="wchart">
      <div class="wchart-plot" style={{ width: `${W}px`, height: `${H + 24}px` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" class="wchart-svg">
          {grid.map((g) => (
            <g key={g}>
              <line x1="18" x2="194" y1={y(g)} y2={y(g)} class="wchart-grid" />
              <text x="0" y={y(g) + 3} class="wchart-axis">{g}</text>
            </g>
          ))}
          <path d={area} class="wchart-area" />
          {n > 1 && <polyline points={pts} class="wchart-line" />}
        </svg>
        {entries.map((e, i) => {
          const on = e.id === focus.id;
          return (
            <button
              key={e.id}
              type="button"
              class="wchart-pt"
              style={{ left: `${x(i) - 16}px`, top: `${y(e.weightKg) - 22}px` }}
              aria-label={`${formatMD(e.date)} ${e.weightKg.toFixed(1)} 公斤`}
              aria-pressed={on}
              onClick={() => onSelect(e.id)}
            >
              <span class={on ? 'wchart-dot wchart-dot--on' : 'wchart-dot'} />
            </button>
          );
        })}
        {n <= 7 &&
          entries.map((e, i) => (
            <span
              key={e.id + 'l'}
              aria-hidden="true"
              class={e.id === focus.id ? 'wchart-label wchart-label--on' : 'wchart-label'}
              style={{ left: `${x(i) - 18}px`, top: `${H + 6}px` }}
            >
              {formatShort(e.date)}
            </span>
          ))}
      </div>
      <div class="wchart-sil">
        <svg width="106" height="212" viewBox="0 0 120 240" role="img" aria-label={`身材剪影：${formatMD(focus.date)}，腰围 ${focus.waist} 厘米`}>
          {showGhost && <path d={`${old.body} ${old.arms}`} class="sil-ghost" />}
          <circle cx="60" cy="22" r="11" class="sil-fill" />
          <rect x="55.5" y="30" width="9" height="10" class="sil-fill" />
          <path d={cur.body} class="sil-fill" />
          <path d={cur.arms} class="sil-fill" />
        </svg>
        {showGhost && <span class="wchart-caption">虚线：{formatMD(ghost.date)}的身材</span>}
      </div>
    </div>
  );
}
