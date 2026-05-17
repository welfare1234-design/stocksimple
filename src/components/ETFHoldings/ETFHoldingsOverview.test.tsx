import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ETFHoldingsOverview } from './ETFHoldingsOverview';
import type { StockHolding } from '../../types';

const availableETFs = ['0059', '0051', '0052', '0053', '0056', '00878', '00919', '00929', '00940'];

const sampleHoldings: StockHolding[] = [
  {
    stockCode: '2330',
    stockName: '台積電',
    currentPrice: 985,
    priceChange: 15,
    changePercent: 1.55,
    eps: 39.2,
    valuationStatus: 'fair',
  },
  {
    stockCode: '2317',
    stockName: '鴻海',
    currentPrice: 178,
    priceChange: -2,
    changePercent: -1.11,
    eps: 10.5,
    valuationStatus: 'cheap',
  },
];

const defaultProps = {
  availableETFs,
  selectedETF: '0056',
  onETFChange: vi.fn(),
  holdings: sampleHoldings,
  onStockClick: vi.fn(),
};

describe('ETFHoldingsOverview', () => {
  it('renders all ETF code tabs', () => {
    render(<ETFHoldingsOverview {...defaultProps} />);
    for (const etf of availableETFs) {
      expect(screen.getByText(etf)).toBeInTheDocument();
    }
  });

  it('marks selected ETF tab as active', () => {
    render(<ETFHoldingsOverview {...defaultProps} selectedETF="00878" />);
    expect(screen.getByText('00878')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('0059')).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onETFChange when an ETF tab is clicked', async () => {
    const handler = vi.fn();
    render(<ETFHoldingsOverview {...defaultProps} onETFChange={handler} />);
    await userEvent.click(screen.getByText('00919'));
    expect(handler).toHaveBeenCalledWith('00919');
  });

  it('renders stock cards for all holdings', () => {
    render(<ETFHoldingsOverview {...defaultProps} />);
    expect(screen.getByText('台積電')).toBeInTheDocument();
    expect(screen.getByText('鴻海')).toBeInTheDocument();
  });

  it('calls onStockClick when a stock card is clicked', async () => {
    const handler = vi.fn();
    render(<ETFHoldingsOverview {...defaultProps} onStockClick={handler} />);
    await userEvent.click(screen.getByLabelText('台積電 2330'));
    expect(handler).toHaveBeenCalledWith('2330');
  });
});
