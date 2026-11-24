import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base: './' 让打包结果可以放在任意子路径下（GitHub Pages / 以后的安卓 App 都能直接用）
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: {
    target: 'es2019',
  },
});
