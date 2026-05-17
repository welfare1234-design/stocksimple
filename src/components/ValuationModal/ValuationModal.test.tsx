import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValuationModal } from './ValuationModal';
import type { StockDetail } from '../../types';
import { formatCurrency } from '../../utils/formatting';

const mockStock: StockDetail = {
  stockCode: '2330',
  stockName: '台積電',
  exchange: 'TWSE',
  currentPrice: 985.0,
  priceChange: 15.0,
  changePercent: 1.55,
  marketCap: 25530000,
  estimatedEPS: 39.2,
  estimatedYear: 2025,
  valuationStatus: 'fair',
  peRatios: [
    { level: 'bargain', displayName: '特價', peRatio: 12, targetPrice: 470.4 },
    { level: 'cheap', displayName: '便宜', peRatio: 15, targetPrice: 588.0 },
    { level: 'fair', displayName: '合理', peRatio: 20, targetPrice: 784.0 },
    { level: 'overpriced', displayName: '偏高', peRatio: 25, targetPrice: 980.0 },
    { level: 'expensive', displayName: '昂貴', peRatio: 30, targetPrice: 1176.0 },
    { level: 'crazy', displayName: '瘋狂', peRatio: 35, targetPrice: 1372.0 },
  ],
};

describe('ValuationModal', () => {
  it('renders basic stock info: name, code, exchange, price, EPS, valuation badge', () => {
    render(<ValuationModal stock={mockStock} onClose={() => {}} />);

    expect(screen.getByText('台積電')).toBeInTheDocument();
    expect(screen.getByText('2330')).toBeInTheDocument();
    expect(screen.getByText('TWSE')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(985.0))).toBeInTheDocument();
    // '合理' appears in both the badge and the PE table; verify at least one exists
    expect(screen.getAllByText('合理').length).toBeGreaterThanOrEqual(1);
    // EPS with year
    expect(screen.getByText(/預估 EPS（2025）/)).toBeInTheDocument();
  });

  it('renders all 6 PE ratio levels in the table', () => {
    render(<ValuationModal stock={mockStock} onClose={() => {}} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // 1 header row + 6 data rows
    expect(rows).toHaveLength(7);

    const levels = ['特價', '便宜', '合理', '偏高', '昂貴', '瘋狂'];
    for (const level of levels) {
      expect(within(table).getByText(level)).toBeInTheDocument();
    }
  });

  it('target price calculation consistency: EPS × PE = target price for each row', () => {
    render(<ValuationModal stock={mockStock} onClose={() => {}} />);

    const table = screen.getByRole('table');

    for (const pe of mockStock.peRatios) {
      const expectedTarget = mockStock.estimatedEPS * pe.peRatio;
      expect(pe.targetPrice).toBeCloseTo(expectedTarget, 2);
      // Also verify the formatted target price appears in the table
      expect(within(table).getByText(formatCurrency(pe.targetPrice))).toBeInTheDocument();
    }
  });

  it('calls onClose when clicking the overlay (backdrop)', async () => {
    const handleClose = vi.fn();
    render(<ValuationModal stock={mockStock} onClose={handleClose} />);

    const overlay = screen.getByRole('dialog');
    // Click directly on the overlay element (not a child)
    await userEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the close button', async () => {
    const handleClose = vi.fn();
    render(<ValuationModal stock={mockStock} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: '關閉' });
    await userEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
