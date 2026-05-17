export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export type HoldingsFilter = 'all' | 'hot' | 'limit_up' | 'limit_down';

export type ValuationLevelName =
  | 'panic'
  | 'crash'
  | 'bargain'
  | 'cheap'
  | 'fair'
  | 'overpriced'
  | 'expensive'
  | 'crazy';

export type StockValuationStatus =
  | 'bargain'
  | 'cheap'
  | 'fair'
  | 'overpriced'
  | 'expensive'
  | 'crazy';

export interface MarketIndex {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  updatedDate: string;
  semanticLabel?: string;
}

export interface ValuationLevel {
  name: ValuationLevelName;
  displayName: string;
  entryRatio: number;
  deviationRate: number;
  indexValue: number;
  color: string;
}

export interface TaiexValuation {
  currentIndex: number;
  yearlyChangePercent: number;
  yearlyAverage: number;
  currentLevel: ValuationLevelName;
  bands: ValuationLevel[];
}

export interface StockHolding {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  priceChange: number;
  changePercent: number;
  eps: number;
  valuationStatus: StockValuationStatus;
}

export interface StockDetail {
  stockCode: string;
  stockName: string;
  exchange: string;
  currentPrice: number;
  priceChange: number;
  changePercent: number;
  marketCap: number;
  estimatedEPS: number;
  estimatedYear: number;
  valuationStatus: StockValuationStatus;
  peRatios: PERatioLevel[];
}

export interface PERatioLevel {
  level: StockValuationStatus;
  displayName: string;
  peRatio: number;
  targetPrice: number;
}
