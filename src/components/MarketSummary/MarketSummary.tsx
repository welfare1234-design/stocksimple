import { useEffect, useState } from 'react';
import styles from './MarketSummary.module.css';

interface InstitutionalData {
  date: string;
  rows: { name: string; buy: string; sell: string; net: string }[];
}

interface MarginData {
  date: string;
  marginBalance: string;  // 融資餘額（張）
  shortBalance: string;   // 融券餘額（張）
  marginAmount: string;   // 融資金額（億）
  marginBuy: string;
  marginSell: string;
  marginChange: string;
  shortBuy: string;
  shortSell: string;
  shortChange: string;
}

export function MarketSummary() {
  const [inst, setInst] = useState<InstitutionalData | null>(null);
  const [margin, setMargin] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [instRes, marginRes] = await Promise.all([
          fetch('/api/twse/rwd/zh/fund/BFI82U?response=json'),
          fetch('/api/twse/rwd/zh/marginTrading/MI_MARGN?response=json&selectType=MS'),
        ]);

        const instJson = await instRes.json();
        const marginJson = await marginRes.json();

        if (!cancelled && instJson.stat === 'OK') {
          const dateStr = instJson.title?.match(/(\d+年\d+月\d+日)/)?.[1] ?? '';
          const rows = (instJson.data ?? []).map((r: string[]) => ({
            name: r[0],
            buy: formatBillion(r[1]),
            sell: formatBillion(r[2]),
            net: formatBillion(r[3]),
          }));
          setInst({ date: dateStr, rows });
        }

        if (!cancelled && marginJson.stat === 'OK') {
          const table = marginJson.tables?.[0];
          if (table?.data) {
            const d = table.data;
            // d[0]: 融資(交易單位) 買進, 賣出, 現金償還, 前日餘額, 今日餘額
            // d[1]: 融券(交易單位)
            // d[2]: 融資金額(仟元)
            setMargin({
              date: formatApiDate(marginJson.date),
              marginBalance: formatThousand(d[0]?.[4] ?? '0'),
              shortBalance: formatThousand(d[1]?.[4] ?? '0'),
              marginAmount: formatBillion((parseInt((d[2]?.[4] ?? '0').replace(/,/g, '')) * 1000).toString()),
              marginBuy: formatThousand(d[0]?.[0] ?? '0'),
              marginSell: formatThousand(d[0]?.[1] ?? '0'),
              marginChange: formatThousand(String(
                parseInt((d[0]?.[4] ?? '0').replace(/,/g, '')) - parseInt((d[0]?.[3] ?? '0').replace(/,/g, ''))
              )),
              shortBuy: formatThousand(d[1]?.[0] ?? '0'),
              shortSell: formatThousand(d[1]?.[1] ?? '0'),
              shortChange: formatThousand(String(
                parseInt((d[1]?.[4] ?? '0').replace(/,/g, '')) - parseInt((d[1]?.[3] ?? '0').replace(/,/g, ''))
              )),
            });
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  return (
    <section className={styles.container}>
      {/* 三大法人 */}
      {inst && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>👥 三大法人</span>
            <span className={styles.date}>{inst.date}</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th></th><th>買進</th><th>賣出</th><th>買賣超</th></tr>
            </thead>
            <tbody>
              {inst.rows.map((r, i) => (
                <tr key={i}>
                  <td>{simplifyName(r.name)}</td>
                  <td>{r.buy}</td>
                  <td>{r.sell}</td>
                  <td className={getNetClass(r.net, styles)}>{r.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 資券變化 */}
      {margin && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>📈 資券變化</span>
            <span className={styles.date}>{margin.date}</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th></th><th>買進</th><th>賣出</th><th>餘額變化</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>融資餘額</td>
                <td>{margin.marginBuy}</td>
                <td>{margin.marginSell}</td>
                <td className={getNetClass(margin.marginChange, styles)}>{margin.marginChange}萬張</td>
              </tr>
              <tr>
                <td>融券餘額</td>
                <td>{margin.shortBuy}</td>
                <td>{margin.shortSell}</td>
                <td className={getNetClass(margin.shortChange, styles)}>{margin.shortChange}張</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.summaryRow}>
            <div><span className={styles.label}>融資餘額</span><span className={styles.value}>{margin.marginBalance}萬張</span></div>
            <div><span className={styles.label}>融券餘額</span><span className={styles.value}>{margin.shortBalance}萬張</span></div>
            <div><span className={styles.label}>融資金額</span><span className={styles.value}>{margin.marginAmount}</span></div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatBillion(numStr: string): string {
  const num = parseInt(numStr.replace(/,/g, ''), 10);
  if (isNaN(num)) return numStr;
  const billion = num / 100000000;
  const sign = billion >= 0 ? '' : '';
  return `${sign}${Math.round(billion)}億`;
}

function formatThousand(numStr: string): string {
  const num = parseInt(numStr.replace(/,/g, ''), 10);
  if (isNaN(num)) return numStr;
  if (Math.abs(num) >= 10000) {
    return `${(num / 10000).toFixed(1)}萬`;
  }
  return num.toLocaleString();
}

function formatApiDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const y = parseInt(dateStr.slice(0, 4)) - 1911;
  return `${y}年${dateStr.slice(4, 6)}月${dateStr.slice(6, 8)}日`;
}

function simplifyName(name: string): string {
  return name
    .replace('(自行買賣)', '')
    .replace('(避險)', '避險')
    .replace('外資及陸資(不含外資自營商)', '外資')
    .replace('外資自營商', '外資自營商');
}

function getNetClass(val: string, s: Record<string, string>): string {
  if (val.startsWith('-')) return s.negative;
  if (val !== '0' && val !== '0億' && !val.startsWith('0')) return s.positive;
  return '';
}
