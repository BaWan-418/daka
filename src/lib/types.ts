export type ThemeName = 'gold' | 'red';

export type MealKey = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export const MEALS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'snack', label: '加餐' },
  { key: 'dinner', label: '晚餐' },
];

export function mealLabel(key: MealKey): string {
  return MEALS.find((m) => m.key === key)?.label ?? key;
}

/** 记在某一餐里的一条食物（kcal 为这一条的总热量） */
export interface FoodEntry {
  id: string;
  name: string;
  portion: string;
  servings: number;
  kcal: number;
  /** 属于哪个违禁类别；null 表示不违禁 */
  categoryId: string | null;
  createdAt: string;
}

export interface Workout {
  id: string;
  type: string;
  minutes: number;
  createdAt: string;
}

export type ExemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Exemption {
  reason: string;
  createdAt: string;
  status: ExemptionStatus;
  reviewedAt?: string;
  note?: string;
}

export interface DayRecord {
  meals: Record<MealKey, FoodEntry[]>;
  workouts: Workout[];
  cheat: boolean;
  exemption: Exemption | null;
  /** 这一天第一次记录时的热量上限快照（改身体数据后，第二天才用新上限） */
  kcalLimit: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type Goal = 'cut' | 'maintain' | 'bulk';

export interface Profile {
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface BodyEntry {
  id: string;
  date: string;
  weightKg: number;
  chest: number;
  waist: number;
  hip: number;
  thigh: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface TrackRules {
  /** 合格线（天） */
  pass: number;
  /** 奖励线（天） */
  reward: number;
  /** 封顶线（天） */
  cap: number;
  /** 到奖励线先拿的钱 */
  base: number;
  /** 奖励线之后每多 1 天加的钱 */
  perDay: number;
}

export interface Rules {
  kcalMode: 'auto' | 'manual';
  manualKcal: number;
  /** 减脂时按日常消耗的百分之几 */
  cutPercent: number;
  cheatDaysPerWeek: number;
  categories: Category[];
  trainingMinMinutes: number;
  diet: TrackRules;
  training: TrackRules;
  fine: number;
}

export interface RuleVersion {
  /** YYYY-MM，从这个月 1 号开始生效 */
  effectiveFrom: string;
  rules: Rules;
  savedAt: string;
}

export type FoodGroup = 'staple' | 'protein' | 'veg' | 'other';

export interface CustomFood {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  group: FoodGroup;
  categoryId: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  day: string;
  text: string;
}

export interface Settlement {
  month: string;
  confirmedAt: string;
  dietDays: number;
  trainingDays: number;
  dietBonus: number;
  trainingBonus: number;
  total: number;
  result: 'bonus' | 'none' | 'fine';
}

export interface AppData {
  version: 1;
  onboarded: boolean;
  /** 从这一天开始算 */
  startDate: string;
  theme: ThemeName;
  profile: Profile;
  body: BodyEntry[];
  ruleVersions: RuleVersion[];
  pinHash: string | null;
  pinSalt: string;
  foods: CustomFood[];
  days: Record<string, DayRecord>;
  settlements: Record<string, Settlement>;
  audit: AuditEntry[];
}
