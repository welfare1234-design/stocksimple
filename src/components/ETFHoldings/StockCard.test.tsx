import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockCard } from './StockCard';
import type { StockHolding } from '../../types';

const baseStock: StockHolding = {
  stockCode: '2330',
  stockName: '台積電',
  currentPrice: 985.00,
  priceChange: 15.00,
  changePercent: 1.55,
  eps: 39.2,
  valuationStatus: 'fair',
};

describe('StockCard', () => {
  it('renders stock name, code, price, change, EPS, and valuation badge', () => {
    render(<StockCard stock={baseStock} onClick={() => {}} />);

    expect(screen.getByText('台積電')).toBeInTheDocument();
    expect(screen.getByText('2330')).toBeInTheDocument();
    expect(screen.getByText('985')).toBeInTheDocument();
    expect(screen.getByText('+1.55%')).toBeInTheDocument();
    expect(screen.getByText('EPS 39.2')).toBeInTheDocument();
    expect(screen.getByText('合理')).toBeInTheDocument();
  });

  it('applies red color for positive price change', () => {
    render(<StockCard stock={baseStock} onClick={() => {}} />);

    const percentEl = screen.getByText('+1.55%');
    expect(percentEl).toHaveStyle({ color: '#ff4444' });
  });

  it('applies green color for negative price change', () => {
    const downStock: StockHolding = {
      ...baseStock,
      priceChange: -10.00,
      changePercent: -1.02,
    };
    render(<StockCard stock={downStock} onClick={() => {}} />);

    const percentEl = screen.getByText('-1.02%');
    expect(percentEl).toHaveStyle({ color: '#00c853' });
  });

  it('applies neutral color for zero change', () => {
    const flatStock: StockHolding = {
      ...baseStock,
      priceChange: 0,
      changePercent: 0,
    };
    render(<StockCard stock={flatStock} onClick={() => {}} />);

    const percentEl = screen.getByText('0.00%');
    expect(percentEl).toHaveStyle({ color: '#a0a0a0' });
  });

  it('displays valuation badge with correct color for each status', () => {
    const statuses = [
      { status: 'bargain', label: '特價', color: '#388e3c' },
      { status: 'cheap', label: '便宜', color: '#66bb6a' },
      { status: 'fair', label: '合理', color: '#fdd835' },
      { status: 'overpriced', label: '偏高', color: '#ff9800' },
      { status: 'expensive', label: '昂貴', color: '#f44336' },
      { status: 'crazy', label: '瘋狂', color: '#b71c1c' },
    ] as const;

    for (const { status, label, color } of statuses) {
      const { unmount } = render(
        <StockCard stock={{ ...baseStock, valuationStatus: status }} onClick={() => {}} />,
      );
      const badge = screen.getByText(label);
      expect(badge).toHaveStyle({ backgroundColor: color });
      unmount();
    }
  });

  it('calls onClick with stockCode when clicked', async () => {
    const handleClick = vi.fn();
    render(<StockCard stock={baseStock} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('2330');
  });

  it('calls onClick with stockCode on Enter key', async () => {
    const handleClick = vi.fn();
    render(<StockCard stock={baseStock} onClick={handleClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledWith('2330');
  });
});
