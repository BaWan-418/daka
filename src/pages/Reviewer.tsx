import { useState } from 'preact/hooks';
import type { Rules, TrackRules } from '../lib/types';
import { addMonths, formatDateTime, formatMD, formatMonthOnly, formatYM, getToday, monthOf, weekdayLabel } from '../lib/dates';
import { go, href, useData } from '../lib/hooks';
import { currentLimit } from '../lib/kcal';
import { evalDiet, monthStats, rulesForMonth, settle, trackMax } from '../lib/rules';
import { checkPin, confirmMonth, reviewExemption, saveRules, setPin } from '../lib/actions';
import { Confirm } from '../components/Sheet';
import { Chip, NumInput, Seg, Stepper, money } from '../components/ui';
import { IconLock } from '../components/Icons';
import { toast } from '../components/Toast';

// 解锁状态只放在内存里：关掉 App 或点「退出」就要重新输密码
let unlocked = false;

export function ReviewerPage({ tab }: { tab: 'review' | 'rules' }) {
  const data = useData();
  const [ok, setOk] = useState(unlocked);
  if (!ok) {
    return (
      <PinGate
        hasPin={data.pinHash !== null}
        onUnlock={() => {
          unlocked = true;
          setOk(true);
        }}
      />
    );
  }
  return (
    <main class="screen screen--plain reviewer">
      <header class="rv-head">
        <div class="rv-top">
          <span class="rv-mode"><IconLock size={16} />审批人模式</span>
          <button
            type="button"
            class="rv-exit"
            onClick={() => {
              unlocked = false;
              go('/rules');
            }}
          >
            退出
          </button>
        </div>
        <h1 class="rv-title">{tab === 'review' ? '月度审核' : '规则设置'}</h1>
        <nav class="rv-tabs" aria-label="审批人功能">
          <a href={href('/reviewer')} aria-current={tab === 'review' ? 'page' : undefined}>月度审核</a>
          <a href={href('/reviewer/rules')} aria-current={tab === 'rules' ? 'page' : undefined}>规则设置</a>
        </nav>
      </header>
      {tab === 'review' ? <ReviewTab /> : <RulesTab />}
    </main>
  );
}

function PinGate({ hasPin, onUnlock }: { hasPin: boolean; onUnlock: () => void }) {
  const [pin, setPinText] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr] = useState('');
  const valid = /^\d{4,8}$/.test(pin);
  return (
    <main class="screen screen--plain">
      <header class="subbar">
        <a class="btn-text" href={href('/rules')}>‹ 返回</a>
      </header>
      <div class="gate">
        <span class="gate-icon"><IconLock size={28} /></span>
        <h1 class="h1">{hasPin ? '审批人密码' : '设置审批人密码'}</h1>
        <p class="muted">{hasPin ? '请审批人输入密码。' : '第一次使用，请审批人设置一个 4–8 位数字密码。打卡的人不要知道这个密码。'}</p>
        <form
          class="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (hasPin) {
              if (checkPin(pin)) onUnlock();
              else {
                setErr('密码不对');
                setPinText('');
              }
            } else {
              if (!valid) return setErr('请输入 4–8 位数字');
              if (pin !== pin2) return setErr('两次输入不一样');
              setPin(pin);
              toast('密码已设置');
              onUnlock();
            }
          }}
        >
          <label class="field-label" for="pin1">{hasPin ? '密码' : '新密码'}</label>
          <input id="pin1" class="input input--pin num" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onInput={(e) => { setPinText((e.currentTarget as HTMLInputElement).value); setErr(''); }} />
          {!hasPin && (
            <>
              <label class="field-label" for="pin2">再输一次</label>
              <input id="pin2" class="input input--pin num" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin2} onInput={(e) => { setPin2((e.currentTarget as HTMLInputElement).value); setErr(''); }} />
            </>
          )}
          {err && <p class="danger-text" role="alert">{err}</p>}
          <button type="submit" class="btn btn-primary btn-big" disabled={!valid}>{hasPin ? '进入' : '设置并进入'}</button>
        </form>
      </div>
    </main>
  );
}

