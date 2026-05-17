import { useEffect, useState, useCallback } from 'react';
import { fetchQuotes, fetchFundamentals } from '../../services/yahooFinance';
import type { YahooQuote, YahooFundamentals } from '../../services/yahooFinance';
import { ALL_STOCK_NAMES as STOCK_NAME_MAP, OTC_STOCK_NAME_MAP } from '../../data/stockNames';
import { StockCard } from '../ETFHoldings/StockCard';
import type { StockHolding, StockValuationStatus } from '../../types';
import styles from './Watchlist.module.css';

interface WatchlistGroup {
  name: string;
  stocks: string[]; // stock codes like '2330', '2317'
}

interface StockData {
  quote?: YahooQuote;
  fund?: YahooFundamentals;
}

const STORAGE_KEY = 'stocksimple_watchlist';

function loadGroups(): WatchlistGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [{ name: '我的自選', stocks: ['2330', '2317', '2454'] }];
}

function saveGroups(groups: WatchlistGroup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function Watchlist() {
  const [groups, setGroups] = useState<WatchlistGroup[]>(loadGroups);
  const [activeGroup, setActiveGroup] = useState(0);
  const [stockDataMap, setStockDataMap] = useState<Map<string, StockData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [newGroupInput, setNewGroupInput] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);

  const currentGroup = groups[activeGroup] ?? groups[0];
  const stocks = currentGroup?.stocks ?? [];

  const fetchData = useCallback(async (codes: string[]) => {
    if (codes.length === 0) return;
    setLoading(true);
    try {
      // 上櫃用 .TWO，上市用 .TW
      const symbols = codes.map((c) => c in OTC_STOCK_NAME_MAP ? `${c}.TWO` : `${c}.TW`);
      const [quotes, fundamentals] = await Promise.all([
        fetchQuotes(symbols),
        fetchFundamentals(symbols),
      ]);
      setStockDataMap((prev) => {
        const next = new Map(prev);
        codes.forEach((code) => {
          const sym = code in OTC_STOCK_NAME_MAP ? `${code}.TWO` : `${code}.TW`;
          next.set(code, {
            quote: quotes.get(sym),
            fund: fundamentals.get(sym),
          });
        });
        return next;
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(stocks);

    // 每 60 秒自動更新
    const interval = setInterval(() => {
      if (stocks.length > 0) fetchData(stocks);
    }, 60000);

    return () => clearInterval(interval);
  }, [stocks.join(','), fetchData]);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const handleAddStock = () => {
    let code = addInput.trim();
    if (!code) { setAddInput(''); return; }

    // 如果輸入的是中文名稱，反查代碼（支援模糊匹配）
    if (!/^\d+$/.test(code)) {
      // 精確匹配
      let found = Object.entries(STOCK_NAME_MAP).find(([, name]) => name === code);
      // 模糊匹配：名稱包含輸入文字
      if (!found) {
        const matches = Object.entries(STOCK_NAME_MAP).filter(([, name]) => name.includes(code));
        if (matches.length === 1) {
          found = matches[0];
        } else if (matches.length > 1) {
          const list = matches.slice(0, 10).map(([c, n]) => `${c} ${n}`).join('\n');
          alert(`找到多筆結果，請輸入代碼：\n${list}`);
          return;
        }
      }
      if (found) {
        code = found[0];
      } else {
        alert(`找不到「${code}」，請直接輸入股票代碼數字（例如 3450）`);
        return;
      }
    }

    if (stocks.includes(code)) { setAddInput(''); return; }
    const updated = [...groups];
    updated[activeGroup] = { ...currentGroup, stocks: [...stocks, code] };
    setGroups(updated);
    setAddInput('');
    fetchData([code]);
  };

  const handleRemoveStock = (code: string) => {
    const updated = [...groups];
    updated[activeGroup] = { ...currentGroup, stocks: stocks.filter((s) => s !== code) };
    setGroups(updated);
  };

  const handleAddGroup = () => {
    const name = newGroupInput.trim();
    if (!name) return;
    setGroups([...groups, { name, stocks: [] }]);
    setActiveGroup(groups.length);
    setNewGroupInput('');
    setShowNewGroup(false);
  };

  const handleDeleteGroup = (idx: number) => {
    if (groups.length <= 1) return;
    const updated = groups.filter((_, i) => i !== idx);
    setGroups(updated);
    if (activeGroup >= updated.length) setActiveGroup(updated.length - 1);
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>自選股</h2>
        <div className={styles.groupTabs}>
          {groups.map((g, i) => (
            <button
              key={i}
              className={`${styles.groupTab} ${i === activeGroup ? styles.groupTabActive : ''}`}
              onClick={() => setActiveGroup(i)}
            >
              {g.name}
              {groups.length > 1 && (
                <span className={styles.deleteGroup} onClick={(e) => { e.stopPropagation(); handleDeleteGroup(i); }}>×</span>
              )}
            </button>
          ))}
          {showNewGroup ? (
            <span className={styles.newGroupForm}>
              <input
                className={styles.input}
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                placeholder="群組名稱"
                autoFocus
              />
              <button className={styles.smallBtn} onClick={handleAddGroup}>✓</button>
              <button className={styles.smallBtn} onClick={() => setShowNewGroup(false)}>✕</button>
            </span>
          ) : (
            <button className={styles.addGroupBtn} onClick={() => setShowNewGroup(true)}>+ 群組</button>
          )}
        </div>
      </div>

      <div className={styles.addRow}>
        <input
          className={styles.input}
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
          placeholder="代碼或名稱，如 2330 或 台積電"
        />
        <button className={styles.addBtn} onClick={handleAddStock}>新增</button>
      </div>

      {loading && stocks.length > 0 && <div className={styles.loading}>載入中...</div>}

      <div className={styles.grid}>
        {stocks.map((code) => {
          const holding = toHolding(code, stockDataMap.get(code));
          return (
            <div key={code} className={styles.cardWrap}>
              <StockCard stock={holding} onClick={() => {}} />
              <button className={styles.removeBtn} onClick={() => handleRemoveStock(code)} aria-label={`移除 ${code}`}>✕</button>
            </div>
          );
        })}
      </div>
      {stocks.length === 0 && <p className={styles.empty}>尚未加入任何股票</p>}
    </section>
  );
}

function determineValuation(pe: number): StockValuationStatus {
  if (pe <= 10) return 'bargain';
  if (pe <= 15) return 'cheap';
  if (pe <= 20) return 'fair';
  if (pe <= 25) return 'overpriced';
  if (pe <= 30) return 'expensive';
  return 'crazy';
}

function toHolding(code: string, data?: StockData): StockHolding {
  const quote = data?.quote;
  const fund = data?.fund;
  const eps = fund?.forwardEps ?? fund?.trailingEps ?? 0;
  const price = quote?.price ?? 0;
  const valuationStatus: StockValuationStatus = eps > 0 ? determineValuation(price / eps) : 'fair';

  return {
    stockCode: code,
    stockName: STOCK_NAME_MAP[code] ?? code,
    currentPrice: price,
    priceChange: quote?.change ?? 0,
    changePercent: quote?.changePercent ?? 0,
    eps,
    valuationStatus,
  };
}
