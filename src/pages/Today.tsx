import { useState } from 'preact/hooks';
import type { MealKey } from '../lib/types';
import { MEALS, mealLabel } from '../lib/types';
import { addDays, daysInMonth, formatMD, formatTime, getToday, monthOf, weekdayLabel } from '../lib/dates';
import { href, useData } from '../lib/hooks';
import { currentLimit } from '../lib/kcal';
import type { DietEval, TrainEval } from '../lib/rules';
import { cheatCountInWeek, evalDiet, evalTraining, heroFor, isLocked, rulesForMonth } from '../lib/rules';
import { addWorkout, removeFood, removeWorkout, requestExemption, setCheat, withdrawExemption } from '../lib/actions';
import { WORKOUT_TYPES } from '../lib/foods';
import { BonusCard } from '../components/BonusCard';
import { Confirm, Sheet } from '../components/Sheet';
import { Chip, type ChipKind } from '../components/ui';
import { IconAlert, IconChevronLeft, IconChevronRight, IconDumbbell, IconPlus, IconTrash } from '../components/Icons';
import { toast } from '../components/Toast';

function dietChip(d: DietEval, atRisk: boolean): [ChipKind, string] {
  switch (d.status) {
    case 'today':
      if (d.violation) return ['fail', d.forbidden.length ? '吃了违禁食物' : `超出 ${d.over} kcal`];
      if (atRisk) return ['danger', '今天必须达标'];
      return ['gray', d.hasEntries ? '进行中 · 无违禁' : '还没记录'];
    case 'pass': return ['pass', '达标'];
    case 'fail': return ['fail', '不达标'];
    case 'cheat': return ['cheat', '放纵日'];
    case 'pending': return ['pending', '豁免待审核'];
    case 'exempt': return ['pass', '已豁免 · 算达标'];
    case 'missing': return ['fail', '没记录 · 不达标'];
    default: return ['gray', '开始之前'];
  }
}

function trainChip(t: TrainEval, min: number, atRisk: boolean): [ChipKind, string] {
  switch (t.status) {
    case 'pass': return ['pass', '已达标'];
    case 'partial': return ['gray', `最长 ${t.best} 分钟 · 不够 ${min}`];
    case 'today-none': return atRisk ? ['danger', '今天必须达标'] : ['gray', '还没训练'];
    case 'none': return ['fail', '没训练'];
    default: return ['gray', '开始之前'];
  }
}

