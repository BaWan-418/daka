import { describe, expect, it } from 'vitest';
import { sha256Hex } from './sha256';
import { kcalBreakdown } from './kcal';
import { defaultRules } from './defaults';
import { addDays, addMonths, daysInMonth, monthDays, weekStart, weekdayIndex } from './dates';
import { silhouettePaths } from './silhouette';

describe('SHA-256', () => {
  it('和标准测试向量一致', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
    expect(sha256Hex('a'.repeat(1000000))).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  });
});

describe('每日热量推算', () => {
  it('男 30 岁 172 cm 72 kg 轻度活动 减脂 → 1800', () => {
    const k = kcalBreakdown({ sex: 'male', age: 30, heightCm: 172, activity: 'light', goal: 'cut' }, 72, defaultRules());
    expect(k.bmr).toBeCloseTo(1650, 5);
    expect(Math.round(k.tdee)).toBe(2269);
    expect(Math.round(k.raw)).toBe(1815);
    expect(k.limit).toBe(1800);
  });

  it('审批人指定固定上限时直接用', () => {
    const r = { ...defaultRules(), kcalMode: 'manual' as const, manualKcal: 2000 };
    expect(kcalBreakdown({ sex: 'female', age: 25, heightCm: 160, activity: 'sedentary', goal: 'maintain' }, 55, r).limit).toBe(2000);
  });
});

describe('日期', () => {
  it('跨月、跨年', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(daysInMonth('2028-02')).toBe(29);
    expect(monthDays('2026-11')).toHaveLength(30);
  });

  it('一周从周一开始', () => {
    expect(weekdayIndex('2026-11-23')).toBe(0);
    expect(weekdayIndex('2026-11-29')).toBe(6);
    expect(weekStart('2026-11-26')).toBe('2026-11-23');
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
  });
});

describe('身材剪影', () => {
  it('围度没填也能画出来', () => {
    const p = silhouettePaths({ chest: 0, waist: NaN, hip: 95, thigh: 55 });
    expect(p.body).not.toContain('NaN');
    expect(p.arms).not.toContain('NaN');
  });
});
