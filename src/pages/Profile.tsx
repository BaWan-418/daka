import { useState } from 'preact/hooks';
import type { ActivityLevel, Goal, Profile } from '../lib/types';
import { getToday, monthOf } from '../lib/dates';
import { go, useData } from '../lib/hooks';
import { ACTIVITY, GOALS, kcalBreakdown, latestBody } from '../lib/kcal';
import { rulesForMonth } from '../lib/rules';
import { DEFAULT_GIRTHS } from '../lib/defaults';
import { completeSetup, saveProfile } from '../lib/actions';
import { NumInput, Seg, SubBar } from '../components/ui';
import { toast } from '../components/Toast';

export interface ProfileFormValue {
  profile: Profile;
  weightKg: number;
  girths?: { chest: number; waist: number; hip: number; thigh: number };
}

function ProfileForm({ initial, withGirths, submitLabel, onSubmit }: { initial: ProfileFormValue; withGirths: boolean; submitLabel: string; onSubmit: (v: ProfileFormValue) => void }) {
  const data = useData();
  const rules = rulesForMonth(data, monthOf(getToday()));
  const [p, setP] = useState<Profile>(initial.profile);
  const [w, setW] = useState(initial.weightKg);
  const [g, setG] = useState(initial.girths ?? DEFAULT_GIRTHS[initial.profile.sex]);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP({ ...p, [k]: v });
  const ok = p.age >= 12 && p.age <= 100 && p.heightCm >= 120 && p.heightCm <= 230 && w >= 25 && w <= 300;
  const k = ok ? kcalBreakdown(p, w, rules) : null;

  return (
    <>
      <section class="stack" aria-labelledby="basic-h">
        <h2 id="basic-h" class="section-title">基础信息</h2>
        <div class="list">
          <div class="form-row">
            <span class="form-label">性别</span>
            <Seg label="性别" value={p.sex} options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }]} onChange={(v) => set('sex', v)} />
          </div>
          <div class="form-row">
            <label class="form-label" for="p-age">年龄</label>
            <NumInput id="p-age" value={p.age} onChange={(v) => set('age', v)} />
            <span class="unit">岁</span>
          </div>
          <div class="form-row">
            <label class="form-label" for="p-h">身高</label>
            <NumInput id="p-h" value={p.heightCm} onChange={(v) => set('heightCm', v)} step={0.5} />
            <span class="unit">cm</span>
          </div>
          <div class="form-row">
            <label class="form-label" for="p-w">
              体重
              {!withGirths && <span class="form-sub">改了会记进体重历史</span>}
            </label>
            <NumInput id="p-w" value={w} onChange={setW} step={0.1} />
            <span class="unit">kg</span>
          </div>
          <div class="form-row">
            <label class="form-label" for="p-act">日常活动量</label>
            <select id="p-act" class="input input--inline" value={p.activity} onChange={(e) => set('activity', (e.currentTarget as HTMLSelectElement).value as ActivityLevel)}>
              {(Object.keys(ACTIVITY) as ActivityLevel[]).map((a) => (
                <option key={a} value={a}>{ACTIVITY[a].label}</option>
              ))}
            </select>
          </div>
          <div class="form-row">
            <span class="form-label">目标</span>
            <Seg label="目标" value={p.goal} options={(Object.keys(GOALS) as Goal[]).map((gk) => ({ value: gk, label: GOALS[gk] }))} onChange={(v) => set('goal', v)} />
          </div>
        </div>
      </section>

      {withGirths && (
        <section class="stack" aria-labelledby="girth-h">
          <div class="section-head">
            <h2 id="girth-h" class="section-title">围度</h2>
            <span class="small muted">用来画身材剪影，大概量一下就行</span>
          </div>
          <div class="card grid2">
            <div class="field"><label class="field-label" for="g-c">胸围（cm）</label><NumInput id="g-c" value={g.chest} onChange={(v) => setG({ ...g, chest: v })} step={0.5} wide /></div>
            <div class="field"><label class="field-label" for="g-w">腰围（cm）</label><NumInput id="g-w" value={g.waist} onChange={(v) => setG({ ...g, waist: v })} step={0.5} wide /></div>
            <div class="field"><label class="field-label" for="g-h">臀围（cm）</label><NumInput id="g-h" value={g.hip} onChange={(v) => setG({ ...g, hip: v })} step={0.5} wide /></div>
            <div class="field"><label class="field-label" for="g-t">大腿围（cm）</label><NumInput id="g-t" value={g.thigh} onChange={(v) => setG({ ...g, thigh: v })} step={0.5} wide /></div>
          </div>
        </section>
      )}

      <section class="stack" aria-labelledby="kcal-h">
        <h2 id="kcal-h" class="section-title">每日热量推算</h2>
        <div class="card">
          {k ? (
            <>
              <p class="kcal-row">
                <span class="kcal-big num">{k.limit.toLocaleString('en-US')}</span>
                <span class="muted">kcal / 天</span>
              </p>
              {k.manual ? (
                <p class="note">审批人设置了固定上限，不按身体数据推算。</p>
              ) : (
                <dl class="calc">
                  <div><dt>基础代谢（BMR）</dt><dd class="num">{Math.round(k.bmr).toLocaleString('en-US')} kcal</dd></div>
                  <div><dt>× 活动系数 {ACTIVITY[p.activity].factor}（日常消耗）</dt><dd class="num">{Math.round(k.tdee).toLocaleString('en-US')} kcal</dd></div>
                  <div><dt>× {GOALS[p.goal]} {Math.round(k.goalFactor * 100)}%</dt><dd class="num">{Math.round(k.raw).toLocaleString('en-US')} kcal</dd></div>
                  <div class="calc-total"><dt>取整到 50</dt><dd class="num">{k.limit.toLocaleString('en-US')} kcal</dd></div>
                </dl>
              )}
              <p class="note">按 Mifflin-St Jeor 公式估算。改了信息会重新计算，新上限从第二天开始用。</p>
            </>
          ) : (
            <p class="note">把年龄、身高、体重填完整，就能算出每日热量上限。</p>
          )}
        </div>
      </section>

      <button type="button" class="btn btn-primary btn-big" disabled={!ok} onClick={() => onSubmit({ profile: p, weightKg: Math.round(w * 10) / 10, girths: withGirths ? g : undefined })}>
        {submitLabel}
      </button>
    </>
  );
}

