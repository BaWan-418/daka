import { useState } from 'preact/hooks';
import type { BodyEntry } from '../lib/types';
import { formatMD, getToday, monthOf } from '../lib/dates';
import { href, useData } from '../lib/hooks';
import { ACTIVITY, GOALS, bmi, currentLimit, sortedBody } from '../lib/kcal';
import { rulesForMonth } from '../lib/rules';
import { clearBodyHistory, deleteBody, recordBody } from '../lib/actions';
import { WeightChart } from '../components/WeightChart';
import { Confirm, Sheet } from '../components/Sheet';
import { Chip, NumInput } from '../components/ui';
import { IconChevronRight, IconPlus, IconTrash, IconUser } from '../components/Icons';
import { toast } from '../components/Toast';

const CHART_MAX = 12;
const kg = (n: number) => n.toFixed(1);

export function MePage() {
  const data = useData();
  const entries = sortedBody(data);
  const [selId, setSelId] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  const p = data.profile;
  const limit = currentLimit(data, rulesForMonth(data, monthOf(getToday())));
  const latest = entries[entries.length - 1];
  const focusIdx = Math.max(0, entries.findIndex((e) => e.id === selId));
  const focus = selId && entries[focusIdx]?.id === selId ? entries[focusIdx] : latest;
  const fi = entries.indexOf(focus);
  const prev = fi > 0 ? entries[fi - 1] : null;
  const first = entries[0];
  const chartEntries = entries.slice(-CHART_MAX);
  const totalDelta = latest && first ? latest.weightKg - first.weightKg : 0;
  const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±');

  return (
    <main class="screen">
      <header class="pagebar">
        <h1 class="h1">我的</h1>
        <button type="button" class="btn btn-primary btn-compact" onClick={() => setRecordOpen(true)}>
          <IconPlus /> 记录体重
        </button>
      </header>

      <a class="card-link" href={href('/me/profile')}>
        <span class="icon-tile"><IconUser size={22} /></span>
        <span class="row-plain-text">
          <b class="num">{p.sex === 'male' ? '男' : '女'} · {p.age} 岁 · {p.heightCm} cm</b>
          <span class="muted num">{ACTIVITY[p.activity].short} · {GOALS[p.goal]} · 每日上限 {limit.toLocaleString('en-US')} kcal</span>
        </span>
        <span class="link-accent">编辑<IconChevronRight size={16} /></span>
      </a>

      {focus && (
        <section class="chart-card" aria-labelledby="w-h">
          <div class="chart-card-head">
            <h2 id="w-h" class="chart-title">
              体重{entries.length > 1 && <> · 共 {entries.length} 条 <b class="num">{sign(totalDelta)}{kg(Math.abs(totalDelta))} kg</b></>}
            </h2>
            {entries.length > 1 && <span class="chart-hint">点圆点，看当时的身材</span>}
          </div>
          <WeightChart entries={chartEntries} focus={focus} ghost={chartEntries[0]} onSelect={setSelId} />
        </section>
      )}

      {focus && (
        <section class="card" aria-labelledby="sel-h">
          <div class="card-head">
            <h2 id="sel-h" class="h3">{formatMD(focus.date)}</h2>
            <Chip kind="money">{prev ? `${sign(focus.weightKg - prev.weightKg)}${kg(Math.abs(focus.weightKg - prev.weightKg))} kg` : '首次记录'}</Chip>
          </div>
          <p class="weight-line">
            <span class="kcal-big num">{kg(focus.weightKg)}</span>
            <span class="muted num">
              kg · BMI {bmi(focus.weightKg, p.heightCm).toFixed(1)}
              {first && focus.id !== first.id ? ` · 比 ${formatMD(first.date)} ${sign(focus.weightKg - first.weightKg)}${kg(Math.abs(focus.weightKg - first.weightKg))} kg` : ''}
            </span>
          </p>
          <div class="grid4">
            {([['胸围', focus.chest], ['腰围', focus.waist], ['臀围', focus.hip], ['大腿围', focus.thigh]] as const).map(([l, v]) => (
              <div key={l} class="tile tile--static">
                <span class="tile-label">{l}</span>
                <span class="tile-value num">{v || '—'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="hist-h" class="stack">
        <div class="section-head">
          <h2 id="hist-h" class="section-title">历史记录</h2>
          <span class="small muted">按记录日期 · 共 {entries.length} 条</span>
        </div>
        <ul class="list">
          {[...entries].reverse().map((e, i, arr) => {
            const older = arr[i + 1];
            return (
              <li key={e.id} class={e.id === focus?.id ? 'list-row list-row--on' : 'list-row'}>
                <button type="button" class="list-row-btn" onClick={() => setSelId(e.id)}>
                  <span class="list-row-main">
                    <b class="num">{e.date}</b>
                    <span class="muted num">胸 {e.chest || '—'} · 腰 {e.waist || '—'} · 臀 {e.hip || '—'} · 腿 {e.thigh || '—'}</span>
                  </span>
                  <b class="num">{kg(e.weightKg)}</b>
                  <span class="delta num">{older ? `${sign(e.weightKg - older.weightKg)}${kg(Math.abs(e.weightKg - older.weightKg))}` : '—'}</span>
                </button>
                <button type="button" class="icon-btn" aria-label={`删除 ${e.date} 的记录`} disabled={entries.length <= 1} onClick={() => setDelId(e.id)}>
                  <IconTrash />
                </button>
              </li>
            );
          })}
        </ul>
        {entries.length > 1 && (
          <button type="button" class="btn btn-danger" onClick={() => setClearOpen(true)}>清除全部历史记录</button>
        )}
        <p class="note">最新一条会一直保留，用来计算每日热量。剪影按围度比例示意，不是照片。</p>
      </section>

      {recordOpen && <RecordSheet last={latest} onClose={() => setRecordOpen(false)} />}
      {clearOpen && (
        <Confirm
          title="清除全部历史记录？"
          message={`会删掉 ${entries.length - 1} 条旧记录，只保留最新一条（${latest ? formatMD(latest.date) : ''}）。删掉后不能恢复。`}
          confirmText="清除"
          danger
          onConfirm={() => {
            clearBodyHistory();
            setSelId(null);
            toast('历史记录已清除');
          }}
          onClose={() => setClearOpen(false)}
        />
      )}
      {delId && (
        <Confirm
          title="删除这条记录？"
          message="删掉后不能恢复。"
          confirmText="删除"
          danger
          onConfirm={() => {
            deleteBody(delId);
            setSelId(null);
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </main>
  );
}

function RecordSheet({ last, onClose }: { last?: BodyEntry; onClose: () => void }) {
  const today = getToday();
  const [date, setDate] = useState(today);
  const [w, setW] = useState(last?.weightKg ?? 65);
  const [chest, setChest] = useState(last?.chest ?? 0);
  const [waist, setWaist] = useState(last?.waist ?? 0);
  const [hip, setHip] = useState(last?.hip ?? 0);
  const [thigh, setThigh] = useState(last?.thigh ?? 0);
  const ok = Number.isFinite(w) && w > 25 && w < 300 && date <= today;
  const g = (v: number) => (Number.isFinite(v) ? v : 0);
  return (
    <Sheet title="记录体重和围度" onClose={onClose}>
      <div class="grid2">
        <div class="field">
          <label class="field-label" for="r-date">日期</label>
          <input id="r-date" class="input" type="date" max={today} value={date} onInput={(e) => setDate((e.currentTarget as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label" for="r-w">体重（kg）</label>
          <NumInput id="r-w" value={w} onChange={setW} step={0.1} wide />
        </div>
      </div>
      <div class="grid2">
        <div class="field"><label class="field-label" for="r-c">胸围（cm）</label><NumInput id="r-c" value={chest} onChange={setChest} step={0.5} wide /></div>
        <div class="field"><label class="field-label" for="r-wa">腰围（cm）</label><NumInput id="r-wa" value={waist} onChange={setWaist} step={0.5} wide /></div>
        <div class="field"><label class="field-label" for="r-h">臀围（cm）</label><NumInput id="r-h" value={hip} onChange={setHip} step={0.5} wide /></div>
        <div class="field"><label class="field-label" for="r-t">大腿围（cm）</label><NumInput id="r-t" value={thigh} onChange={setThigh} step={0.5} wide /></div>
      </div>
      <p class="note">同一天记两次，会用后一次覆盖。围度已按上次的数填好，没变就不用改。</p>
      <button
        type="button"
        class="btn btn-primary"
        disabled={!ok}
        onClick={() => {
          recordBody({ date, weightKg: Math.round(w * 10) / 10, chest: g(chest), waist: g(waist), hip: g(hip), thigh: g(thigh) });
          toast('已记录');
          onClose();
        }}
      >
        保存
      </button>
    </Sheet>
  );
}
