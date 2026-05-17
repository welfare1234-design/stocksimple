import { useEffect, useState } from 'react';
import styles from './StockRanking.module.css';

interface RankStock {
  name: string;
  code: string;
  price: string;
  change: string;
  changePercent: string;
}

type RankType = 'change-up' | 'change-down' | 'volume';

const TABS: { type: RankType; label: string }[] = [
  { type: 'change-up', label: '漲幅排行' },
  { type: 'change-down', label: '跌幅排行' },
  { type: 'volume', label: '成交量排行' },
];

export function StockRanking() {
  const [activeTab, setActiveTab] = useState<RankType>('change-up');
  const [stocks, setStocks] = useState<RankStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/yahoo-rank?type=${activeTab}`);
        const data = await res.json();
        if (!cancelled) setStocks(data.stocks ?? []);
      } catch {
        if (!cancelled) setStocks([]);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        {TABS.map((tab) => (
          <button
            key={tab.type}
            className={`${styles.tab} ${activeTab === tab.type ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.type)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>載入中...</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>代碼</th>
                <th>名稱</th>
                <th>股價</th>
                <th>漲跌</th>
                <th>漲跌%</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => {
                const isUp = s.changePercent.startsWith('+') || (!s.changePercent.startsWith('-') && parseFloat(s.change) > 0);
                const color = isUp ? '#ff4444' : '#00c853';
                return (
                  <tr key={i}>
                    <td className={styles.rank}>{i + 1}</td>
                    <td className={styles.code}>{s.code}</td>
                    <td>{s.name}</td>
                    <td>{s.price}</td>
                    <td style={{ color }}>{s.change}</td>
                    <td style={{ color }}>{s.changePercent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
