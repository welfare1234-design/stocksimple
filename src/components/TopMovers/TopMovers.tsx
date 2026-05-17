import { useEffect, useState } from 'react';
import styles from './TopMovers.module.css';

interface MoverStock {
  rank: number;
  code: string;
  name: string;
  changePercent: string;
  price: string;
}

type Direction = 'up' | 'down';
type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = { day: '日', week: '週', month: '月' };

export function TopMovers() {
  const [gainers, setGainers] = useState<MoverStock[]>([]);
  const [losers, setLosers] = useState<MoverStock[]>([]);
  const [volume, setVolume] = useState<MoverStock[]>([]);
  const [direction, setDirection] = useState<Direction>('up');
  const [period, setPeriod] = useState<Period>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const periodParam = period === 'day' ? '' : `&period=${period}`;
        const [upRes, downRes, volRes] = await Promise.all([
          fetch(`/api/yahoo-rank?type=change-up${periodParam}`),
          fetch(`/api/yahoo-rank?type=change-down${periodParam}`),
          fetch('/api/yahoo-rank?type=volume'),
        ]);
        const upData = await upRes.json();
        const downData = await downRes.json();
        const volData = await volRes.json();

        if (!cancelled) {
          const mapStocks = (stocks: Array<{ code: string; name: string; changePercent: string; price: string }>) =>
            stocks.slice(0, 10).map((s, i) => ({ rank: i + 1, ...s }));
          setGainers(mapStocks(upData.stocks ?? []));
          setLosers(mapStocks(downData.stocks ?? []));
          setVolume(mapStocks(volData.stocks ?? []));
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [period]);

  if (loading && gainers.length === 0) return <div className={styles.loading}>載入排行資料中...</div>;

  const list = direction === 'up' ? gainers : losers;

  return (
    <section className={styles.container}>
      {/* 左：漲跌幅排行 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span>🔥 {period === 'day' ? '今日' : period === 'week' ? '本週' : '本月'}強勢股</span>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${direction === 'up' ? styles.tabActive : ''}`} onClick={() => setDirection('up')}>漲幅</button>
            <button className={`${styles.tab} ${direction === 'down' ? styles.tabActiveDown : ''}`} onClick={() => setDirection('down')}>跌幅</button>
          </div>
        </div>

        <div className={styles.periodTabs}>
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.listLoading}>載入中...</div>
          ) : (
            list.map((s) => (
              <div key={s.rank} className={styles.row}>
                <span className={styles.rank}>{s.rank}</span>
                <span className={styles.code}>{s.code}</span>
                <span className={styles.name}>{s.name}</span>
                <span className={direction === 'up' ? styles.pctUp : styles.pctDown}>{s.changePercent}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右：成交量排行 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span>📊 成交量排行</span>
        </div>

        <div className={styles.list}>
          {volume.map((s) => (
            <div key={s.rank} className={styles.row}>
              <span className={styles.rank}>{s.rank}</span>
              <span className={styles.code}>{s.code}</span>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.price}>{s.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
