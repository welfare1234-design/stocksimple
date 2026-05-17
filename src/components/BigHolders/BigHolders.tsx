import { useEffect, useState } from 'react';
import { ALL_STOCK_NAMES } from '../../data/stockNames';
import styles from './BigHolders.module.css';

interface BigHolderStock {
  code: string;
  bigHolderPct: string;
  bigHolderShares: number;
  prevPct: string | null;
  change: string | null;
  sharesChange: number | null;
}

interface DisplayStock {
  code: string;
  name: string;
  currentPct: number;
  prevPct: number | null;
  change: number | null;
  sharesChange: number | null;
}

export function BigHolders() {
  const [stocks, setStocks] = useState<DisplayStock[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/tdcc-big-holders');
        const data = await res.json();
        if (cancelled) return;

        setDate(data.date ?? '');

        const rawStocks = data.stocks ?? [];
        const display: DisplayStock[] = rawStocks
          .map((s: BigHolderStock & { name?: string }) => ({
            code: s.code,
            name: s.name || ALL_STOCK_NAMES[s.code] || s.code,
            currentPct: parseFloat(s.bigHolderPct),
            prevPct: s.prevPct ? parseFloat(s.prevPct) : null,
            change: s.change ? parseFloat(s.change) : null,
            sharesChange: s.sharesChange,
          }));

        setStocks(display.slice(0, 20));
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const fmtDate = (d: string) => d ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : '';

  return (
    <section className={styles.container}>
      <h2 className={styles.pageTitle}>👑 大戶加碼股</h2>
      <p className={styles.subtitle}>400張以上大戶持股比例排行 · 資料來源：集保結算所 · {fmtDate(date)}</p>
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingInner}>載入中...</div>
        ) : (
          <div className={styles.list}>
            {stocks.map((s, i) => (
              <div key={s.code} className={styles.row}>
                <span className={styles.rank}>{i + 1}</span>
                <div className={styles.divider} />
                <div className={styles.info}>
                  <div className={styles.topLine}>
                    <span className={styles.code}>{s.code}</span>
                    <span className={styles.name}>{s.name}</span>
                  </div>
                  <div className={styles.bottomLine}>
                    {s.prevPct !== null
                      ? `${s.prevPct.toFixed(2)}% → ${s.currentPct.toFixed(2)}%`
                      : `持股比例 ${s.currentPct.toFixed(2)}%`
                    }
                  </div>
                </div>
                <span className={styles.pctValue}>
                  {s.change !== null
                    ? `${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%`
                    : `${s.currentPct.toFixed(2)}%`
                  }
                </span>
              </div>
            ))}
            {stocks.length === 0 && <div className={styles.loadingInner}>無符合條件的資料</div>}
          </div>
        )}
      </div>
    </section>
  );
}
