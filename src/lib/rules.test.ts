import { describe, expect, it } from 'vitest';
import { demoData } from './demo';
import { cheatCountInWeek, dietCounts, evalDiet, heroFor, monthStats, rulesForMonth, settle, trackBonus } from './rules';
import { defaultRules } from './defaults';

const TODAY = '2026-11-26';

describe('每月统计（演示数据，和设计稿一致）', () => {
  it('饮食 16 天、训练 13 天，2 天待审核，4 个放纵日', () => {
    const s = monthStats(demoData(), '2026-11', TODAY);
    expect(s.dietDays).toBe(16);
    expect(s.trainingDays).toBe(13);
    expect(s.dietPending).toBe(2);
    expect(s.dietCheat).toBe(4);
    expect(s.dietFail).toBe(2);
    expect(s.dietMissing).toBe(1);
    expect(s.dietSlots).toBe(5); // 26–30 号
    expect(s.trainingSlots).toBe(4); // 今天已达标，只剩 27–30 号
  });

  it('今天的饮食还没结束，不计入', () => {
    const d = demoData();
    const ev = evalDiet(d, TODAY, TODAY, 1800);
    expect(ev.status).toBe('today');
    expect(ev.kcal).toBe(1115);
    expect(dietCounts(ev.status)).toBe(false);
  });

  it('放纵日不算达标，批准的豁免算达标', () => {
    const d = demoData();
    expect(evalDiet(d, '2026-11-07', TODAY, 1800).status).toBe('cheat');
    expect(dietCounts('cheat')).toBe(false);
    d.days['2026-11-25'].exemption!.status = 'approved';
    expect(evalDiet(d, '2026-11-25', TODAY, 1800).status).toBe('exempt');
    expect(monthStats(d, '2026-11', TODAY).dietDays).toBe(17);
  });

  it('驳回的豁免按原样判定', () => {
    const d = demoData();
    d.days['2026-11-25'].exemption!.status = 'rejected';
    expect(evalDiet(d, '2026-11-25', TODAY, 1800).status).toBe('fail');
  });
});

describe('奖金规则', () => {
  const r = defaultRules();

  it('每一项按天数算', () => {
    expect(trackBonus(17, r.diet)).toBe(0);
    expect(trackBonus(18, r.diet)).toBe(750);
    expect(trackBonus(21, r.diet)).toBe(900);
    expect(trackBonus(22, r.diet)).toBe(950);
    expect(trackBonus(30, r.diet)).toBe(950);
    expect(trackBonus(15, r.training)).toBe(750);
    expect(trackBonus(19, r.training)).toBe(990);
    expect(trackBonus(20, r.training)).toBe(1050);
  });

  it('两项合并结算', () => {
    expect(settle(18, 15, r).total).toBe(1500);
    expect(settle(22, 20, r).total).toBe(2000);
    expect(settle(30, 30, r).total).toBe(2000);
    expect(settle(22, 15, r).total).toBe(1700);
    expect(settle(18, 20, r).total).toBe(1800);
    expect(settle(16, 12, r)).toMatchObject({ total: 0, result: 'none' });
    expect(settle(25, 9, r)).toMatchObject({ total: 0, result: 'none' }); // 只有一项合格
    expect(settle(14, 9, r)).toMatchObject({ total: -500, result: 'fine' });
  });
});

describe('规则从下个月生效', () => {
  it('本月用旧规则，下个月用新规则', () => {
    const d = demoData();
    const next = { ...defaultRules(), trainingMinMinutes: 50 };
    d.ruleVersions.push({ effectiveFrom: '2026-12', rules: next, savedAt: '' });
    expect(rulesForMonth(d, '2026-11').trainingMinMinutes).toBe(45);
    expect(rulesForMonth(d, '2026-12').trainingMinMinutes).toBe(50);
    expect(rulesForMonth(d, '2027-03').trainingMinMinutes).toBe(50);
  });
});

describe('放纵日每周次数', () => {
  it('按周一到周日数', () => {
    const d = demoData();
    expect(cheatCountInWeek(d, '2026-11-26')).toBe(0);
    expect(cheatCountInWeek(d, '2026-11-21')).toBe(1);
    expect(cheatCountInWeek(d, '2026-11-16')).toBe(1);
  });
});

describe('今日页奖金卡', () => {
  it('还没到奖励线：再坚持 2 天拿 ¥1,500', () => {
    const h = heroFor(demoData(), '2026-11', TODAY);
    expect(h.kind).toBe('before');
    if (h.kind === 'before') {
      expect(h.amount).toBe(1500);
      expect(h.needDays).toBe(2);
    }
  });

  it('饮食离合格线太近：提醒', () => {
    const d = demoData();
    for (const day of ['02', '03', '04', '05', '06']) delete d.days[`2026-11-${day}`];
    const h = heroFor(d, '2026-11', TODAY);
    expect(h.kind).toBe('warning');
    if (h.kind === 'warning') expect(h.risky.map((t) => t.key)).toEqual(['diet']);
  });

  it('训练过了奖励线：显示已拿下的钱', () => {
    const d = demoData();
    for (const day of ['03', '05']) d.days[`2026-11-${day}`].workouts.push({ id: day, type: '跑步', minutes: 60, createdAt: '' });
    const h = heroFor(d, '2026-11', TODAY);
    expect(h.kind).toBe('earning');
    if (h.kind === 'earning') {
      expect(h.banked).toBe(750);
      expect(h.qualified).toBe(true);
      expect(h.todayGain).toBe(0); // 今天训练已经达标
    }
  });

  it('过去的月份显示结算', () => {
    const h = heroFor(demoData(), '2026-11', '2026-12-02');
    expect(h.kind).toBe('closed');
    if (h.kind === 'closed') {
      expect(h.dietDays).toBe(17); // 26 号最后没超标，27–30 号没记录
      expect(h.pending).toBe(2);
      expect(h.result.result).toBe('none');
    }
  });
});
