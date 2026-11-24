import type { ComponentChildren } from 'preact';
import { href } from '../lib/hooks';
import { IconChevronLeft, IconMinus, IconPlus } from './Icons';

export type ChipKind = 'pass' | 'fail' | 'pending' | 'cheat' | 'gray' | 'danger' | 'money';

export function Chip({ kind, children }: { kind: ChipKind; children: ComponentChildren }) {
  return <span class={`chip chip--${kind}`}>{children}</span>;
}

/** 二级页面顶部：返回 + 标题 + 右侧按钮 */
export function SubBar({ title, back, backLabel, right }: { title: string; back: string; backLabel: string; right?: ComponentChildren }) {
  return (
    <header class="subbar">
      <a class="icon-btn" href={href(back)} aria-label={backLabel}>
        <IconChevronLeft />
      </a>
      <h1 class="subbar-title">{title}</h1>
      <div class="subbar-right">{right}</div>
    </header>
  );
}

export function Seg<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ComponentChildren }[];
  onChange: (v: T) => void;
}) {
  return (
    <div class="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  label, value, onChange, step = 1, min = 0, max = 9999, format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div class="stepper">
      <button type="button" class="btn-square" aria-label={`减少${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - step))}>
        <IconMinus />
      </button>
      <span class="stepper-value num" aria-live="polite">{format ? format(value) : value}</span>
      <button type="button" class="btn-square" aria-label={`增加${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + step))}>
        <IconPlus />
      </button>
    </div>
  );
}

/** 数字输入框：输入时允许空，失焦时再校正 */
export function NumInput({
  id, value, onChange, step = 1, label, wide,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  label?: string;
  wide?: boolean;
}) {
  return (
    <input
      id={id}
      class={wide ? 'num-input num-input--wide num' : 'num-input num'}
      type="number"
      inputMode={step < 1 ? 'decimal' : 'numeric'}
      step={step}
      aria-label={label}
      value={Number.isFinite(value) ? value : ''}
      onInput={(e) => {
        const v = parseFloat((e.currentTarget as HTMLInputElement).value);
        onChange(Number.isFinite(v) ? v : NaN);
      }}
    />
  );
}

export const money = (n: number) => `¥${Math.round(n).toLocaleString('en-US')}`;
