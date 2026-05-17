import { useState } from 'react';
import type { MarketIndex } from '../../types';
import { IndexCard } from './IndexCard';
import styles from './IndexOverview.module.css';

export interface IndexOverviewProps {
  indices: MarketIndex[];
}

/** 手機版預設顯示的指數 */
const PINNED_IDS = ['taiex', 'sox'];

export function IndexOverview({ indices }: IndexOverviewProps) {
  const [expanded, setExpanded] = useState(false);

  const pinned = indices.filter((i) => PINNED_IDS.includes(i.id));
  const rest = indices.filter((i) => !PINNED_IDS.includes(i.id));

  return (
    <section className={styles.container} aria-label="全球指數總覽">
      <h2 className={styles.sectionTitle}>加權指數</h2>
      <p className={styles.sourceText}>資料來源：Yahoo Finance</p>
      {/* 桌面版：全部橫向排列 */}
      <div className={styles.desktopRow} role="list">
        {indices.map((index) => (
          <div key={index.id} role="listitem">
            <IndexCard index={index} />
          </div>
        ))}
      </div>

      {/* 手機版：釘選 + 可展開 */}
      <div className={styles.mobileSection}>
        <div className={styles.mobileRow} role="list">
          {pinned.map((index) => (
            <div key={index.id} role="listitem">
              <IndexCard index={index} />
            </div>
          ))}
        </div>

        {expanded && (
          <div className={styles.mobileRow} role="list">
            {rest.map((index) => (
              <div key={index.id} role="listitem">
                <IndexCard index={index} />
              </div>
            ))}
          </div>
        )}

        <button
          className={styles.toggleBtn}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? '收合其他指數 ▲' : `展開其他 ${rest.length} 項指數 ▼`}
        </button>
      </div>
    </section>
  );
}
