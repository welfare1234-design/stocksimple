import { useEffect, useState } from 'react';
import { fetchQuotes } from '../../services/yahooFinance';
import styles from './RiskMonitor.module.css';

interface RiskIndicator {
  name: string;
  role: string;
  weight: number;
  symbol: string;
  value: number;
  change: number;
  signal: 'safe' | 'caution' | 'danger';
}

const INDICATORS = [
  { name: 'VIX', role: '市場恐慌度', weight: 20, symbol: '^VIX' },
  { name: '美10Y殖利率', role: '長期利率水準', weight: 12, symbol: '^TNX' },
  { name: '美10Y日變化', role: '利率波動', weight: 3, symbol: '__TNX_CHANGE__' },
  { name: '2Y-10Y利差', role: '衰退警訊', weight: 15, symbol: '__SPREAD__' },
  { name: 'DXY美元指數', role: '美元強弱', weight: 10, symbol: 'DX-Y.NYB' },
  { name: '高收益債利差', role: '信用風險', weight: 15, symbol: 'HYG' },
  { name: 'WTI原油', role: '能源成本', weight: 10, symbol: 'CL=F' },
  { name: 'USD/JPY', role: '套利交易', weight: 5, symbol: 'USDJPY=X' },
  { name: 'LQD信用利差', role: '企業債風險', weight: 10, symbol: 'LQD' },
];

// 1=安全(綠) 2=正常(黃) 3=注意(橙) 4+=危險(紅)
function getScore(name: string, value: number): number {
  switch (name) {
    case 'VIX':
      if (value < 13) return 1;
      if (value <= 18) return 2;
      if (value <= 25) return 3;
      return 4;
    case '美10Y殖利率':
      if (value < 3.5) return 1;
      if (value <= 4.2) return 2;
      if (value <= 4.8) return 3;
      return 4;
    case '美10Y日變化': // bps
      if (Math.abs(value) < 3) return 1;
      if (Math.abs(value) <= 6) return 2;
      if (Math.abs(value) <= 10) return 3;
      return 4;
    case '2Y-10Y利差':
      if (value > 0.2) return 1;
      if (value >= 0) return 2;
      if (value >= -0.5) return 3;
      return 4;
    case 'DXY美元指數':
      if (value < 100) return 1;
      if (value <= 103) return 2;
      if (value <= 108) return 3;
      return 4;
    case '高收益債利差': // HYG price (higher = safer)
      if (value > 80) return 1;
      if (value >= 78) return 2;
      if (value >= 75) return 3;
      return 4;
    case 'WTI原油':
      if (value >= 65 && value <= 75) return 1;
      if (value > 75 && value <= 85) return 2;
      if (value > 85 && value <= 100) return 3;
      return 4;
    case 'USD/JPY': // daily change %
      if (Math.abs(value) < 0.3) return 1;
      if (Math.abs(value) <= 0.7) return 2;
      if (Math.abs(value) <= 1.5) return 3;
      return 4;
    case 'LQD信用利差': // LQD daily change % (negative = risk)
      if (value > -0.1) return 1;
      if (value >= -0.3) return 2;
      if (value >= -0.7) return 3;
      return 4;
    default:
      return 1;
  }
}

function scoreToSignal(score: number): 'safe' | 'caution' | 'danger' {
  if (score <= 1) return 'safe';
  if (score <= 2) return 'caution';
  return 'danger';
}

export function RiskMonitor() {
  const [indicators, setIndicators] = useState<RiskIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const symbols = INDICATORS
          .filter(i => i.symbol !== '__SPREAD__')
          .map(i => i.symbol);

        // Also need 2Y for spread calculation
        symbols.push('^IRX'); // Using 3-month as proxy for short-term

        const quotes = await fetchQuotes(symbols);
        if (cancelled) return;

        const tnx = quotes.get('^TNX');
        const irx = quotes.get('^IRX');
        const spread = (tnx?.price ?? 0) - (irx?.price ?? 0); // 10Y - 3M spread
        const tnxChange = Math.abs(tnx?.change ?? 0) * 100; // convert to bps

        const results: RiskIndicator[] = INDICATORS.map(ind => {
          let value = 0;
          let change = 0;

          if (ind.symbol === '__SPREAD__') {
            value = spread;
            change = 0;
          } else if (ind.symbol === '__TNX_CHANGE__') {
            value = tnxChange; // bps
            change = 0;
          } else {
            const q = quotes.get(ind.symbol);
            value = q?.price ?? 0;
            change = q?.changePercent ?? 0;
          }

          // For USD/JPY and LQD, use change% as the signal value
          let signalValue = value;
          if (ind.name === 'USD/JPY') signalValue = change;
          if (ind.name === 'LQD信用利差') signalValue = change;

          const score = getScore(ind.name, signalValue);
          const signal = scoreToSignal(score);

          return {
            name: ind.name,
            role: ind.role,
            weight: ind.weight,
            symbol: ind.symbol,
            value,
            change,
            signal,
          };
        });

        setIndicators(results);
        setUpdatedAt(new Date().toLocaleTimeString('zh-TW'));
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>⚠️ 市場風險偵測</h3>
          {!loading && (
            <div className={styles.headerRight}>
              <span className={styles.updateTime}>更新 {updatedAt} · 資料來源：Yahoo Finance</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>偵測中...</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>#</span>
              <span>指標</span>
              <span>作用</span>
              <span>數值</span>
              <span>訊號</span>
              <span>權重</span>
            </div>
            {indicators.map((ind, i) => (
              <div key={ind.name} className={styles.tableRow}>
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.name}>{ind.name}</span>
                <span className={styles.role}>{ind.role}</span>
                <span className={styles.value}>{ind.value.toFixed(2)}</span>
                <span className={`${styles.signal} ${styles[ind.signal]}`}>
                  {ind.signal === 'danger' ? '🔴' : ind.signal === 'caution' ? '🟡' : '🟢'}
                </span>
                <span className={styles.weight}>{ind.weight}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