function ReviewTab() {
  const data = useData();
  const today = getToday();
  const cur = monthOf(today);
  const startYM = monthOf(data.startDate);
  const firstOpen = (() => {
    for (let m = startYM; m < cur; m = addMonths(m, 1)) if (!data.settlements[m]) return m;
    return cur;
  })();
  const [ym, setYm] = useState(firstOpen);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const s = monthStats(data, ym, today);
  const r = s.rules;
  const res = settle(s.dietDays, s.trainingDays, r);
  const settled = data.settlements[ym];
  const limit = currentLimit(data, r);
  const withEx = s.days.filter((d) => data.days[d.date]?.exemption);
  const pending = withEx.filter((d) => data.days[d.date].exemption!.status === 'pending');
  const decided = withEx.filter((d) => data.days[d.date].exemption!.status !== 'pending');
  const ifApproved = settle(s.dietDays + pending.length, s.trainingDays, r);
  const audit = data.audit.filter((a) => monthOf(a.day) === ym).sort((a, b) => b.at.localeCompare(a.at));
  const canConfirm = ym < cur && pending.length === 0 && !settled;

  const resultText = res.result === 'fine' ? `两项都不合格 · 罚款 ${money(r.fine)}` : res.result === 'bonus' ? `两项都合格 · 奖金 ${money(res.total)}` : res.dietOk && res.trainOk ? '两项都合格 · 没到奖励线' : '只有一项合格 · 不奖不罚';

  return (
    <div class="stack-lg">
      <div class="monthnav monthnav--wide">
        <button type="button" class="btn-square" aria-label="上个月" disabled={ym <= startYM} onClick={() => setYm(addMonths(ym, -1))}>‹</button>
        <span class="monthnav-label">{formatYM(ym)}{settled ? ' · 已结算' : ym === cur ? ' · 进行中' : ''}</span>
        <button type="button" class="btn-square" aria-label="下个月" disabled={ym >= cur} onClick={() => setYm(addMonths(ym, 1))}>›</button>
      </div>

      <section class="stack" aria-labelledby="rv-pending">
        <h2 id="rv-pending" class="section-title">待审核豁免（{pending.length}）</h2>
        {pending.length === 0 && <p class="note">这个月没有待审核的豁免。</p>}
        {pending.map(({ date }) => {
          const ex = data.days[date].exemption!;
          const ev = evalDiet(data, date, today, limit);
          return (
            <article key={date} class="card" aria-labelledby={`ex-${date}`}>
              <div class="card-head">
                <h3 id={`ex-${date}`} class="h3">{formatMD(date)} {weekdayLabel(date)}</h3>
                <Chip kind="pending">待审核</Chip>
              </div>
              <p class="muted num">
                {ev.kcal.toLocaleString('en-US')} kcal{ev.over > 0 ? `（超出 ${ev.over}）` : ''}
                {ev.forbidden.length > 0 ? ` · 违禁：${ev.forbidden.map((f) => f.name).join('、')}` : ''}
              </p>
              <p class="quote">理由：{ex.reason}</p>
              <div class="field">
                <label class="field-label" for={`note-${date}`}>审核备注（可选）</label>
                <input id={`note-${date}`} class="input" value={notes[date] ?? ''} placeholder="例如：下次提前说明" onInput={(e) => setNotes({ ...notes, [date]: (e.currentTarget as HTMLInputElement).value })} />
              </div>
              <div class="grid2">
                <button type="button" class="btn btn-reject" disabled={Boolean(settled)} onClick={() => { reviewExemption(date, false, notes[date] ?? ''); toast('已驳回'); }}>驳回</button>
                <button type="button" class="btn btn-primary" disabled={Boolean(settled)} onClick={() => { reviewExemption(date, true, notes[date] ?? ''); toast('已批准'); }}>批准豁免</button>
              </div>
            </article>
          );
        })}
      </section>

      {decided.length > 0 && (
        <section class="stack" aria-labelledby="rv-decided">
          <h2 id="rv-decided" class="section-title">已处理</h2>
          <ul class="list">
            {decided.map(({ date }) => {
              const ex = data.days[date].exemption!;
              const approved = ex.status === 'approved';
              return (
                <li key={date} class="list-row">
                  <span class="list-row-main">
                    <b>{formatMD(date)} · {ex.reason}</b>
                    {ex.note && <span class="muted">备注：{ex.note}</span>}
                  </span>
                  <Chip kind={approved ? 'pass' : 'fail'}>{approved ? '已批准' : '已驳回'}</Chip>
                  {!settled && (
                    <button type="button" class="btn-text" onClick={() => reviewExemption(date, !approved, ex.note ?? '')}>改判</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section class="stack" aria-labelledby="rv-settle">
        <h2 id="rv-settle" class="section-title">{ym === cur ? '本月结算预览' : '结算'}</h2>
        <div class="list">
          <div class="kv kv--tall">
            <span class="list-row-main"><b class="num">饮食 · 达标 {s.dietDays} 天</b><span class="muted">放纵日不计入{s.dietPending ? ` · ${s.dietPending} 天待审核` : ''}</span></span>
            <Chip kind={res.dietOk ? 'pass' : 'fail'}>{res.dietOk ? '合格' : '不合格'}</Chip>
          </div>
          <div class="kv kv--tall">
            <span class="list-row-main"><b class="num">训练 · 达标 {s.trainingDays} 天</b><span class="muted num">合格线 {r.training.pass} 天 · 奖励线 {r.training.reward} 天</span></span>
            <Chip kind={res.trainOk ? 'pass' : 'fail'}>{res.trainOk ? '合格' : '不合格'}</Chip>
          </div>
          <div class="kv kv--tall kv--sum">
            <b>{resultText}</b>
            <Chip kind={res.total > 0 ? 'money' : res.total < 0 ? 'fail' : 'gray'}>{res.total < 0 ? `罚 ${money(-res.total)}` : `奖金 ${money(res.total)}`}</Chip>
          </div>
        </div>
        {pending.length > 0 && ifApproved.total !== res.total && (
          <p class="note">如果 {pending.length} 条豁免都批准，饮食变成 {s.dietDays + pending.length} 天，结果是 {ifApproved.total < 0 ? `罚 ${money(-ifApproved.total)}` : `奖金 ${money(ifApproved.total)}`}。</p>
        )}
      </section>

      <section class="stack" aria-labelledby="rv-audit">
        <h2 id="rv-audit" class="section-title">事后修改记录（{audit.length}）</h2>
        {audit.length === 0 ? (
          <p class="note">没有过了当天再补录或修改的记录。</p>
        ) : (
          <ul class="list">
            {audit.map((a) => (
              <li key={a.id} class="list-row">
                <span class="list-row-main">
                  <b>{a.text}</b>
                  <span class="muted num">{formatDateTime(a.at)} 操作</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {settled ? (
        <p class="banner">已于 {formatDateTime(settled.confirmedAt)} 确认，这个月的记录已锁定。</p>
      ) : (
        <div class="stack">
          <button type="button" class="btn btn-primary btn-big" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>确认 {formatMonthOnly(ym)}结算</button>
          <p class="note center">{ym >= cur ? '月底过完才能确认' : pending.length ? `先处理完 ${pending.length} 条待审核豁免` : '确认后这个月的记录会锁定，不能再改'}</p>
        </div>
      )}

      {confirmOpen && (
        <Confirm
          title={`确认 ${formatYM(ym)} 的结算？`}
          message={`${resultText}。确认后这个月的打卡记录和豁免结果都会锁定，不能再改。`}
          confirmText="确认结算"
          onConfirm={() => {
            confirmMonth(ym);
            toast('已确认结算');
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function TrackFields({ label, value, onChange }: { label: string; value: TrackRules; onChange: (t: TrackRules) => void }) {
  const set = (k: keyof TrackRules, v: number) => onChange({ ...value, [k]: v });
  return (
    <div class="list">
      <div class="kv kv--stack">
        <b>{label}</b>
        <div class="grid3">
          <label class="mini-field"><span>合格线（天）</span><NumInput value={value.pass} onChange={(v) => set('pass', v)} wide /></label>
          <label class="mini-field"><span>奖励线（天）</span><NumInput value={value.reward} onChange={(v) => set('reward', v)} wide /></label>
          <label class="mini-field"><span>封顶线（天）</span><NumInput value={value.cap} onChange={(v) => set('cap', v)} wide /></label>
        </div>
        <div class="grid2">
          <label class="mini-field"><span>到奖励线先拿（元）</span><NumInput value={value.base} onChange={(v) => set('base', v)} wide /></label>
          <label class="mini-field"><span>之后每多 1 天加（元）</span><NumInput value={value.perDay} onChange={(v) => set('perDay', v)} wide /></label>
        </div>
        <p class="note num">封顶时这一项共 {Number.isFinite(trackMax(value)) ? money(trackMax(value)) : '—'}</p>
      </div>
    </div>
  );
}

function validate(r: Rules): string | null {
  const ints = [r.cutPercent, r.manualKcal, r.cheatDaysPerWeek, r.trainingMinMinutes, r.fine, r.diet.pass, r.diet.reward, r.diet.cap, r.diet.base, r.diet.perDay, r.training.pass, r.training.reward, r.training.cap, r.training.base, r.training.perDay];
  if (ints.some((n) => !Number.isFinite(n) || n < 0)) return '有空着或者小于 0 的数字';
  for (const [t, l] of [[r.diet, '饮食'], [r.training, '训练']] as const) {
    if (!(t.pass >= 1 && t.pass <= t.reward && t.reward <= t.cap && t.cap <= 31)) return `${l}的天数要满足：合格线 ≤ 奖励线 ≤ 封顶线 ≤ 31`;
  }
  if (r.cutPercent < 50 || r.cutPercent > 100) return '减脂系数要在 50%–100% 之间';
  if (r.kcalMode === 'manual' && (r.manualKcal < 800 || r.manualKcal > 5000)) return '固定热量上限要在 800–5000 之间';
  if (r.categories.length === 0) return '至少保留一个违禁类别';
  return null;
}

function RulesTab() {
  const data = useData();
  const today = getToday();
  const next = addMonths(monthOf(today), 1);
  const [draft, setDraft] = useState<Rules>(() => JSON.parse(JSON.stringify(rulesForMonth(data, next))) as Rules);
  const [newCat, setNewCat] = useState('');
  const [pinA, setPinA] = useState('');
  const [pinB, setPinB] = useState('');
  const set = <K extends keyof Rules>(k: K, v: Rules[K]) => setDraft({ ...draft, [k]: v });
  const err = validate(draft);

  return (
    <div class="stack-lg">
      <p class="banner banner--accent">保存后从 {formatMonthOnly(next)} 1 日起生效，本月仍按原规则结算。</p>

      <section class="stack" aria-labelledby="rs-diet">
        <h2 id="rs-diet" class="section-title">饮食</h2>
        <div class="list">
          <div class="kv kv--stack">
            <span>每日热量上限</span>
            <Seg label="每日热量上限" value={draft.kcalMode} onChange={(v) => set('kcalMode', v)} options={[{ value: 'auto', label: '按身体数据推算' }, { value: 'manual', label: '手动指定' }]} />
          </div>
          {draft.kcalMode === 'auto' ? (
            <div class="form-row">
              <label class="form-label" for="rs-cut">减脂时按日常消耗的</label>
              <NumInput id="rs-cut" value={draft.cutPercent} onChange={(v) => set('cutPercent', v)} />
              <span class="unit">%</span>
            </div>
          ) : (
            <div class="form-row">
              <label class="form-label" for="rs-kcal">固定上限</label>
              <NumInput id="rs-kcal" value={draft.manualKcal} onChange={(v) => set('manualKcal', v)} />
              <span class="unit">kcal</span>
            </div>
          )}
          <div class="form-row">
            <span class="form-label">每周放纵日</span>
            <Stepper label="放纵日" value={draft.cheatDaysPerWeek} onChange={(v) => set('cheatDaysPerWeek', v)} min={0} max={3} format={(v) => `${v} 天`} />
          </div>
          <div class="form-row">
            <span class="form-label">没记录的日子</span>
            <span class="muted">算不达标</span>
            <Chip kind="gray"><IconLock size={11} />固定</Chip>
          </div>
          <div class="kv kv--stack">
            <span>违禁类别</span>
            <div class="chips">
              {draft.categories.map((c) => (
                <span key={c.id} class="chip chip--danger chip--removable">
                  {c.name}
                  <button type="button" aria-label={`删除 ${c.name}`} onClick={() => set('categories', draft.categories.filter((x) => x.id !== c.id))}>×</button>
                </span>
              ))}
            </div>
            <div class="field-row">
              <input class="input" aria-label="新的违禁类别" placeholder="新类别，例如：酒精" value={newCat} onInput={(e) => setNewCat((e.currentTarget as HTMLInputElement).value)} />
              <button
                type="button"
                class="btn btn-compact"
                disabled={!newCat.trim()}
                onClick={() => {
                  set('categories', [...draft.categories, { id: `c-${Date.now().toString(36)}`, name: newCat.trim() }]);
                  setNewCat('');
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="stack" aria-labelledby="rs-train">
        <h2 id="rs-train" class="section-title">训练</h2>
        <div class="list">
          <div class="form-row">
            <span class="form-label">单次达标时长</span>
            <Stepper label="达标时长" value={draft.trainingMinMinutes} onChange={(v) => set('trainingMinMinutes', v)} step={5} min={10} max={180} format={(v) => `${v} 分钟`} />
          </div>
        </div>
      </section>

      <section class="stack" aria-labelledby="rs-tiers">
        <h2 id="rs-tiers" class="section-title">档位与奖金</h2>
        <TrackFields label="饮食" value={draft.diet} onChange={(t) => set('diet', t)} />
        <TrackFields label="训练" value={draft.training} onChange={(t) => set('training', t)} />
        <div class="list">
          <div class="form-row">
            <label class="form-label" for="rs-fine">两项都不合格罚款</label>
            <NumInput id="rs-fine" value={draft.fine} onChange={(v) => set('fine', v)} />
            <span class="unit">元</span>
          </div>
          <div class="kv"><span>每月奖金上限（自动算出）</span><b class="money num">{err ? '—' : money(trackMax(draft.diet) + trackMax(draft.training))}</b></div>
        </div>
      </section>

      {err && <p class="danger-text" role="alert">{err}</p>}
      <button
        type="button"
        class="btn btn-primary btn-big"
        disabled={Boolean(err)}
        onClick={() => {
          saveRules(draft);
          toast(`已保存，${formatMonthOnly(next)} 1 日起生效`);
        }}
      >
        保存规则
      </button>

      <section class="stack" aria-labelledby="rs-pin">
        <h2 id="rs-pin" class="section-title">修改审批人密码</h2>
        <div class="list">
          <div class="form-row">
            <label class="form-label" for="np1">新密码</label>
            <input id="np1" class="input input--inline num" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pinA} onInput={(e) => setPinA((e.currentTarget as HTMLInputElement).value)} />
          </div>
          <div class="form-row">
            <label class="form-label" for="np2">再输一次</label>
            <input id="np2" class="input input--inline num" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pinB} onInput={(e) => setPinB((e.currentTarget as HTMLInputElement).value)} />
          </div>
        </div>
        <button
          type="button"
          class="btn"
          disabled={!/^\d{4,8}$/.test(pinA) || pinA !== pinB}
          onClick={() => {
            setPin(pinA);
            setPinA('');
            setPinB('');
            toast('密码已修改');
          }}
        >
          修改密码
        </button>
      </section>
    </div>
  );
}
