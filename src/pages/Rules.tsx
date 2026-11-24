import { useRef, useState } from 'preact/hooks';
import { addMonths, formatMonthOnly, getToday, monthOf } from '../lib/dates';
import { href, useData } from '../lib/hooks';
import { currentLimit } from '../lib/kcal';
import { rulesForMonth, trackMax } from '../lib/rules';
import { diffRules } from '../lib/rulesDiff';
import { exportBackup, importBackup, setTheme } from '../lib/actions';
import { Confirm } from '../components/Sheet';
import { Chip, Seg, money } from '../components/ui';
import { IconEye, IconShield } from '../components/Icons';
import { toast } from '../components/Toast';

async function shareOrDownload(text: string, name: string) {
  const file = new File([text], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name });
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export function RulesPage() {
  const data = useData();
  const today = getToday();
  const ym = monthOf(today);
  const next = addMonths(ym, 1);
  const r = rulesForMonth(data, ym);
  const changes = diffRules(r, rulesForMonth(data, next));
  const limit = currentLimit(data, r);
  const pending = Object.entries(data.days).filter(([d, rec]) => rec.exemption?.status === 'pending' && !data.settlements[monthOf(d)]).length;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState<string | null>(null);

  return (
    <main class="screen">
      <h1 class="h1">规则</h1>

      <a class="reviewer-card" href={href('/reviewer')}>
        <span class="reviewer-icon"><IconShield /></span>
        <span class="row-plain-text">
          <b>审批人界面</b>
          <span>审核豁免 · 确认结算 · 修改规则（需密码）</span>
        </span>
        {pending > 0 && <Chip kind="pending">{pending} 条待审</Chip>}
      </a>

      <section class="stack" aria-labelledby="theme-h">
        <h2 id="theme-h" class="section-title">配色</h2>
        <div class="card card--pad-sm">
          <Seg
            label="配色"
            value={data.theme}
            onChange={setTheme}
            options={[
              { value: 'gold', label: <><i class="swatch swatch--gold" aria-hidden="true" />黑金</> },
              { value: 'red', label: <><i class="swatch swatch--red" aria-hidden="true" />红金</> },
            ]}
          />
        </div>
      </section>

      <p class="notice">
        <IconEye />
        <span>以下规则只能查看。要修改，请让审批人进入审批人界面；改动从下个月 1 号起生效。</span>
      </p>

      {changes.length > 0 && (
        <div class="banner banner--accent">
          <b>{formatMonthOnly(next)} 1 日起生效的新规则</b>
          <ul>
            {changes.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}

      <section class="stack" aria-labelledby="rd-diet">
        <h2 id="rd-diet" class="section-title">饮食 · 每日判定</h2>
        <div class="list">
          <a class="kv" href={href('/me')}><span>每日热量上限</span><span class="muted num">{limit.toLocaleString('en-US')} kcal · {r.kcalMode === 'manual' ? '审批人指定' : '按身体数据推算'}</span></a>
          <div class="kv"><span>放纵日</span><span class="muted">每周 {r.cheatDaysPerWeek} 天 · 当天标记</span></div>
          <div class="kv"><span>放纵日热量上限</span><span class="muted">不限</span></div>
          <div class="kv"><span>达标认定</span><span class="muted">放纵日不算 · 批准的豁免算</span></div>
          <div class="kv"><span>没记录的日子</span><span class="muted">算不达标 <Chip kind="gray">固定</Chip></span></div>
          <div class="kv kv--stack">
            <div class="kv-head"><span>违禁类别</span><span class="muted">{r.categories.length} 类</span></div>
            <div class="chips">{r.categories.map((c) => <Chip key={c.id} kind="danger">{c.name}</Chip>)}</div>
          </div>
        </div>
      </section>

      <section class="stack" aria-labelledby="rd-train">
        <h2 id="rd-train" class="section-title">训练 · 每日判定</h2>
        <div class="list">
          <div class="kv"><span>单次达标时长</span><span class="muted num">≥ {r.trainingMinMinutes} 分钟</span></div>
          <div class="kv"><span>没记录的日子</span><span class="muted">算不达标 <Chip kind="gray">固定</Chip></span></div>
        </div>
      </section>

      <section class="stack" aria-labelledby="rd-tiers">
        <h2 id="rd-tiers" class="section-title">每月档位与奖金</h2>
        <div class="list">
          <table class="tiers num">
            <thead>
              <tr><th scope="col"><span class="sr-only">项目</span></th><th scope="col">合格</th><th scope="col" class="money">奖励线</th><th scope="col" class="money">封顶</th></tr>
            </thead>
            <tbody>
              {([['diet', '饮食'], ['training', '训练']] as const).map(([k, label]) => (
                <tr key={k}>
                  <th scope="row">{label}</th>
                  <td>≥ {r[k].pass} 天<small>¥0</small></td>
                  <td>{r[k].reward} 天<small class="money">{money(r[k].base)}</small></td>
                  <td>{r[k].cap} 天<small class="money">{money(trackMax(r[k]))}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="note">
          到奖励线先拿 {money(r.diet.base)} / {money(r.training.base)}，之后每多 1 天：饮食 +{money(r.diet.perDay)}、训练 +{money(r.training.perDay)}，到封顶线为止。
          两项都到奖励线共 {money(r.diet.base + r.training.base)}，都到封顶共 {money(trackMax(r.diet) + trackMax(r.training))}。
        </p>
      </section>

      <section class="stack" aria-labelledby="rd-settle">
        <h2 id="rd-settle" class="section-title">月底奖惩</h2>
        <div class="list">
          <div class="kv"><span>两项都合格</span><span><b class="good-text">不罚款</b> <span class="muted">各自按档位发奖金</span></span></div>
          <div class="kv"><span>只有一项合格</span><span class="muted">不奖不罚</span></div>
          <div class="kv"><span>两项都不合格</span><b class="danger-text">罚款 {money(r.fine)}</b></div>
          <div class="kv"><span>奖金上限</span><span class="muted num">每月 {money(trackMax(r.diet) + trackMax(r.training))}</span></div>
        </div>
      </section>

      <section class="stack" aria-labelledby="rd-data">
        <h2 id="rd-data" class="section-title">数据备份</h2>
        <div class="grid2">
          <button
            type="button"
            class="btn"
            onClick={async () => {
              const ok = await shareOrDownload(exportBackup(), `打卡备份-${today}.json`);
              if (ok) toast('备份已导出');
            }}
          >
            导出备份
          </button>
          <button type="button" class="btn" onClick={() => fileRef.current?.click()}>导入备份</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          class="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={async (e) => {
            const input = e.currentTarget as HTMLInputElement;
            const f = input.files?.[0];
            input.value = '';
            if (f) setImportText(await f.text());
          }}
        />
        <p class="note">不需要密码。数据只存在这台手机上，建议每月导出一次。</p>
      </section>

      {importText !== null && (
        <Confirm
          title="导入这份备份？"
          message="导入会覆盖这台手机上现在的全部数据，不能撤销。导入这件事会留下记录给审批人看。"
          confirmText="覆盖并导入"
          danger
          onConfirm={() => {
            try {
              importBackup(importText);
              toast('导入成功');
            } catch (err) {
              toast(`导入失败：${(err as Error).message}`);
            }
          }}
          onClose={() => setImportText(null)}
        />
      )}
    </main>
  );
}
