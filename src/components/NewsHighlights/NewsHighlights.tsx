import { useEffect, useState } from 'react';
import styles from './NewsHighlights.module.css';

interface NewsItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  source?: string;
}

export function NewsHighlights() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/yahoo-news');
        const data = await res.json();
        if (!cancelled) setNews(data.items ?? []);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className={styles.loading}>載入新聞中...</div>;
  if (news.length === 0) return null;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>產業焦點導航</h2>
      </div>
      <p className={styles.subtitle}>快速掌握每日核心題材與連動關係 — 資料來源：Yahoo 股市、中央社、鉅亨網</p>

      <div className={styles.grid}>
        {news.slice(0, 6).map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={styles.card}>
            <div className={styles.cardHeader}>
              {item.source && (
                <span className={`${styles.source} ${item.source === '中央社' ? styles.sourceCna : styles.sourceYahoo}`}>
                  {item.source}
                </span>
              )}
              <span className={styles.date}>📅 {formatDate(item.pubDate)}</span>
            </div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.source && <span className={styles.sourceInline}>來源：{item.source}</span>}
            <p className={styles.cardDesc}>{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
}
