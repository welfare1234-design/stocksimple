import type { MarketIndex } from '../../types';
import { getChangeColor } from '../../utils/colors';
import { formatNumber, formatPercent } from '../../utils/formatting';
import styles from './IndexCard.module.css';

export interface IndexCardProps {
  index: MarketIndex;
}

export function IndexCard({ index }: IndexCardProps) {
  const changeColor = getChangeColor(index.changePercent);

  return (
    <article className={styles.card} aria-label={index.name}>
      <span className={styles.name}>{index.name}</span>

      <span className={styles.value}>{formatNumber(index.value)}</span>

      <div className={styles.changeRow}>
        <span style={{ color: changeColor }}>
          {index.change > 0 ? '+' : ''}{formatNumber(index.change)}
        </span>
        <span style={{ color: changeColor }}>
          {formatPercent(index.changePercent)}
        </span>
      </div>

      <span className={styles.updatedDate}>{index.updatedDate}</span>

      {index.semanticLabel && (
        <span className={styles.semanticLabel}>{index.semanticLabel}</span>
      )}
    </article>
  );
}
