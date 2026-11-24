import type { Hero, TrackHero } from '../lib/rules';
import { formatYM } from '../lib/dates';
import { IconAlert, IconCheck, IconLock } from './Icons';

const money = (n: number) => `¥${Math.round(n).toLocaleString('en-US')}`;

function Bar({ value, max, warn }: { value: number; max: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div class="hero-track">
      <div class={warn ? 'hero-fill hero-fill--warn' : 'hero-fill'} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TileHead({ t, target }: { t: TrackHero; target: number }) {
  return (
    <div class="hero-tile-head">
      <span>{t.label}</span>
      <span class="num">{t.days} / {target} 天</span>
    </div>
  );
}

export function BonusCard({ hero }: { hero: Hero }) {
  if (hero.kind === 'before') {
    const avgs = hero.tracks.map((t) => Math.round(t.rules.base / Math.max(1, t.needReward)));
    const sameAvg = avgs[0] === avgs[1];
    return (
      <section class="hero" aria-labelledby="hero-h">
        <div class="hero-head">
          <h2 id="hero-h" class="hero-label">本月奖金</h2>
          <span class="hero-chip"><IconLock size={13} />待解锁</span>
        </div>
        <div>
          <p class="hero-line">再坚持 <span class="hero-em">{hero.needDays}</span> 天，就能拿到</p>
          <p class="hero-big num">{money(hero.amount)}</p>
        </div>
        <div class="hero-tiles">
          {hero.tracks.map((t) => (
            <div class="hero-tile" key={t.key}>
              <TileHead t={t} target={t.rules.reward} />
              <Bar value={t.days} max={t.rules.reward} />
              <span class="hero-tile-main">还差 {t.needReward} 天 → {money(t.rules.base)}</span>
            </div>
          ))}
        </div>
        <p class="hero-strip">
          {sameAvg ? (
            <>现在每多达标 1 天，平均值<b class="num">{money(avgs[0])}</b></>
          ) : (
            <>
              <span>每多达标 1 天，平均值</span>
              <span class="nowrap">饮食 <b class="num">{money(avgs[0])}</b></span>
              <span class="nowrap">训练 <b class="num">{money(avgs[1])}</b></span>
            </>
          )}
        </p>
      </section>
    );
  }

  if (hero.kind === 'earning') {
    return (
      <section class="hero" aria-labelledby="hero-h">
        <div class="hero-head">
          <h2 id="hero-h" class="hero-label">{hero.todayGain > 0 ? '今天继续努力，还能再赚' : '今天能赚的都赚到了'}</h2>
          <span class="hero-chip">
            <IconCheck size={13} />
            {hero.qualified ? `本月已拿下 ${money(hero.banked)}` : `已攒 ${money(hero.banked)} · 两项合格才发`}
          </span>
        </div>
        <p class="hero-big num">{hero.todayGain > 0 ? `+${money(hero.todayGain)}` : money(hero.banked)}</p>
        <div class="hero-tiles">
          {hero.tracks.map((t) =>
            t.reachedReward ? (
              <div class="hero-tile" key={t.key}>
                <TileHead t={t} target={t.rules.cap} />
                <Bar value={t.days} max={t.rules.cap} />
                <span class="hero-tile-main">
                  {t.atCap ? '已封顶' : t.todayOpen ? `今天达标 +${money(t.rules.perDay)}` : '今天已达标'}
                </span>
                <span class="hero-tile-sub num">已拿下 {money(t.bonus)}</span>
              </div>
            ) : (
              <div class="hero-tile" key={t.key}>
                <TileHead t={t} target={t.rules.reward} />
                <Bar value={t.days} max={t.rules.reward} />
                <span class="hero-tile-main">还差 {t.needReward} 天 → {money(t.rules.base)}</span>
              </div>
            ),
          )}
        </div>
        <p class="hero-strip">
          {hero.capLeft > 0 ? (
            <>离本月封顶 {money(hero.totalMax)} 还差<b class="num">{money(hero.capLeft)}</b></>
          ) : (
            <>本月奖金已经封顶<b class="num">{money(hero.totalMax)}</b></>
          )}
        </p>
      </section>
    );
  }

  if (hero.kind === 'warning') {
    const risky = hero.risky;
    const both = risky.length === 2;
    const r = risky[0];
    const other = hero.tracks.find((t) => t.key !== r.key)!;
    let line;
    let big: string;
    let strip;
    if (both) {
      line = <>两项都还没合格</>;
      big = `−${money(hero.fine)}`;
      strip = <>两项都不合格要罚款<b class="num">{money(hero.fine)}</b></>;
    } else if (r.lost) {
      line = <>本月{r.label}已经来不及合格了</>;
      big = money(0);
      strip = <>只有一项合格：不奖不罚</>;
    } else if (hero.protect > 0) {
      line = <>{r.label}再坚持 <span class="hero-em">{r.needPass}</span> 天，保住</>;
      big = money(hero.protect);
      strip = <>{r.label}不合格，{other.label}攒的钱<b>全部作废</b></>;
    } else {
      line = <>{r.label}再坚持 <span class="hero-em">{r.needPass}</span> 天才能合格</>;
      big = `${r.needPass} 天`;
      strip = <>只有一项合格，奖金<b>一分没有</b></>;
    }
    return (
      <section class="hero hero--warn" aria-labelledby="hero-h">
        <div class="hero-head">
          <h2 id="hero-h" class="hero-label">本月奖金 · 有作废风险</h2>
          <span class="hero-chip hero-chip--warn">
            <IconAlert size={13} />
            {risky.map((t) => t.label).join('、')}未合格
          </span>
        </div>
        <div>
          <p class="hero-line">{line}</p>
          <p class="hero-big num">{big}</p>
        </div>
        <div class="hero-tiles">
          {hero.tracks.map((t) =>
            t.risk ? (
              <div class="hero-tile" key={t.key}>
                <TileHead t={t} target={t.rules.pass} />
                <Bar value={t.days} max={t.rules.pass} warn />
                <span class="hero-tile-main hero-warn-text">{t.lost ? '已经来不及合格' : `还差 ${t.needPass} 天合格`}</span>
              </div>
            ) : t.reachedReward ? (
              <div class="hero-tile" key={t.key}>
                <TileHead t={t} target={t.rules.cap} />
                <Bar value={t.days} max={t.rules.cap} />
                <span class="hero-tile-main">已攒 {money(t.bonus)}</span>
              </div>
            ) : (
              <div class="hero-tile" key={t.key}>
                <TileHead t={t} target={t.rules.reward} />
                <Bar value={t.days} max={t.rules.reward} />
                <span class="hero-tile-main">还差 {t.needReward} 天 → {money(t.rules.base)}</span>
              </div>
            ),
          )}
        </div>
        <p class="hero-strip">{strip}</p>
      </section>
    );
  }

  // 已经过去的月份
  const res = hero.result;
  const big = res.result === 'fine' ? `−${money(-res.total)}` : money(res.total);
  const text =
    res.result === 'fine' ? '两项都不合格，罚款' : res.result === 'bonus' ? '两项都合格，奖金' : res.dietOk || res.trainOk ? '只有一项合格，不奖不罚' : '两项都合格，没到奖励线';
  return (
    <section class={res.result === 'fine' ? 'hero hero--warn' : 'hero'} aria-labelledby="hero-h">
      <div class="hero-head">
        <h2 id="hero-h" class="hero-label">{formatYM(hero.ym)} · 结算</h2>
        <span class="hero-chip">
          {hero.confirmed ? <><IconCheck size={13} />审批人已确认</> : hero.pending > 0 ? `${hero.pending} 条豁免待审核` : '等审批人确认'}
        </span>
      </div>
      <div>
        <p class="hero-line">{text}</p>
        <p class="hero-big num">{big}</p>
      </div>
      <div class="hero-tiles">
        <div class="hero-tile">
          <div class="hero-tile-head"><span>饮食</span></div>
          <span class="hero-tile-main num">达标 {hero.dietDays} 天</span>
        </div>
        <div class="hero-tile">
          <div class="hero-tile-head"><span>训练</span></div>
          <span class="hero-tile-main num">达标 {hero.trainingDays} 天</span>
        </div>
      </div>
    </section>
  );
}