export function TodayPage({ date: dateParam }: { date?: string }) {
  const data = useData();
  const today = getToday();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today ? dateParam : today;
  const isToday = date === today;
  const ym = monthOf(date);
  const rules = rulesForMonth(data, ym);
  const diet = evalDiet(data, date, today, currentLimit(data, rules));
  const train = evalTraining(data, date, today, rules);
  const hero = heroFor(data, ym, today);
  const rec = data.days[date];
  const locked = isLocked(data, date);
  const editable = !locked && date >= data.startDate;
  const cheatLeft = Math.max(0, rules.cheatDaysPerWeek - cheatCountInWeek(data, date));
  const atRisk = (key: string) => hero.kind === 'warning' && isToday && hero.risky.some((t) => t.key === key && !t.lost);
  const catName = (id: string | null) => rules.categories.find((c) => c.id === id)?.name ?? '违禁类';

  const [mealOpen, setMealOpen] = useState<MealKey | null>(null);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [exemptOpen, setExemptOpen] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const daysLeft = daysInMonth(ym) - Number(date.slice(8)) + 1;
  const [dk, dt] = dietChip(diet, atRisk('diet'));
  const [tk, tt] = trainChip(train, rules.trainingMinMinutes, atRisk('training'));
  const pct = Math.min(100, (diet.kcal / Math.max(1, diet.limit)) * 100);

  return (
    <main class="screen">
      <header class="datebar">
        <a class="icon-btn" href={href(`/today/${prev}`)} aria-label="前一天">
          <IconChevronLeft />
        </a>
        <div class="datebar-title">
          <h1>{formatMD(date)} {weekdayLabel(date)}</h1>
          <p>
            {isToday ? `今天 · 本月还剩 ${daysLeft} 天` : locked ? '这个月已结算，只能查看' : date < data.startDate ? '开始打卡之前' : <a href={href('/today')}>回到今天</a>}
          </p>
        </div>
        {isToday ? (
          <span class="icon-btn" aria-hidden="true" />
        ) : (
          <a class="icon-btn" href={href(next >= today ? '/today' : `/today/${next}`)} aria-label="后一天">
            <IconChevronRight />
          </a>
        )}
      </header>

      <BonusCard hero={hero} />

      <section class="card" aria-labelledby="diet-h">
        <div class="card-head">
          <h2 id="diet-h" class="h2">饮食</h2>
          <Chip kind={dk}>{dt}</Chip>
        </div>
        <div class="kcal-row">
          <span class="kcal-big num">{diet.kcal.toLocaleString('en-US')}</span>
          <span class="muted">/ {diet.limit.toLocaleString('en-US')} kcal</span>
          {diet.over > 0 ? (
            <span class="kcal-left kcal-left--bad num">超出 {diet.over}</span>
          ) : (
            <span class="kcal-left num">还可吃 {diet.limit - diet.kcal}</span>
          )}
        </div>
        <div class="bar" role="img" aria-label={`已吃到上限的 ${Math.round(pct)}%`}>
          <div class={diet.violation ? 'bar-fill bar-fill--bad' : 'bar-fill'} style={{ width: `${pct}%` }} />
        </div>
        {diet.forbidden.length > 0 && (
          <p class="warn-line">
            <IconAlert size={16} />
            违禁：{diet.forbidden.map((f) => `${f.name}（${catName(f.categoryId)}）`).join('、')}
          </p>
        )}
        <div class="grid4">
          {MEALS.map(({ key, label }) => {
            const items = rec?.meals[key] ?? [];
            const sum = items.reduce((s, e) => s + e.kcal, 0);
            if (items.length === 0 && editable) {
              return (
                <a key={key} class="tile tile--add" href={href(`/add/${date}/${key}`)}>
                  <span class="tile-label">{label}</span>
                  <span class="tile-value">+ 添加</span>
                </a>
              );
            }
            return (
              <button key={key} type="button" class="tile" onClick={() => items.length && setMealOpen(key)} disabled={!items.length}>
                <span class="tile-label">{label}</span>
                <span class={items.length ? 'tile-value num' : 'tile-value muted'}>{items.length ? sum : '—'}</span>
              </button>
            );
          })}
        </div>

        {rec?.exemption && (
          <div class="info-box">
            <div class="info-box-head">
              <span>豁免申请</span>
              <Chip kind={rec.exemption.status === 'approved' ? 'pass' : rec.exemption.status === 'rejected' ? 'fail' : 'pending'}>
                {rec.exemption.status === 'approved' ? '已批准' : rec.exemption.status === 'rejected' ? '已驳回' : '待审核'}
              </Chip>
            </div>
            <p>理由：{rec.exemption.reason}</p>
            {rec.exemption.note && <p class="muted">审批人备注：{rec.exemption.note}</p>}
          </div>
        )}

        {isToday && editable && (
          <div class="grid2">
            {rec?.cheat ? (
              <button type="button" class="btn" onClick={() => setCheat(date, false)}>取消放纵日</button>
            ) : (
              <button type="button" class="btn" disabled={cheatLeft === 0} onClick={() => setCheatOpen(true)}>
                设为放纵日 <span class="btn-sub">剩 {cheatLeft} 次</span>
              </button>
            )}
            {!rec?.exemption ? (
              <button type="button" class="btn" onClick={() => setExemptOpen(true)}>申请豁免</button>
            ) : rec.exemption.status === 'pending' ? (
              <button type="button" class="btn" onClick={() => withdrawExemption(date)}>撤回豁免</button>
            ) : (
              <button type="button" class="btn" disabled>豁免已处理</button>
            )}
          </div>
        )}
      </section>

      <section class="card" aria-labelledby="train-h">
        <div class="card-head">
          <h2 id="train-h" class="h2">训练</h2>
          <Chip kind={tk}>{tt}</Chip>
        </div>
        {(rec?.workouts ?? []).length === 0 ? (
          <div class="row-plain">
            <span class="icon-tile"><IconDumbbell /></span>
            <span class="row-plain-text">
              <b>{isToday ? '今天还没训练' : '这天没有训练记录'}</b>
              <span class="muted">单次练满 {rules.trainingMinMinutes} 分钟才算达标</span>
            </span>
          </div>
        ) : (
          <ul class="list-plain">
            {rec!.workouts.map((w) => (
              <li key={w.id} class="row-plain">
                <span class={w.minutes >= rules.trainingMinMinutes ? 'icon-tile icon-tile--pass' : 'icon-tile'}><IconDumbbell /></span>
                <span class="row-plain-text">
                  <b>{w.type} · {w.minutes} 分钟</b>
                  <span class="muted">{formatTime(w.createdAt)} 记录 · 达标线 {rules.trainingMinMinutes} 分钟</span>
                </span>
                {editable && (
                  <button type="button" class="icon-btn" aria-label={`删除 ${w.type} ${w.minutes} 分钟`} onClick={() => removeWorkout(date, w.id)}>
                    <IconTrash />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {editable && (
          <button type="button" class={train.status === 'pass' ? 'btn' : 'btn btn-primary'} onClick={() => setWorkoutOpen(true)}>
            <IconPlus /> 记录训练
          </button>
        )}
      </section>

      {mealOpen && (
        <Sheet title={`${formatMD(date)} ${mealLabel(mealOpen)}`} onClose={() => setMealOpen(null)}>
          <ul class="list">
            {(rec?.meals[mealOpen] ?? []).map((e) => (
              <li key={e.id} class="list-row">
                <span class="list-row-main">
                  <b>{e.name}</b>
                  <span class="muted">
                    {e.portion}{e.servings !== 1 ? ` × ${e.servings}` : ''} · {e.kcal} kcal
                  </span>
                </span>
                {e.categoryId && <Chip kind="danger">违禁 · {catName(e.categoryId)}</Chip>}
                {editable && (
                  <button type="button" class="icon-btn" aria-label={`删除 ${e.name}`} onClick={() => removeFood(date, mealOpen, e.id)}>
                    <IconTrash />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editable && (
            <a class="btn btn-primary" href={href(`/add/${date}/${mealOpen}`)}>
              <IconPlus /> 添加食物
            </a>
          )}
        </Sheet>
      )}

      {workoutOpen && <WorkoutSheet date={date} min={rules.trainingMinMinutes} onClose={() => setWorkoutOpen(false)} />}

      {exemptOpen && <ExemptionSheet date={date} onClose={() => setExemptOpen(false)} />}

      {cheatOpen && (
        <Confirm
          title="设为今天的放纵日？"
          message={`今天不受饮食限制，但不算饮食达标。每周 ${rules.cheatDaysPerWeek} 次，本周还剩 ${cheatLeft} 次。今天之内可以取消。`}
          confirmText="设为放纵日"
          onConfirm={() => {
            setCheat(date, true);
            toast('今天是放纵日');
          }}
          onClose={() => setCheatOpen(false)}
        />
      )}
    </main>
  );
}

function WorkoutSheet({ date, min, onClose }: { date: string; min: number; onClose: () => void }) {
  const [type, setType] = useState(WORKOUT_TYPES[0]);
  const [minutes, setMinutes] = useState<number>(min);
  const valid = Number.isFinite(minutes) && minutes > 0 && minutes <= 600;
  return (
    <Sheet title="记录训练" onClose={onClose}>
      <fieldset class="fieldset">
        <legend class="field-label">训练类型</legend>
        <div class="chip-grid">
          {WORKOUT_TYPES.map((t) => (
            <button key={t} type="button" class="pick" aria-pressed={t === type} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <div class="field">
        <label class="field-label" for="w-min">时长（分钟）</label>
        <div class="field-row">
          <input
            id="w-min"
            class="input num"
            type="number"
            inputMode="numeric"
            value={Number.isFinite(minutes) ? minutes : ''}
            onInput={(e) => setMinutes(parseInt((e.currentTarget as HTMLInputElement).value, 10))}
          />
          {[30, 45, 60, 90].map((m) => (
            <button key={m} type="button" class="pick" aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
              {m}
            </button>
          ))}
        </div>
        <p class="note">单次练满 {min} 分钟才算达标，同一天多次不累加。</p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        disabled={!valid}
        onClick={() => {
          addWorkout(date, type, minutes);
          toast(minutes >= min ? '训练已记录 · 今天达标' : '训练已记录');
          onClose();
        }}
      >
        保存
      </button>
    </Sheet>
  );
}

function ExemptionSheet({ date, onClose }: { date: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <Sheet title="申请饮食豁免" onClose={onClose}>
      <div class="field">
        <label class="field-label" for="ex-reason">理由</label>
        <textarea
          id="ex-reason"
          class="textarea"
          rows={3}
          placeholder="例如：客户应酬，没法选择餐食"
          value={reason}
          onInput={(e) => setReason((e.currentTarget as HTMLTextAreaElement).value)}
        />
        <p class="note">提交后是「待审核」，审批人每月统一审核。批准后这一天算饮食达标；审核前你可以撤回。</p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        disabled={reason.trim().length < 2}
        onClick={() => {
          requestExemption(date, reason.trim());
          toast('已提交，等审批人审核');
          onClose();
        }}
      >
        提交申请
      </button>
    </Sheet>
  );
}
