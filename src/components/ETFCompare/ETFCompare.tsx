import { useEffect, useState } from 'react';
import { fetchQuotes } from '../../services/yahooFinance';
import styles from './ETFCompare.module.css';

const ETFS = ['0050', '0051', '0052', '0056', '00878', '00919'];

interface ETFPerformance {
  code: string;
  price: number;
  change: number;
  changePercent: number;
}

export function ETFCompare() {
  const [data, setData] = useState<ETFPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const symbols = ETFS.map(c => `${c}.TW`);
        const quotes = await fetchQuotes(symbols);
        if (cancelled) return;

        const results: ETFPerformance[] = ETFS.map(code => {
          const q = quotes.get(`${code}.TW`);
          return {
            code,
            price: q?.price ?? 0,
            change: q?.change ?? 0,
            changePercent: q?.changePercent ?? 0,
          };
        }).filter(r => r.price > 0);

        setData(results);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>📊 ETF 績效比較</h3>
      {loading ? (
        <div className={styles.loading}>載入中...</div>
      ) : (
        <div className={styles.grid}>
          {data.map(etf => {
            const isUp = etf.changePercent >= 0;
            return (
              <div key={etf.code} className={styles.card}>
                <span className={styles.code}>{etf.code}</span>
                <span className={styles.price}>{etf.price.toLocaleString()}</span>
                <span className={isUp ? styles.up : styles.down}>
                  {isUp ? '+' : ''}{etf.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
