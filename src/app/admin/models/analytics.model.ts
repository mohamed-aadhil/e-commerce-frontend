export interface Genre {
  id: number;
  name: string;
}

export interface PriceAnalysisProduct {
  id: number;
  title: string;
  costPrice: number;
  sellingPrice: number;
  profitMargin: number;
}

export interface PriceAnalysisStats {
  avgCostPrice: number;
  avgSellingPrice: number;
  avgProfitMargin: number;
  totalProducts: number;
}

export interface PriceAnalysisData {
  products: PriceAnalysisProduct[];
  stats: PriceAnalysisStats;
}

export interface GenreDistribution {
  id: number;
  name: string;
  bookCount: number;
  productCount?: number;
  percentage?: number;
}

export interface GenreDataUpdate {
  timestamp: string;
  genreDistribution: GenreDistribution[];
}

export interface PriceDataUpdate {
  genreId: number;
  timestamp: string;
  priceAnalysis: PriceAnalysisData;
}

export interface PriceUpdateEvent {
  genreId: number;
  timestamp: Date;
  updatedFields: {
    costPrice?: number;
    sellingPrice?: number;
  };
}

export interface StockLevelProduct {
  id: number;
  title: string;
  currentStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  genreId?: number;
  genreName?: string;
}

export interface StockLevelStats {
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
  totalProducts: number;
}

export interface StockLevelData {
  products: StockLevelProduct[];
  stats: StockLevelStats;
}

export interface StockLevelUpdate {
  timestamp: string;
  stockLevels: StockLevelData;
  genreId?: number; // Optional, used for filtering updates by genre
}
