import type { AppData, DayRecord, FoodEntry, Rules, Settlement, TrackRules } from './types';
import { addDays, daysInMonth, monthDays, monthOf, weekStart } from './dates';
import { currentLimit } from './kcal';

// ───────── 规则版本：改动从下个月 1 号起生效 ─────────

export function rulesForMonth(data: AppData, ym: string): Rules {
  const versions = [...data.ruleVersions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let found = versions[0];
  for (const v of versions) if (v.effectiveFrom <= ym) found = v;
  return found.rules;
}

// ───────── 每天的判定 ─────────

export function dayEntries(rec?: DayRecord): FoodEntry[] {
  if (!rec) return [];
  return [...rec.meals.breakfast, ...rec.meals.lunch, ...rec.meals.snack, ...rec.meals.dinner];
}

export type DietStatus =
  | 'future'
  | 'before-start'
  | 'today'
  | 'missing'
  | 'cheat'
  | 'pending'
  | 'exempt'
  | 'pass'
  | 'fail';

export interface DietEval {
  status: DietStatus;
  kcal: number;
  limit: number;
  over: number;
  forbidden: FoodEntry[];
  hasEntries: boolean;
  violation: boolean;
}

export function evalDiet(data: AppData, date: string, today: string, fallbackLimit: number): DietEval {
  const rec = data.days[date];
  const entries = dayEntries(rec);
  const kcal = Math.round(entries.reduce((s, e) => s + e.kcal, 0));
  const limit = rec?.kcalLimit ?? fallbackLimit;
  const forbidden = entries.filter((e) => e.categoryId);
  const over = Math.max(0, kcal - limit);
  const violation = over > 0 || forbidden.length > 0;
  const hasEntries = entries.length > 0;
  const base = { kcal, limit, over, forbidden, hasEntries, violation };

  if (date > today) return { ...base, status: 'future' };
  if (date < data.startDate) return { ...base, status: 'before-start' };
  if (rec?.cheat) return { ...base, status: 'cheat' };
  if (rec?.exemption?.status === 'approved') return { ...base, status: 'exempt' };
  if (rec?.exemption?.status === 'pending') return { ...base, status: 'pending' };
  if (date === today) return { ...base, status: 'today' };
  if (!hasEntries) return { ...base, status: 'missing' };
  return { ...base, status: violation ? 'fail' : 'pass' };
}

/** 这一天算不算饮食达标（批准的豁免也算） */
export function dietCounts(status: DietStatus): boolean {
  return status === 'pass' || status === 'exempt';
}

export type TrainStatus = 'future' | 'before-start' | 'pass' | 'partial' | 'none' | 'today-none';

export interface TrainEval {
  status: TrainStatus;
  best: number;
}

export function evalTraining(data: AppData, date: string, today: string, rules: Rules): TrainEval {
  const rec = data.days[date];
  const best = Math.max(0, ...(rec?.workouts ?? []).map((w) => w.minutes));
  if (date > today) return { status: 'future', best };
  if (date < data.startDate) return { status: 'before-start', best };
  if (best >= rules.trainingMinMinutes) return { status: 'pass', best };
  if ((rec?.workouts.length ?? 0) > 0) return { status: 'partial', best };
  return { status: date === today ? 'today-none' : 'none', best };
}

export function cheatCountInWeek(data: AppData, date: string): number {
  const start = weekStart(date);
  let n = 0;
  for (let i = 0; i < 7; i++) if (data.days[addDays(start, i)]?.cheat) n++;
  return n;
}

export function isLocked(data: AppData, date: string): boolean {
  return Boolean(data.settlements[monthOf(date)]);
}
// ───────── 每月统计 ─────────

export interface DayEval {
  date: string;
  diet: DietEval;
  train: TrainEval;
}

export interface MonthStats {
  ym: string;
  rules: Rules;
  days: DayEval[];
  dietDays: number;
  dietPending: number;
  dietCheat: number;
  dietFail: number;
  dietMissing: number;
  trainingDays: number;
  isCurrent: boolean;
  isPast: boolean;
  /** 这个月还能争取饮食达标的天数（含今天） */
  dietSlots: number;
  /** 这个月还能争取训练达标的天数（今天已达标就不算今天） */
  trainingSlots: number;
  todayDietOpen: boolean;
  todayTrainingOpen: boolean;
  daysLeft: number;
}

export function monthStats(data: AppData, ym: string, today: string): MonthStats {
  const rules = rulesForMonth(data, ym);
  const limit = currentLimit(data, rules);
  const curYM = monthOf(today);
  const days = monthDays(ym).map((date) => ({
    date,
    diet: evalDiet(data, date, today, limit),
    train: evalTraining(data, date, today, rules),
  }));

  let dietDays = 0, dietPending = 0, dietCheat = 0, dietFail = 0, dietMissing = 0, trainingDays = 0;
  let dietSlots = 0, trainingSlots = 0;
  let todayDietOpen = false, todayTrainingOpen = false;

  for (const d of days) {
    const s = d.diet.status;
    if (dietCounts(s)) dietDays++;
    if (s === 'pending') dietPending++;
    if (s === 'cheat') dietCheat++;
    if (s === 'fail') dietFail++;
    if (s === 'missing') dietMissing++;
    if (s === 'today' || s === 'future') dietSlots++;
    if (s === 'today') todayDietOpen = true;

    const t = d.train.status;
    if (t === 'pass') trainingDays++;
    if (t === 'future') trainingSlots++;
    if (d.date === today && t !== 'pass' && t !== 'before-start') {
      trainingSlots++;
      todayTrainingOpen = true;
    }
  }

  const isCurrent = ym === curYM;
  const daysLeft = isCurrent ? daysInMonth(ym) - Number(today.slice(8, 10)) + 1 : ym > curYM ? daysInMonth(ym) : 0;

  return {
    ym, rules, days,
    dietDays, dietPending, dietCheat, dietFail, dietMissing, trainingDays,
    isCurrent, isPast: ym < curYM,
    dietSlots, trainingSlots, todayDietOpen, todayTrainingOpen, daysLeft,
  };
}

// ───────── 奖金与结算 ─────────

export function trackBonus(days: number, t: TrackRules): number {
  if (days < t.reward) return 0;
  return t.base + t.perDay * (Math.min(days, t.cap) - t.reward);
}

export function trackMax(t: TrackRules): number {
  return t.base + t.perDay * (t.cap - t.reward);
}

export interface SettleResult {
  dietOk: boolean;
  trainOk: boolean;
  dietBonus: number;
  trainBonus: number;
  total: number;
  result: Settlement['result'];
}

export function settle(dietDays: number, trainingDays: number, rules: Rules): SettleResult {
  const dietOk = dietDays >= rules.diet.pass;
  const trainOk = trainingDays >= rules.training.pass;
  const dietBonus = trackBonus(dietDays, rules.diet);
  const trainBonus = trackBonus(trainingDays, rules.training);
  if (dietOk && trainOk) {
    const total = dietBonus + trainBonus;
    return { dietOk, trainOk, dietBonus, trainBonus, total, result: total > 0 ? 'bonus' : 'none' };
  }
  if (!dietOk && !trainOk) {
    return { dietOk, trainOk, dietBonus, trainBonus, total: -rules.fine, result: 'fine' };
  }
  return { dietOk, trainOk, dietBonus, trainBonus, total: 0, result: 'none' };
}

// ───────── 今日页奖金卡 ─────────

export interface TrackHero {
  key: 'diet' | 'training';
  label: string;
  days: number;
  rules: TrackRules;
  bonus: number;
  needPass: number;
  needReward: number;
  reachedReward: boolean;
  atCap: boolean;
  slots: number;
  todayOpen: boolean;
  /** 今天达标能多拿的钱（只有过了奖励线才有） */
  perDayToday: number;
  /** 离合格线太近了 */
  risk: boolean;
  /** 剩下的天数已经不够合格了 */
  lost: boolean;
}

export type Hero =
  | { kind: 'before'; amount: number; needDays: number; tracks: TrackHero[] }
  | { kind: 'earning'; todayGain: number; banked: number; qualified: boolean; capLeft: number; totalMax: number; tracks: TrackHero[] }
  | { kind: 'warning'; tracks: TrackHero[]; risky: TrackHero[]; protect: number; fine: number }
  | { kind: 'closed'; ym: string; result: SettleResult; dietDays: number; trainingDays: number; confirmed: boolean; pending: number };

/** 离合格线只剩这么几天富余时，奖金卡变成提醒 */
export const RISK_MARGIN = 3;

function trackHero(key: TrackHero['key'], label: string, days: number, t: TrackRules, slots: number, todayOpen: boolean): TrackHero {
  const needPass = Math.max(0, t.pass - days);
  const needReward = Math.max(0, t.reward - days);
  const reachedReward = days >= t.reward;
  const atCap = days >= t.cap;
  return {
    key, label, days, rules: t,
    bonus: trackBonus(days, t),
    needPass, needReward, reachedReward, atCap, slots, todayOpen,
    perDayToday: todayOpen && reachedReward && !atCap ? t.perDay : 0,
    risk: needPass > 0 && slots - needPass <= RISK_MARGIN,
    lost: needPass > slots,
  };
}

export function heroFor(data: AppData, ym: string, today: string): Hero {
  const s = monthStats(data, ym, today);
  const r = s.rules;

  if (s.isPast) {
    const saved = data.settlements[ym];
    const result = settle(s.dietDays, s.trainingDays, r);
    return {
      kind: 'closed', ym,
      result: saved ? { ...result, dietBonus: saved.dietBonus, trainBonus: saved.trainingBonus, total: saved.total, result: saved.result } : result,
      dietDays: saved?.dietDays ?? s.dietDays,
      trainingDays: saved?.trainingDays ?? s.trainingDays,
      confirmed: Boolean(saved),
      pending: s.dietPending,
    };
  }

  const tracks = [
    trackHero('diet', '饮食', s.dietDays, r.diet, s.dietSlots, s.todayDietOpen),
    trackHero('training', '训练', s.trainingDays, r.training, s.trainingSlots, s.todayTrainingOpen),
  ];

  const risky = tracks.filter((t) => t.risk);
  if (risky.length > 0) {
    const protect = tracks.filter((t) => !t.risk).reduce((sum, t) => sum + t.bonus, 0);
    return { kind: 'warning', tracks, risky, protect, fine: r.fine };
  }

  if (tracks.some((t) => t.reachedReward)) {
    const banked = tracks.reduce((sum, t) => sum + t.bonus, 0);
    const totalMax = trackMax(r.diet) + trackMax(r.training);
    return {
      kind: 'earning',
      todayGain: tracks.reduce((sum, t) => sum + t.perDayToday, 0),
      banked,
      qualified: tracks.every((t) => t.days >= t.rules.pass),
      capLeft: Math.max(0, totalMax - banked),
      totalMax,
      tracks,
    };
  }

  return {
    kind: 'before',
    amount: r.diet.base + r.training.base,
    needDays: Math.max(...tracks.map((t) => t.needReward)),
    tracks,
  };
}
