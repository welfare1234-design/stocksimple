import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexOverview } from './IndexOverview';
import type { MarketIndex } from '../../types';

const sampleIndices: MarketIndex[] = [
  {
    id: 'taiex',
    name: '加權指數',
    value: 22345.67,
    change: 123.45,
    changePercent: 0.56,
    updatedDate: '2024/06/15',
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    value: 5432.1,
    change: -12.34,
    changePercent: -0.23,
    updatedDate: '2024/06/15',
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    value: 17890.5,
    change: 45.67,
    changePercent: 0.26,
    updatedDate: '2024/06/15',
  },
];

describe('IndexOverview', () => {
  it('renders a card for each index', () => {
    render(<IndexOverview indices={sampleIndices} />);

    expect(screen.getByText('加權指數')).toBeInTheDocument();
    expect(screen.getByText('S&P 500')).toBeInTheDocument();
    expect(screen.getByText('NASDAQ')).toBeInTheDocument();
  });

  it('renders section with accessible label', () => {
    render(<IndexOverview indices={sampleIndices} />);

    expect(screen.getByRole('region', { name: '全球指數總覽' })).toBeInTheDocument();
  });

  it('renders list items for each index', () => {
    render(<IndexOverview indices={sampleIndices} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('renders empty list when no indices provided', () => {
    render(<IndexOverview indices={[]} />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