export function ProfilePage() {
  const data = useData();
  const last = latestBody(data);
  return (
    <main class="screen screen--plain">
      <SubBar title="编辑个人信息" back="/me" backLabel="返回我的" />
      <p class="note">这些信息自己就能改，不需要审批人。</p>
      <ProfileForm
        initial={{ profile: data.profile, weightKg: last?.weightKg ?? 65 }}
        withGirths={false}
        submitLabel="保存"
        onSubmit={(v) => {
          saveProfile(v.profile, v.weightKg);
          toast('已保存');
          go('/me');
        }}
      />
    </main>
  );
}

export function SetupPage() {
  return (
    <main class="screen screen--plain">
      <header class="setup-head">
        <h1 class="h1">开始之前</h1>
        <p class="muted">先填一下身体数据，App 会按它算出你每天的热量上限。之后随时可以在「我的」里改。</p>
      </header>
      <ProfileForm
        initial={{ profile: { sex: 'male', age: 30, heightCm: 172, activity: 'light', goal: 'cut' }, weightKg: 70 }}
        withGirths
        submitLabel="开始打卡"
        onSubmit={(v) => {
          completeSetup(v.profile, { weightKg: v.weightKg, ...(v.girths ?? DEFAULT_GIRTHS[v.profile.sex]) });
          toast('从今天开始算');
          go('/today');
        }}
      />
    </main>
  );
}
