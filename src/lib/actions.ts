import type { AppData, BodyEntry, CustomFood, DayRecord, MealKey, Profile, Rules, ThemeName } from './types';
import { mealLabel } from './types';
import { addMonths, formatShort, getToday, monthOf, nowISO } from './dates';
import { uid } from './defaults';
import { currentLimit, latestBody } from './kcal';
import { monthStats, rulesForMonth, settle } from './rules';
import { sha256Hex } from './sha256';
import { getStore, migrate } from './store';

const update = (fn: (d: AppData) => void) => getStore().update(fn);

export function ensureDay(d: AppData, date: string): DayRecord {
  let rec = d.days[date];
  if (!rec) {
    const rules = rulesForMonth(d, monthOf(date));
    rec = {
      meals: { breakfast: [], lunch: [], snack: [], dinner: [] },
      workouts: [],
      cheat: false,
      exemption: null,
      kcalLimit: currentLimit(d, rules),
    };
    d.days[date] = rec;
  }
  return rec;
}

/** 过了当天再改，就记一笔给审批人看 */
function auditIfLate(d: AppData, date: string, text: string) {
  if (date < getToday()) d.audit.push({ id: uid(), at: nowISO(), day: date, text: `${formatShort(date)} ${text}` });
}

// ───────── 饮食 ─────────

export interface NewFood {
  name: string;
  portion: string;
  kcalPerServing: number;
  servings: number;
  categoryId: string | null;
}

export function addFood(date: string, meal: MealKey, f: NewFood) {
  update((d) => {
    const kcal = Math.round(f.kcalPerServing * f.servings);
    ensureDay(d, date).meals[meal].push({
      id: uid(), name: f.name, portion: f.portion, servings: f.servings, kcal, categoryId: f.categoryId, createdAt: nowISO(),
    });
    auditIfLate(d, date, `${mealLabel(meal)} · 补录 ${f.name} ${kcal} kcal`);
  });
}

export function removeFood(date: string, meal: MealKey, id: string) {
  update((d) => {
    const rec = ensureDay(d, date);
    const item = rec.meals[meal].find((e) => e.id === id);
    rec.meals[meal] = rec.meals[meal].filter((e) => e.id !== id);
    if (item) auditIfLate(d, date, `${mealLabel(meal)} · 删除 ${item.name} ${item.kcal} kcal`);
  });
}

export function addCustomFood(food: Omit<CustomFood, 'id'>): CustomFood {
  const created = { ...food, id: uid() };
  update((d) => {
    d.foods.push(created);
  });
  return created;
}

export function deleteCustomFood(id: string) {
  update((d) => {
    d.foods = d.foods.filter((f) => f.id !== id);
  });
}

// ───────── 训练 ─────────

export function addWorkout(date: string, type: string, minutes: number) {
  update((d) => {
    ensureDay(d, date).workouts.push({ id: uid(), type, minutes, createdAt: nowISO() });
    auditIfLate(d, date, `训练 · 补录 ${type} ${minutes} 分钟`);
  });
}

export function removeWorkout(date: string, id: string) {
  update((d) => {
    const rec = ensureDay(d, date);
    const w = rec.workouts.find((x) => x.id === id);
    rec.workouts = rec.workouts.filter((x) => x.id !== id);
    if (w) auditIfLate(d, date, `训练 · 删除 ${w.type} ${w.minutes} 分钟`);
  });
}

// ───────── 放纵日 / 豁免 ─────────

export function setCheat(date: string, on: boolean) {
  update((d) => {
    ensureDay(d, date).cheat = on;
  });
}

export function requestExemption(date: string, reason: string) {
  update((d) => {
    ensureDay(d, date).exemption = { reason, createdAt: nowISO(), status: 'pending' };
  });
}

export function withdrawExemption(date: string) {
  update((d) => {
    ensureDay(d, date).exemption = null;
  });
}

export function reviewExemption(date: string, approve: boolean, note: string) {
  update((d) => {
    const rec = ensureDay(d, date);
    if (!rec.exemption) return;
    rec.exemption = { ...rec.exemption, status: approve ? 'approved' : 'rejected', reviewedAt: nowISO(), note: note || undefined };
  });
}

