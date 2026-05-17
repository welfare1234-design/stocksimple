import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexCard } from './IndexCard';
import type { MarketIndex } from '../../types';

const baseIndex: MarketIndex = {
  id: 'taiex',
  name: '加權指數',
  value: 22345.67,
  change: 123.45,
  changePercent: 0.56,
  updatedDate: '2024/06/15',
};

describe('IndexCard', () => {
  it('renders index name, value, change, percent, and date', () => {
    render(<IndexCard index={baseIndex} />);

    expect(screen.getByText('加權指數')).toBeInTheDocument();
    expect(screen.getByText('22,345.67')).toBeInTheDocument();
    expect(screen.getByText('+0.56%')).toBeInTheDocument();
    expect(screen.getByText('2024/06/15')).toBeInTheDocument();
  });

  it('applies red color for positive change', () => {
    render(<IndexCard index={baseIndex} />);

    const percentEl = screen.getByText('+0.56%');
    expect(percentEl).toHaveStyle({ color: '#ff4444' });
  });

  it('applies green color for negative change', () => {
    const downIndex: MarketIndex = {
      ...baseIndex,
      change: -89.12,
      changePercent: -0.4,
    };
    render(<IndexCard index={downIndex} />);

    const percentEl = screen.getByText('-0.40%');
    expect(percentEl).toHaveStyle({ color: '#00c853' });
  });

  it('applies neutral color for zero change', () => {
    const flatIndex: MarketIndex = {
      ...baseIndex,
      change: 0,
      changePercent: 0,
    };
    render(<IndexCard index={flatIndex} />);

    const percentEl = screen.getByText('0.00%');
    expect(percentEl).toHaveStyle({ color: '#a0a0a0' });
  });

  it('renders semantic label when provided', () => {
    const indexWithLabel: MarketIndex = {
      ...baseIndex,
      semanticLabel: '偏空',
    };
    render(<IndexCard index={indexWithLabel} />);

    expect(screen.getByText('偏空')).toBeInTheDocument();
  });

  it('does not render semantic label when not provided', () => {
    render(<IndexCard index={baseIndex} />);

    expect(screen.queryByText('偏空')).not.toBeInTheDocument();
    expect(screen.queryByText('極度恐懼')).not.toBeInTheDocument();
  });
});
