import type { ActivityLevel, AppData, BodyEntry, Goal, Profile, Rules } from './types';

export const ACTIVITY: Record<ActivityLevel, { factor: number; label: string; short: string }> = {
  sedentary: { factor: 1.2, label: '久坐 · 几乎不运动', short: '久坐' },
  light: { factor: 1.375, label: '轻度 · 每周 1–3 次', short: '轻度活动' },
  moderate: { factor: 1.55, label: '中等 · 每周 3–5 次', short: '中等活动' },
  high: { factor: 1.725, label: '高 · 每周 6–7 次', short: '高强度活动' },
};

export const GOALS: Record<Goal, string> = {
  cut: '减脂',
  maintain: '维持',
  bulk: '增肌',
};

export interface KcalBreakdown {
  bmr: number;
  tdee: number;
  goalFactor: number;
  raw: number;
  limit: number;
  manual: boolean;
}

/** Mifflin-St Jeor 公式 */
export function kcalBreakdown(profile: Profile, weightKg: number, rules: Rules): KcalBreakdown {
  const bmr = 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[profile.activity].factor;
  const goalFactor = profile.goal === 'cut' ? rules.cutPercent / 100 : profile.goal === 'bulk' ? 1.1 : 1;
  const raw = tdee * goalFactor;
  if (rules.kcalMode === 'manual') {
    return { bmr, tdee, goalFactor, raw, limit: rules.manualKcal, manual: true };
  }
  return { bmr, tdee, goalFactor, raw, limit: Math.round(raw / 50) * 50, manual: false };
}

export function sortedBody(data: AppData): BodyEntry[] {
  return [...data.body].sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
}

export function latestBody(data: AppData): BodyEntry | undefined {
  const s = sortedBody(data);
  return s[s.length - 1];
}

export function currentLimit(data: AppData, rules: Rules): number {
  const body = latestBody(data);
  return kcalBreakdown(data.profile, body?.weightKg ?? 65, rules).limit;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}
