import { useEffect, useState } from 'react';
import { fetchETFTopHoldings, fetchQuotes, fetchFundamentals } from '../../services/yahooFinance';
import { ALL_STOCK_NAMES } from '../../data/stockNames';
import { getChangeColor, getValuationColor } from '../../utils/colors';
import { formatNumber, formatPercent } from '../../utils/formatting';
import { VALUATION_BAND_CONFIG } from '../../utils/valuation';
import type { StockValuationStatus } from '../../types';
import styles from './ETFOverlap.module.css';

const ETFS = ['0050', '0051', '0052', '0056', '00878', '00919'];

interface OverlapStock {
  code: string;
  symbol: string;
  name: string;
  etfs: string[];
  price: number;
  priceChange: number;
  changePercent: number;
  eps: number;
  valuationStatus: StockValuationStatus;
}

function determineValuation(pe: number): StockValuationStatus {
  if (pe <= 10) return 'bargain';
  if (pe <= 15) return 'cheap';
  if (pe <= 20) return 'fair';
  if (pe <= 25) return 'overpriced';
  if (pe <= 30) return 'expensive';
  return 'crazy';
}

export function ETFOverlap() {
  const [stocks, setStocks] = useState<OverlapStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.all(
          ETFS.map(async (etf) => {
            const holdings = await fetchETFTopHoldings(`${etf}.TW`);
            return { etf, holdings };
          })
        );
        if (cancelled) return;

        const stockMap = new Map<string, { symbol: string; etfs: Set<string> }>();
        for (const { etf, holdings } of results) {
          for (const h of holdings) {
            const code = h.symbol.replace(/\.TWO?$/, '');
            if (!stockMap.has(code)) stockMap.set(code, { symbol: h.symbol, etfs: new Set() });
            stockMap.get(code)!.etfs.add(etf);
          }
        }

        const multiHeld = Array.from(stockMap.entries())
          .filter(([, v]) => v.etfs.size >= 2)
          .sort((a, b) => b[1].etfs.size - a[1].etfs.size);

        const symbols = multiHeld.map(([, v]) => v.symbol);
        const [quotes, fundamentals] = await Promise.all([
          fetchQuotes(symbols),
          fetchFundamentals(symbols),
        ]);
        if (cancelled) return;

        const list: OverlapStock[] = multiHeld.map(([code, v]) => {
          const q = quotes.get(v.symbol);
          const f = fundamentals.get(v.symbol);
          const eps = f?.forwardEps ?? f?.trailingEps ?? 0;
          const price = q?.price ?? 0;
          const valuationStatus = eps > 0 ? determineValuation(price / eps) : 'fair';
          return {
            code,
            symbol: v.symbol,
            name: ALL_STOCK_NAMES[code] ?? code,
            etfs: Array.from(v.etfs),
            price,
            priceChange: q?.change ?? 0,
            changePercent: q?.changePercent ?? 0,
            eps,
            valuationStatus,
          };
        });

        setStocks(list);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>🔍 ETF 持股重疊</h3>
      <p className={styles.subtitle}>被 2 檔以上 ETF 共同持有的股票 · 資料來源：Yahoo Finance</p>

      {loading ? (
        <div className={styles.loading}>分析中...</div>
      ) : (
        <div className={styles.grid}>
          {stocks.map((s) => {
            const changeColor = getChangeColor(s.changePercent);
            const valuationColor = getValuationColor(s.valuationStatus);
            const valuationLabel = VALUATION_BAND_CONFIG[s.valuationStatus].displayName;
            return (
              <article key={s.code} className={styles.card}>
                <div className={styles.header}>
                  <span className={styles.stockName}>{s.name}</span>
                  <span className={styles.stockCode}>{s.code}</span>
                </div>
                <span className={styles.price}>{formatNumber(s.price)}</span>
                <div className={styles.changeRow}>
                  <span style={{ color: changeColor }}>
                    {s.priceChange > 0 ? '+' : ''}{formatNumber(s.priceChange)}
                  </span>
                  <span style={{ color: changeColor }}>
                    {formatPercent(s.changePercent)}
                  </span>
                </div>
                {s.eps > 0 && (
                  <>
                    <span className={styles.eps}>EPS {formatNumber(s.eps)}</span>
                    <span
                      className={styles.valuationBadge}
                      style={{
                        backgroundColor: valuationColor,
                        color: s.valuationStatus === 'fair' ? '#000' : '#fff',
                      }}
                    >
                      {valuationLabel}
                    </span>
                  </>
                )}
                <div className={styles.etfTags}>
                  {s.etfs.map(etf => (
                    <span key={etf} className={styles.etfTag}>{etf}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
