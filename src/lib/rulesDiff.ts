import type { Rules } from './types';

function kcalDesc(r: Rules): string {
  return r.kcalMode === 'manual' ? `固定 ${r.manualKcal} kcal` : '按身体数据推算';
}

/** 两版规则之间改了什么，用中文列出来 */
export function diffRules(a: Rules, b: Rules): string[] {
  const out: string[] = [];
  const n = (label: string, x: number, y: number, unit = '') => {
    if (x !== y) out.push(`${label}：${x}${unit} → ${y}${unit}`);
  };
  if (kcalDesc(a) !== kcalDesc(b)) out.push(`每日热量上限：${kcalDesc(a)} → ${kcalDesc(b)}`);
  n('减脂时按日常消耗的', a.cutPercent, b.cutPercent, '%');
  n('每周放纵日', a.cheatDaysPerWeek, b.cheatDaysPerWeek, ' 天');
  const an = a.categories.map((c) => c.name).join('、');
  const bn = b.categories.map((c) => c.name).join('、');
  if (an !== bn) out.push(`违禁类别改为：${bn || '无'}`);
  n('训练单次达标时长', a.trainingMinMinutes, b.trainingMinMinutes, ' 分钟');
  for (const [k, label] of [['diet', '饮食'], ['training', '训练']] as const) {
    n(`${label}合格线`, a[k].pass, b[k].pass, ' 天');
    n(`${label}奖励线`, a[k].reward, b[k].reward, ' 天');
    n(`${label}封顶线`, a[k].cap, b[k].cap, ' 天');
    n(`${label}起步奖金`, a[k].base, b[k].base, ' 元');
    n(`${label}每多 1 天加`, a[k].perDay, b[k].perDay, ' 元');
  }
  n('两项都不合格罚款', a.fine, b.fine, ' 元');
  return out;
}
