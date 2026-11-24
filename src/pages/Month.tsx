import type { TrackRules } from '../lib/types';
import { addMonths, formatMD, formatYM, getToday, monthOf, weekdayIndex } from '../lib/dates';
import { href, useData } from '../lib/hooks';
import type { DayEval } from '../lib/rules';
import { dietCounts, monthStats, trackBonus } from '../lib/rules';
import { Chip, money } from '../components/ui';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';

/** 4 段刻度上的位置：不合格 / 合格 / 奖励 / 封顶 */
function markerPct(days: number, t: TrackRules): number {
  const seg = (i: number, frac: number) => (i + Math.max(0, Math.min(1, frac))) * 25;
  if (days < t.pass) return seg(0, days / t.pass);
  if (days < t.reward) return seg(1, (days - t.pass) / Math.max(1, t.reward - t.pass));
  if (days < t.cap) return seg(2, (days - t.reward) / Math.max(1, t.cap - t.reward));
  return 87.5;
}

function TrackTile({ id, label, days, t, isPast }: { id: string; label: string; days: number; t: TrackRules; isPast: boolean }) {
  const bonus = trackBonus(days, t);
  const ok = days >= t.pass;
  return (
    <section class="card card--tight" aria-labelledby={id}>
      <div class="card-head">
        <h2 id={id} class="h3">{label}</h2>
        {ok ? <Chip kind="pass">合格</Chip> : <Chip kind={isPast ? 'fail' : 'gray'}>{isPast ? '不合格' : '未合格'}</Chip>}
      </div>
      <p class="tile-big">
        <span class="num">{days}</span>
        <span class="muted">天达标</span>
      </p>
      <div class="scale" aria-hidden="true">
        <span class="scale-seg scale-seg--fail" />
        <span class="scale-seg scale-seg--pass" />
        <span class="scale-seg scale-seg--reward" />
        <span class="scale-seg scale-seg--cap" />
        <span class="scale-marker" style={{ left: `${markerPct(days, t)}%` }} />
      </div>
      <span class="small muted num">{t.pass} 合格 · {t.reward} 奖励 · {t.cap} 封顶</span>
      <span class="money-line num">
        {days >= t.reward ? `已拿下 ${money(bonus)}` : ok ? `还差 ${t.reward - days} 天 → ${money(t.base)}` : `还差 ${t.pass - days} 天合格`}
      </span>
    </section>
  );
}

const DIET_DOT: Record<string, [string, string] | undefined> = {
  pass: ['dot--pass', '达标'],
  exempt: ['dot--pass', '豁免算达标'],
  cheat: ['dot--cheat', '放纵日'],
  pending: ['dot--pending', '豁免待审核'],
  fail: ['dot--fail', '不达标'],
  missing: ['dot--missing', '没记录'],
  today: ['dot--today', '进行中'],
};
const TRAIN_SQ: Record<string, [string, string] | undefined> = {
  pass: ['sq--pass', '达标'],
  partial: ['sq--partial', '练了没达标'],
  none: ['sq--none', '没练'],
  'today-none': ['sq--none', '还没练'],
};

function Cell({ d, today }: { d: DayEval; today: string }) {
  const num = Number(d.date.slice(8));
  const dot = DIET_DOT[d.diet.status];
  const sq = TRAIN_SQ[d.train.status];
  const both = dietCounts(d.diet.status) && d.train.status === 'pass';
  const cls = ['cal-cell', both ? 'cal-cell--both' : '', d.date === today ? 'cal-cell--today' : ''].join(' ');
  if (!dot && !sq) {
    return (
      <span class={cls + ' cal-cell--off'}>
        <span class="cal-num num">{num}</span>
        <span class="cal-marks" />
      </span>
    );
  }
  return (
    <a class={cls} href={href(d.date === today ? '/today' : `/today/${d.date}`)} aria-label={`${formatMD(d.date)}：饮食${dot?.[1] ?? '—'}，训练${sq?.[1] ?? '—'}`}>
      <span class="cal-num num">{num}</span>
      <span class="cal-marks" aria-hidden="true">
        <span class={`dot ${dot?.[0] ?? ''}`} />
        <span class={`sq ${sq?.[0] ?? ''}`} />
      </span>
    </a>
  );
}

export function MonthPage({ ym: ymParam }: { ym?: string }) {
  const data = useData();
  const today = getToday();
  const cur = monthOf(today);
  const startYM = monthOf(data.startDate);
  const ym = ymParam && /^\d{4}-\d{2}$/.test(ymParam) && ymParam <= cur && ymParam >= startYM ? ymParam : cur;
  const s = monthStats(data, ym, today);
  const r = s.rules;
  const settled = data.settlements[ym];
  const lead = weekdayIndex(`${ym}-01`);

  return (
    <main class="screen">
      <header class="pagebar">
        <h1 class="h1">{ym === cur ? '本月' : formatYM(ym)}</h1>
        <div class="monthnav">
          {ym > startYM ? (
            <a class="icon-btn" href={href(`/month/${addMonths(ym, -1)}`)} aria-label="上个月"><IconChevronLeft size={20} /></a>
          ) : (
            <span class="icon-btn" aria-hidden="true" />
          )}
          <span class="monthnav-label">{formatYM(ym)}</span>
          {ym < cur ? (
            <a class="icon-btn" href={href(`/month/${addMonths(ym, 1)}`)} aria-label="下个月"><IconChevronRight size={20} /></a>
          ) : (
            <span class="icon-btn" aria-hidden="true" />
          )}
        </div>
      </header>

      {(settled || s.dietPending > 0) && (
        <p class="banner">
          {settled ? `审批人已确认这个月的结算：${settled.total >= 0 ? money(settled.total) : `罚款 ${money(-settled.total)}`}` : `有 ${s.dietPending} 天豁免待审核，批准后算饮食达标`}
        </p>
      )}

      <div class="grid2">
        <TrackTile id="m-diet" label="饮食" days={s.dietDays} t={r.diet} isPast={s.isPast} />
        <TrackTile id="m-train" label="训练" days={s.trainingDays} t={r.training} isPast={s.isPast} />
      </div>

      <section class="card" aria-labelledby="cal-h">
        <div class="card-head">
          <h2 id="cal-h" class="h3">打卡日历</h2>
          <span class="small muted">点日期看当天详情</span>
        </div>
        <div class="cal-week" aria-hidden="true">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => <span key={w}>{w}</span>)}
        </div>
        <div class="cal-grid">
          {Array.from({ length: lead }, (_, i) => <span key={'b' + i} />)}
          {s.days.map((d) => <Cell key={d.date} d={d} today={today} />)}
        </div>
        <div class="legend">
          <div class="legend-row">
            <b>圆点 · 饮食</b>
            <span><i class="dot dot--pass" />达标</span>
            <span><i class="dot dot--cheat" />放纵日</span>
            <span><i class="dot dot--pending" />待审核</span>
            <span><i class="dot dot--fail" />不达标</span>
            <span><i class="dot dot--missing" />没记录</span>
          </div>
          <div class="legend-row">
            <b>方块 · 训练</b>
            <span><i class="sq sq--pass" />达标</span>
            <span><i class="sq sq--partial" />练了没达标</span>
            <span><i class="sq sq--none" />没练</span>
            <span><i class="legend-both" />两项都达标</span>
          </div>
        </div>
      </section>
    </main>
  );
}
