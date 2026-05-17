import { useEffect, useState } from 'react';
import { fetchAllConsecutiveBuyers, type InstitutionalStock } from '../../services/twseService';
import styles from './InstitutionalBuyers.module.css';

export function InstitutionalBuyers() {
  const [foreignBuyers, setForeignBuyers] = useState<InstitutionalStock[]>([]);
  const [trustBuyers, setTrustBuyers] = useState<InstitutionalStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchAllConsecutiveBuyers(5, 10);
        if (!cancelled) {
          setForeignBuyers(result.foreign);
          setTrustBuyers(result.trust);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className={styles.loading}>載入法人買賣超資料中...</div>;
  }

  if (error) {
    return <div className={styles.error}>無法載入法人資料: {error}</div>;
  }

  return (
    <section className={styles.container}>
      <BuyerList title="外資連續買超 5 日以上" items={foreignBuyers} />
      <BuyerList title="投信連續買超 5 日以上" items={trustBuyers} />
    </section>
  );
}

function formatShares(shares: number): string {
  const lots = Math.round(shares / 1000);
  if (Math.abs(lots) >= 10000) {
    return `${(lots / 10000).toFixed(1)} 萬張`;
  }
  return `${lots.toLocaleString()} 張`;
}

function BuyerList({ title, items }: { title: string; items: InstitutionalStock[] }) {
  return (
    <div className={styles.list}>
      <h3 className={styles.listTitle}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>目前無符合條件的個股</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>代碼</th>
                <th>名稱</th>
                <th>連續天數</th>
                <th>最近一日</th>
                <th>累計買超</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.stockCode}>
                  <td className={styles.code}>{item.stockCode}</td>
                  <td>{item.stockName}</td>
                  <td className={styles.days}>{item.consecutiveDays} 日</td>
                  <td className={styles.shares}>{formatShares(item.latestNetBuy)}</td>
                  <td className={styles.shares}>{formatShares(item.totalNetBuy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
