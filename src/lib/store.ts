import type { AppData } from './types';
import { emptyData } from './defaults';

/** 检查导入/读取的数据是不是这个 App 的格式，不是就抛错 */
export function migrate(input: unknown): AppData {
  if (!input || typeof input !== 'object') throw new Error('不是有效的数据');
  const d = input as Partial<AppData>;
  if (d.version !== 1) throw new Error('数据版本不对');
  if (!d.days || typeof d.days !== 'object') throw new Error('缺少打卡记录');
  if (!Array.isArray(d.ruleVersions) || d.ruleVersions.length === 0) throw new Error('缺少规则');
  if (!d.profile || !Array.isArray(d.body)) throw new Error('缺少身体数据');
  return {
    ...emptyData(),
    ...d,
    foods: d.foods ?? [],
    settlements: d.settlements ?? {},
    audit: d.audit ?? [],
  } as AppData;
}

export class Store {
  private data: AppData;
  private listeners = new Set<() => void>();

  constructor(readonly key: string, seed?: () => AppData) {
    let loaded: AppData | null = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) loaded = migrate(JSON.parse(raw));
    } catch (err) {
      console.error('读取数据失败', err);
    }
    this.data = loaded ?? (seed ? seed() : emptyData());
    if (!loaded) this.persist();
  }

  get = (): AppData => this.data;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  update(mutator: (draft: AppData) => void): void {
    const next = JSON.parse(JSON.stringify(this.data)) as AppData;
    mutator(next);
    this.set(next);
  }

  set(next: AppData): void {
    this.data = next;
    this.persist();
    this.listeners.forEach((l) => l());
  }

  private persist(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (err) {
      console.error('保存数据失败', err);
      alert('保存失败：手机存储空间可能不够了。请先导出备份。');
    }
  }
}

let store: Store | null = null;

export function initStore(key: string, seed?: () => AppData): Store {
  store = new Store(key, seed);
  return store;
}

export function getStore(): Store {
  if (!store) throw new Error('store 还没初始化');
  return store;
}
