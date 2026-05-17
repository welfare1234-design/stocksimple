import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationBar } from './NavigationBar';

describe('NavigationBar', () => {
  const defaultProps = {
    currentPage: 'daily',
    onNavigate: vi.fn(),
  };

  it('renders logo', () => {
    render(<NavigationBar {...defaultProps} />);
    expect(screen.getByAltText('Stocksimple')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(<NavigationBar {...defaultProps} />);
    expect(screen.getByText('每日焦點')).toBeInTheDocument();
    expect(screen.getByText('ETF 持股')).toBeInTheDocument();
    expect(screen.getByText('籌碼追蹤')).toBeInTheDocument();
  });
});
