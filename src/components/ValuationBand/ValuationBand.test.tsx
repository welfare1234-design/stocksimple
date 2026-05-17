import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValuationBand } from './ValuationBand';
import type { ValuationLevel } from '../../types';

const sampleBands: ValuationLevel[] = [
  { name: 'panic',      displayName: '恐慌', entryRatio: 100, deviationRate: -30, indexValue: 14000, color: '#1b5e20' },
  { name: 'crash',      displayName: '崩跌', entryRatio: 100, deviationRate: -20, indexValue: 16000, color: '#2e7d32' },
  { name: 'bargain',    displayName: '特價', entryRatio: 100, deviationRate: -15, indexValue: 17000, color: '#388e3c' },
  { name: 'cheap',      displayName: '便宜', entryRatio: 100, deviationRate: -10, indexValue: 18000, color: '#66bb6a' },
  { name: 'fair',       displayName: '合理', entryRatio: 70,  deviationRate: 0,   indexValue: 20000, color: '#fdd835' },
  { name: 'overpriced', displayName: '偏高', entryRatio: 50,  deviationRate: 10,  indexValue: 22000, color: '#ff9800' },
  { name: 'expensive',  displayName: '昂貴', entryRatio: 30,  deviationRate: 20,  indexValue: 24000, color: '#f44336' },
  { name: 'crazy',      displayName: '瘋狂', entryRatio: 10,  deviationRate: 30,  indexValue: 26000, color: '#b71c1c' },
];

const defaultProps = {
  currentIndex: 20500,
  yearlyChange: 5.23,
  yearlyAverage: 19500,
  bands: sampleBands,
};

describe('ValuationBand', () => {
  /** Validates: Requirements 3.2 */
  it('renders all 8 valuation levels', () => {
    render(<ValuationBand {...defaultProps} />);

    const expectedNames = ['恐慌', '崩跌', '特價', '便宜', '合理', '偏高', '昂貴', '瘋狂'];
    for (const name of expectedNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  /** Validates: Requirements 3.5 */
  it('shows arrow indicator on the correct level based on currentIndex', () => {
    // currentIndex 20500 is >= 20000 (fair) but < 22000 (overpriced), so level = fair
    render(<ValuationBand {...defaultProps} />);

    const arrow = screen.getByTestId('current-arrow');
    expect(arrow).toBeInTheDocument();

    // The arrow should be inside the "合理" cell
    const fairCell = arrow.closest('[role="cell"]');
    expect(fairCell).not.toBeNull();
    expect(fairCell!.textContent).toContain('合理');
  });

  it('moves arrow when currentIndex changes to a different level', () => {
    // currentIndex 25000 is >= 24000 (expensive) but < 26000 (crazy), so level = expensive
    render(<ValuationBand {...defaultProps} currentIndex={25000} />);

    const arrow = screen.getByTestId('current-arrow');
    const cell = arrow.closest('[role="cell"]');
    expect(cell!.textContent).toContain('昂貴');
  });

  /** Validates: Requirements 3.6 */
  it('displays correct entry ratio values for each level', () => {
    render(<ValuationBand {...defaultProps} />);

    const cells = screen.getAllByRole('cell');
    // Bands are sorted by indexValue ascending, so order is: panic, crash, bargain, cheap, fair, overpriced, expensive, crazy
    const expectedRatios = ['100%', '100%', '100%', '100%', '70%', '50%', '30%', '10%'];

    cells.forEach((cell, index) => {
      expect(cell.textContent).toContain(expectedRatios[index]);
    });
  });

  it('displays summary section with formatted current index, yearly change, and yearly average', () => {
    render(<ValuationBand {...defaultProps} />);

    // formatNumber(20500) => "20,500"
    expect(screen.getByText('20,500')).toBeInTheDocument();
    // formatPercent(5.23) => "+5.23%"
    expect(screen.getByText('+5.23%')).toBeInTheDocument();
    // formatNumber(19500) => "19,500"
    expect(screen.getByText('19,500')).toBeInTheDocument();
    // Labels
    expect(screen.getByText('加權指數')).toBeInTheDocument();
    expect(screen.getByText(/年漲幅/)).toBeInTheDocument();
    expect(screen.getByText(/年均值/)).toBeInTheDocument();
  });
});
