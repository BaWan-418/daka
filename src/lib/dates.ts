// 所有日期都用本地时间的 YYYY-MM-DD 字符串，避免 toISOString() 在东八区差一天的问题

let todayOverride: string | null = null;

/** 演示模式 / 测试用：把"今天"固定成某一天 */
export function setTodayOverride(date: string | null): void {
  todayOverride = date;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getToday(): string {
  return todayOverride ?? toISODate(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function monthOf(s: string): string {
  return s.slice(0, 7);
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthDays(ym: string): string[] {
  const n = daysInMonth(ym);
  return Array.from({ length: n }, (_, i) => `${ym}-${pad(i + 1)}`);
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** 周一 = 0 … 周日 = 6 */
export function weekdayIndex(s: string): number {
  return (parseISODate(s).getDay() + 6) % 7;
}

export function weekStart(s: string): string {
  return addDays(s, -weekdayIndex(s));
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function weekdayLabel(s: string): string {
  return WEEKDAYS[weekdayIndex(s)];
}

/** 11月26日 */
export function formatMD(s: string): string {
  const d = parseISODate(s);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 11/26 */
export function formatShort(s: string): string {
  const d = parseISODate(s);
  return `${d.getMonth() + 1}/${pad(d.getDate())}`;
}

/** 2026年11月 */
export function formatYM(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

/** 11 月 */
export function formatMonthOnly(ym: string): string {
  return `${Number(ym.split('-')[1])} 月`;
}

/** 本地时间 HH:MM */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 11/26 08:12 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
