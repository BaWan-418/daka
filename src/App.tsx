import { useEffect } from 'preact/hooks';
import type { MealKey } from './lib/types';
import { MEALS } from './lib/types';
import { useData, useRoute } from './lib/hooks';
import { getStore } from './lib/store';
import { TabBar, type Tab } from './components/TabBar';
import { ToastHost } from './components/Toast';
import { TodayPage } from './pages/Today';
import { AddFoodPage } from './pages/AddFood';
import { MonthPage } from './pages/Month';
import { MePage } from './pages/Me';
import { ProfilePage, SetupPage } from './pages/Profile';
import { RulesPage } from './pages/Rules';
import { ReviewerPage } from './pages/Reviewer';

const THEME_COLOR = { gold: '#F5F3EE', red: '#FBF7F2' };

export function App() {
  const data = useData();
  const route = useRoute();
  const isDemo = getStore().key.endsWith(':demo');

  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[data.theme]);
  }, [data.theme]);

  const path = route.join('/');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  let page;
  let tab: Tab | null = null;
  const [head, a, b] = route;

  if (!data.onboarded) {
    page = <SetupPage />;
  } else if (head === 'month') {
    page = <MonthPage ym={a} />;
    tab = 'month';
  } else if (head === 'me' && a === 'profile') {
    page = <ProfilePage />;
  } else if (head === 'me') {
    page = <MePage />;
    tab = 'me';
  } else if (head === 'rules') {
    page = <RulesPage />;
    tab = 'rules';
  } else if (head === 'reviewer') {
    page = <ReviewerPage key={a ?? 'review'} tab={a === 'rules' ? 'rules' : 'review'} />;
  } else if (head === 'add' && a && MEALS.some((m) => m.key === b)) {
    page = <AddFoodPage date={a} meal={b as MealKey} />;
  } else {
    page = <TodayPage date={head === 'today' ? a : undefined} />;
    tab = 'today';
  }

  return (
    <div class="app">
      {isDemo && tab && <div class="demo-tag">演示数据</div>}
      {page}
      {tab && <TabBar active={tab} />}
      <ToastHost />
    </div>
  );
}
