import { render } from 'preact';
import './styles.css';
import { App } from './App';
import { initStore } from './lib/store';
import { setTodayOverride } from './lib/dates';
import { DEMO_TODAY, demoData } from './lib/demo';

// 地址后面加 ?demo 打开演示数据（和真实数据分开存）
const demo = new URLSearchParams(location.search).has('demo');
if (demo) setTodayOverride(DEMO_TODAY);
initStore(demo ? 'daka:demo' : 'daka:v1', demo ? demoData : undefined);

// 请求浏览器不要随便清掉本地数据
navigator.storage?.persist?.().catch(() => {});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

render(<App />, document.getElementById('app')!);
