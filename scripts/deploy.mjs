// 测试 → 打包 → 把 dist/ 推到 gh-pages 分支，GitHub Pages 会自动更新
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });
const read = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const remote = read('git remote get-url origin');
const name = read('git config user.name');
const email = read('git config user.email');

run('npm test');
run('npm run build');
writeFileSync('dist/.nojekyll', '');

rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run(`git config user.name "${name}"`, 'dist');
run(`git config user.email "${email}"`, 'dist');
run('git add -A', 'dist');
run(`git commit -q -m "Deploy ${new Date().toISOString()}"`, 'dist');
run(`git push -f "${remote}" gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });

console.log('\n已发布，1–2 分钟后生效。');