// ───────── 身体数据 ─────────

export function completeSetup(profile: Profile, body: Omit<BodyEntry, 'id' | 'createdAt' | 'date'>) {
  update((d) => {
    const today = getToday();
    d.profile = profile;
    d.body = [{ ...body, id: uid(), date: today, createdAt: nowISO() }];
    d.onboarded = true;
    d.startDate = today;
    d.ruleVersions = d.ruleVersions.map((v, i) => (i === 0 ? { ...v, effectiveFrom: monthOf(today) } : v));
  });
}

export function saveProfile(profile: Profile, weightKg: number) {
  update((d) => {
    d.profile = profile;
    const last = latestBody(d);
    if (!last || Math.abs(last.weightKg - weightKg) > 0.001) upsertBody(d, { ...girthsOf(last), weightKg, date: getToday() });
  });
}

function girthsOf(b?: BodyEntry) {
  return { chest: b?.chest ?? 0, waist: b?.waist ?? 0, hip: b?.hip ?? 0, thigh: b?.thigh ?? 0 };
}

function upsertBody(d: AppData, e: Omit<BodyEntry, 'id' | 'createdAt'>) {
  const existing = d.body.find((b) => b.date === e.date);
  if (existing) Object.assign(existing, e, { createdAt: nowISO() });
  else d.body.push({ ...e, id: uid(), createdAt: nowISO() });
}

export function recordBody(e: Omit<BodyEntry, 'id' | 'createdAt'>) {
  update((d) => upsertBody(d, e));
}

export function deleteBody(id: string) {
  update((d) => {
    if (d.body.length <= 1) return;
    d.body = d.body.filter((b) => b.id !== id);
  });
}

/** 清除历史：只留最新一条（用来算热量） */
export function clearBodyHistory() {
  update((d) => {
    const last = latestBody(d);
    d.body = last ? [last] : [];
  });
}

// ───────── 外观 ─────────

export function setTheme(theme: ThemeName) {
  update((d) => {
    d.theme = theme;
  });
}

// ───────── 审批人 ─────────

export function hashPin(d: AppData, pin: string): string {
  return sha256Hex(`${d.pinSalt}:${pin}`);
}

export function checkPin(pin: string): boolean {
  const d = getStore().get();
  return d.pinHash !== null && hashPin(d, pin) === d.pinHash;
}

export function setPin(pin: string) {
  update((d) => {
    d.pinSalt = uid();
    d.pinHash = hashPin(d, pin);
  });
}

/** 规则改动从下个月 1 号起生效 */
export function saveRules(rules: Rules) {
  update((d) => {
    const from = addMonths(monthOf(getToday()), 1);
    d.ruleVersions = d.ruleVersions.filter((v) => v.effectiveFrom !== from);
    d.ruleVersions.push({ effectiveFrom: from, rules, savedAt: nowISO() });
    d.ruleVersions.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  });
}

export function confirmMonth(ym: string) {
  update((d) => {
    const s = monthStats(d, ym, getToday());
    const r = settle(s.dietDays, s.trainingDays, s.rules);
    d.settlements[ym] = {
      month: ym,
      confirmedAt: nowISO(),
      dietDays: s.dietDays,
      trainingDays: s.trainingDays,
      dietBonus: r.dietOk && r.trainOk ? r.dietBonus : 0,
      trainingBonus: r.dietOk && r.trainOk ? r.trainBonus : 0,
      total: r.total,
      result: r.result,
    };
  });
}

// ───────── 备份 ─────────

export function exportBackup(): string {
  return JSON.stringify({ app: 'daka', exportedAt: nowISO(), data: getStore().get() }, null, 2);
}

/** 导入会覆盖现有数据；导入这件事本身会记一笔给审批人看 */
export function importBackup(text: string) {
  const parsed = JSON.parse(text) as { app?: string; data?: unknown };
  if (parsed.app !== 'daka' || !parsed.data) throw new Error('这不是打卡 App 导出的备份文件');
  const data = migrate(parsed.data);
  data.audit = [...data.audit, { id: uid(), at: nowISO(), day: getToday(), text: '导入了一份备份（覆盖了原来的数据）' }];
  getStore().set(data);
}
