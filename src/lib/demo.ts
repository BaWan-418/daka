// 演示数据：地址后面加 ?demo 打开，和真实数据分开存，不会互相影响
import type { AppData, FoodEntry, MealKey } from './types';
import { defaultRules, uid } from './defaults';
import { monthDays } from './dates';

export const DEMO_TODAY = '2026-11-26';

const T = '2026-11-26T12:00:00.000Z';

function food(name: string, kcal: number, categoryId: string | null = null, portion = '1 份'): FoodEntry {
  return { id: uid(), name, portion, servings: 1, kcal, categoryId, createdAt: T };
}

const NORMAL: Record<MealKey, FoodEntry[]> = {
  breakfast: [food('燕麦片', 156), food('水煮蛋', 150, null, '2 个'), food('无糖豆浆', 83)],
  lunch: [food('鸡胸肉（熟）', 248, null, '150 g'), food('米饭', 174), food('清炒时蔬（少油）', 100)],
  snack: [food('苹果', 104), food('无糖酸奶', 100)],
  dinner: [food('三文鱼', 208), food('糙米饭', 167), food('水煮 / 凉拌蔬菜', 50)],
};

function cloneMeals(m: Record<MealKey, FoodEntry[]>): Record<MealKey, FoodEntry[]> {
  return {
    breakfast: m.breakfast.map((f) => ({ ...f, id: uid() })),
    lunch: m.lunch.map((f) => ({ ...f, id: uid() })),
    snack: m.snack.map((f) => ({ ...f, id: uid() })),
    dinner: m.dinner.map((f) => ({ ...f, id: uid() })),
  };
}

export function demoData(): AppData {
  const rules = defaultRules();
  const data: AppData = {
    version: 1,
    onboarded: true,
    startDate: '2026-11-01',
    theme: 'gold',
    profile: { sex: 'male', age: 30, heightCm: 172, activity: 'light', goal: 'cut' },
    body: [
      { id: uid(), date: '2026-06-02', weightKg: 80.2, chest: 102, waist: 95, hip: 101, thigh: 60, createdAt: T },
      { id: uid(), date: '2026-07-06', weightKg: 78.5, chest: 101, waist: 93, hip: 100, thigh: 59, createdAt: T },
      { id: uid(), date: '2026-08-10', weightKg: 76.8, chest: 100, waist: 91, hip: 99, thigh: 58, createdAt: T },
      { id: uid(), date: '2026-09-14', weightKg: 75.1, chest: 99, waist: 89, hip: 98, thigh: 57, createdAt: T },
      { id: uid(), date: '2026-10-19', weightKg: 73.6, chest: 97, waist: 86, hip: 96, thigh: 56, createdAt: T },
      { id: uid(), date: '2026-11-22', weightKg: 72.0, chest: 96, waist: 84, hip: 95, thigh: 55, createdAt: T },
    ],
    ruleVersions: [{ effectiveFrom: '2026-11', rules, savedAt: T }],
    pinHash: null,
    pinSalt: uid(),
    foods: [],
    days: {},
    settlements: {},
    audit: [
      { id: uid(), at: '2026-11-17T00:12:00.000Z', day: '2026-11-16', text: '11/16 晚餐 · 补录 三文鱼 208 kcal' },
      { id: uid(), at: '2026-11-23T13:40:00.000Z', day: '2026-11-22', text: '11/22 午餐 · 删除 米饭 174 kcal' },
      { id: uid(), at: '2026-11-23T23:55:00.000Z', day: '2026-11-23', text: '11/23 训练 · 补录 力量训练 50 分钟' },
    ],
  };

  const cheat = ['01', '07', '14', '21'];
  const fail: Record<string, FoodEntry[]> = {
    '17': [food('烤肉', 500, 'bbq', '1 份 200 g'), food('烤串（羊肉）', 270, 'bbq', '3 串')],
    '24': [food('奶茶（全糖）', 400, 'sugary', '中杯 500 ml')],
  };
  const trainPass = ['02', '04', '06', '09', '11', '13', '16', '18', '19', '21', '23', '25', '26'];
  const trainPartial: Record<string, number> = { '08': 30, '14': 25, '24': 20 };

  for (const date of monthDays('2026-11')) {
    const dd = date.slice(8, 10);
    if (date > '2026-11-26') break;
    const rec = {
      meals: cloneMeals(NORMAL),
      workouts: [] as AppData['days'][string]['workouts'],
      cheat: false,
      exemption: null as AppData['days'][string]['exemption'],
      kcalLimit: 1800,
    };
    if (dd === '19') {
      rec.meals = { breakfast: [], lunch: [], snack: [], dinner: [] };
    }
    if (cheat.includes(dd)) {
      rec.cheat = true;
      rec.meals.dinner = [food('火锅', 1200, 'hotpot', '1 顿')];
    }
    if (fail[dd]) rec.meals.dinner = fail[dd];
    if (dd === '12') {
      rec.meals.snack = [food('含糖电解质饮料', 300, 'sugary', '2 瓶')];
      rec.exemption = { reason: '发烧，喝了含糖电解质饮料', createdAt: T, status: 'pending' };
    }
    if (dd === '25') {
      rec.meals.dinner = [food('火锅', 1200, 'hotpot', '1 顿'), food('可乐', 140, 'sugary')];
      rec.exemption = { reason: '客户应酬，没法选择餐食', createdAt: T, status: 'pending' };
    }
    if (dd === '26') {
      rec.meals.dinner = [];
    }
    if (trainPass.includes(dd)) rec.workouts.push({ id: uid(), type: '力量训练', minutes: dd === '26' ? 52 : 50, createdAt: T });
    if (trainPartial[dd]) rec.workouts.push({ id: uid(), type: '瑜伽 / 拉伸', minutes: trainPartial[dd], createdAt: T });
    data.days[date] = rec;
  }
  return data;
}
