import { useEffect, useState } from 'preact/hooks';
import type { AppData } from './types';
import { getStore } from './store';

export function useData(): AppData {
  const store = getStore();
  const [data, setData] = useState(store.get());
  useEffect(() => store.subscribe(() => setData(store.get())), [store]);
  return data;
}

// ───────── 简单的 hash 路由 ─────────

export function parseHash(hash: string): string[] {
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function useRoute(): string[] {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parseHash(hash);
}

export function go(path: string) {
  location.hash = '#' + path;
}

export function href(path: string): string {
  return '#' + path;
}
