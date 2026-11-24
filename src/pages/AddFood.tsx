import { useState } from 'preact/hooks';
import type { MealKey } from '../lib/types';
import { mealLabel } from '../lib/types';
import { getToday, monthOf } from '../lib/dates';
import { go, useData } from '../lib/hooks';
import { currentLimit } from '../lib/kcal';
import { evalDiet, rulesForMonth } from '../lib/rules';
import type { FoodItem } from '../lib/foods';
import { BUILTIN_FOODS } from '../lib/foods';
import { addCustomFood, addFood } from '../lib/actions';
import { Sheet } from '../components/Sheet';
import { Chip, Stepper, SubBar } from '../components/ui';
import { IconCheck, IconPlus, IconSearch } from '../components/Icons';
import { toast } from '../components/Toast';

type Tab = 'common' | 'staple' | 'protein' | 'veg' | 'forbidden';
const TABS: { key: Tab; label: string }[] = [
  { key: 'common', label: '常用' },
  { key: 'staple', label: '主食' },
  { key: 'protein', label: '蛋白质' },
  { key: 'veg', label: '蔬果' },
  { key: 'forbidden', label: '违禁类' },
];

export function AddFoodPage({ date, meal }: { date: string; meal: MealKey }) {
  const data = useData();
  const today = getToday();
  const rules = rulesForMonth(data, monthOf(date));
  const diet = evalDiet(data, date, today, currentLimit(data, rules));
  const back = date === today ? '/today' : `/today/${date}`;
  const catName = (id: string | null) => rules.categories.find((c) => c.id === id)?.name ?? '违禁类';

  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('common');
  const [sel, setSel] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [manualOpen, setManualOpen] = useState(false);

  const all: FoodItem[] = [...data.foods.map((f) => ({ ...f, custom: true })), ...BUILTIN_FOODS];
  const query = q.trim();
  const list = query
    ? all.filter((f) => f.name.includes(query))
    : all.filter((f) => {
        if (tab === 'forbidden') return Boolean(f.categoryId);
        if (f.categoryId) return false;
        if (tab === 'common') return true;
        if (tab === 'veg') return f.group === 'veg' || f.group === 'other';
        return f.group === tab;
      });

  const add = (f: FoodItem, s: number) => {
    addFood(date, meal, { name: f.name, portion: f.portion, kcalPerServing: f.kcal, servings: s, categoryId: f.categoryId });
    toast(f.categoryId ? `已加入 ${f.name}（违禁）` : `已加入 ${f.name}`);
    go(back);
  };

  const left = diet.limit - diet.kcal;

  return (
    <main class="screen screen--plain screen--with-dock">
      <SubBar title={`添加到${mealLabel(meal)}`} back={back} backLabel="返回" right={<span class="muted small num">{left >= 0 ? `还可吃 ${left} kcal` : `已超 ${-left} kcal`}</span>} />

      <div class="field">
        <label class="field-label" for="food-q">搜索食物</label>
        <div class="search">
          <IconSearch />
          <input id="food-q" type="search" placeholder="例如：鸡胸肉、米饭" value={q} onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)} />
        </div>
      </div>

      {!query && (
        <div class="pick-row" role="group" aria-label="食物分类">
          {TABS.map((t) => (
            <button key={t.key} type="button" class={t.key === 'forbidden' ? 'pick pick--danger' : 'pick'} aria-pressed={t.key === tab} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <ul class="list">
        {list.map((f) => {
          const on = sel?.id === f.id;
          return (
            <li key={f.id} class={on ? 'list-row list-row--on' : 'list-row'}>
              <button
                type="button"
                class="list-row-btn"
                onClick={() => {
                  setSel(f);
                  setServings(1);
                }}
              >
                <span class="list-row-main">
                  <b>{f.name}{f.custom && <span class="tag">自建</span>}</b>
                  <span class="muted num">{f.portion} · {f.kcal} kcal</span>
                </span>
                {f.categoryId && <Chip kind="danger">违禁 · {catName(f.categoryId)}</Chip>}
                <span class="list-row-icon" aria-hidden="true">{on ? <IconCheck size={18} /> : <IconPlus />}</span>
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li class="list-empty">没找到。可以点下面「手动填写」。</li>}
      </ul>

      <button type="button" class="btn-text" onClick={() => setManualOpen(true)}>找不到？手动填写名称和热量</button>

      {sel && (
        <div class="dock">
          <div class="dock-row">
            <span class="list-row-main">
              <b>{sel.name}</b>
              <span class="muted num">每份 {sel.portion} · {sel.kcal} kcal</span>
            </span>
            <Stepper label="份数" value={servings} onChange={setServings} step={0.5} min={0.5} max={20} format={(v) => `${v} 份`} />
          </div>
          <button type="button" class="btn btn-primary" onClick={() => add(sel, servings)}>
            加入{mealLabel(meal)} · {Math.round(sel.kcal * servings)} kcal
          </button>
        </div>
      )}

      {manualOpen && (
        <ManualSheet
          categories={rules.categories}
          onClose={() => setManualOpen(false)}
          onAdd={(f, save) => {
            const item: FoodItem = save ? { ...addCustomFood(f), custom: true } : { ...f, id: 'manual' };
            setManualOpen(false);
            add(item, 1);
          }}
        />
      )}
    </main>
  );
}

function ManualSheet({
  categories, onClose, onAdd,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
  onAdd: (f: Omit<FoodItem, 'id'>, save: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('1 份');
  const [kcal, setKcal] = useState<number>(NaN);
  const [cat, setCat] = useState('');
  const [save, setSave] = useState(true);
  const ok = name.trim().length > 0 && Number.isFinite(kcal) && kcal > 0 && kcal < 5000;
  return (
    <Sheet title="手动填写" onClose={onClose}>
      <div class="field">
        <label class="field-label" for="m-name">名称</label>
        <input id="m-name" class="input" value={name} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} placeholder="例如：公司食堂套餐" />
      </div>
      <div class="grid2">
        <div class="field">
          <label class="field-label" for="m-portion">份量</label>
          <input id="m-portion" class="input" value={portion} onInput={(e) => setPortion((e.currentTarget as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label class="field-label" for="m-kcal">热量（kcal）</label>
          <input
            id="m-kcal"
            class="input num"
            type="number"
            inputMode="numeric"
            value={Number.isFinite(kcal) ? kcal : ''}
            onInput={(e) => setKcal(parseFloat((e.currentTarget as HTMLInputElement).value))}
          />
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="m-cat">属于违禁类吗？</label>
        <select id="m-cat" class="input" value={cat} onChange={(e) => setCat((e.currentTarget as HTMLSelectElement).value)}>
          <option value="">不属于违禁类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>违禁 · {c.name}</option>
          ))}
        </select>
      </div>
      <label class="check">
        <input type="checkbox" checked={save} onChange={(e) => setSave((e.currentTarget as HTMLInputElement).checked)} />
        保存到常用食物，下次直接选
      </label>
      <button
        type="button"
        class="btn btn-primary"
        disabled={!ok}
        onClick={() => onAdd({ name: name.trim(), portion: portion.trim() || '1 份', kcal: Math.round(kcal), group: 'other', categoryId: cat || null }, save)}
      >
        加入
      </button>
    </Sheet>
  );
}
