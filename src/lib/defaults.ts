import type { AppData, Category, Profile, Rules } from './types';
import { getToday, monthOf, nowISO } from './dates';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fried', name: '油炸/快餐' },
  { id: 'bbq', name: '烧烤' },
  { id: 'hotpot', name: '火锅/麻辣烫' },
  { id: 'oily', name: '重油重盐炒菜' },
  { id: 'sugary', name: '奶茶/含糖饮料' },
  { id: 'dessert', name: '蛋糕甜点' },
  { id: 'processed', name: '深加工食品' },
];

export function defaultRules(): Rules {
  return {
    kcalMode: 'auto',
    manualKcal: 1800,
    cutPercent: 80,
    cheatDaysPerWeek: 1,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    trainingMinMinutes: 45,
    diet: { pass: 15, reward: 18, cap: 22, base: 750, perDay: 50 },
    training: { pass: 10, reward: 15, cap: 20, base: 750, perDay: 60 },
    fine: 500,
  };
}

export function defaultProfile(): Profile {
  return { sex: 'male', age: 30, heightCm: 170, activity: 'light', goal: 'cut' };
}

export const DEFAULT_GIRTHS = {
  male: { chest: 96, waist: 84, hip: 95, thigh: 55 },
  female: { chest: 86, waist: 70, hip: 94, thigh: 54 },
};

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyData(): AppData {
  const today = getToday();
  return {
    version: 1,
    onboarded: false,
    startDate: today,
    theme: 'gold',
    profile: defaultProfile(),
    body: [],
    ruleVersions: [{ effectiveFrom: monthOf(today), rules: defaultRules(), savedAt: nowISO() }],
    pinHash: null,
    pinSalt: uid(),
    foods: [],
    days: {},
    settlements: {},
    audit: [],
  };
}
