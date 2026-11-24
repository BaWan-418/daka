import { href } from '../lib/hooks';
import { IconMonth, IconRules, IconToday, IconUser } from './Icons';

export type Tab = 'today' | 'month' | 'me' | 'rules';

const TABS: { key: Tab; label: string; path: string; Icon: () => preact.JSX.Element }[] = [
  { key: 'today', label: '今日', path: '/today', Icon: () => <IconToday /> },
  { key: 'month', label: '本月', path: '/month', Icon: () => <IconMonth /> },
  { key: 'me', label: '我的', path: '/me', Icon: () => <IconUser /> },
  { key: 'rules', label: '规则', path: '/rules', Icon: () => <IconRules /> },
];

export function TabBar({ active }: { active: Tab }) {
  return (
    <nav class="tabbar" aria-label="主导航">
      {TABS.map(({ key, label, path, Icon }) => (
        <a key={key} class="tab" href={href(path)} aria-current={key === active ? 'page' : undefined}>
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
