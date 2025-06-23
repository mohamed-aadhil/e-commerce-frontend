import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';

// Import models
import { 
  Genre, 
  GenreDistribution, 
  PriceAnalysisData, 
  PriceAnalysisProduct,
  StockLevelData,
  StockLevelStats,
  StockLevelUpdate
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = '/api/v1/analytics';

  constructor(
    private http: HttpClient,
    private websocketService: WebSocketService
  ) {}

  /**
   * Get all available genres
   */
  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[] | { success: boolean; data: Genre[] }>('/api/v1/genres').pipe(
      map(response => {
        // Handle both array response and success-wrapped response
        return Array.isArray(response) ? response : (response?.data || []);
      }),
      catchError(error => {
        console.error('Error fetching genres:', error);
        return of([]);
      })
    );
  }

  /**
   * Alias for getGenres() for backward compatibility
   */
  getAllGenres(): Observable<Genre[]> {
    return this.getGenres();
  }

  /**
   * Get the current genre distribution data
   */
  getGenreDistribution(): Observable<GenreDistribution[]> {
    return this.http.get<{ success: boolean; data: GenreDistribution[] }>(`${this.apiUrl}/genre-distribution`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Format genre data for Chart.js
   */
  prepareChartData(genreData: GenreDistribution[]): {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number }[];
  } {
    // Sort by book count in descending order
    const sortedData = [...genreData].sort((a, b) => b.bookCount - a.bookCount);
    
    // Get top 10 genres and group the rest as 'Others'
    const topGenres = sortedData.slice(0, 9);
    const otherGenres = sortedData.slice(9);
    
    const labels = topGenres.map(g => g.name);
    const data = topGenres.map(g => g.bookCount);
    
    // Add 'Others' category if there are remaining genres
    if (otherGenres.length > 0) {
      const otherCount = otherGenres.reduce((sum, genre) => sum + genre.bookCount, 0);
      labels.push('Others');
      data.push(otherCount);
    }
    
    // Generate colors for the chart
    const backgroundColors = this.generateChartColors(labels.length);
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => this.adjustColor(c, -20)), // Slightly darker for border
        borderWidth: 1
      }]
    };
  }
  
  /**
   * Get price analysis data for a specific genre
   * @param genreId The ID of the genre to analyze
   */
  getPriceAnalysis(genreId: number): Observable<{ success: boolean; data: PriceAnalysisData }> {
    return this.http.get<{ success: boolean; data: PriceAnalysisData } | PriceAnalysisData>(
      `${this.apiUrl}/price-analysis/${genreId}`
    ).pipe(
      map(response => {
        // Handle both response formats: { success, data } or direct PriceAnalysisData
        const isWrappedResponse = response && typeof response === 'object' && 'success' in response;
        const responseData = isWrappedResponse ? (response as any).data : response as PriceAnalysisData;
        
        if (!responseData) {
          console.error('No data in price analysis response');
          return {
            success: false,
            data: {
              products: [],
              stats: {
                avgCostPrice: 0,
                avgSellingPrice: 0,
                avgProfitMargin: 0,
                totalProducts: 0
              }
            }
          };
        }

        
        // Ensure we have valid products array and stats
        const products = Array.isArray((responseData as any).products) 
          ? (responseData as any).products 
          : [];
          
        const stats = (responseData as any).stats || {
          avgCostPrice: 0,
          avgSellingPrice: 0,
          avgProfitMargin: 0,
          totalProducts: 0
        };

        // Map the response data to match the PriceAnalysisData interface
        const priceAnalysisData: PriceAnalysisData = {
          products: products.map((product: any) => ({
            id: product.id,
            title: product.title || 'Untitled',
            costPrice: Number(product.costPrice) || 0,
            sellingPrice: Number(product.sellingPrice) || 0,
            profitMargin: Number(product.profitMargin) || 0
          })),
          stats: {
            avgCostPrice: Number(stats.avgCostPrice) || 0,
            avgSellingPrice: Number(stats.avgSellingPrice) || 0,
            avgProfitMargin: Number(stats.avgProfitMargin) || 0,
            totalProducts: Number(stats.totalProducts) || 0
          }
        };

        return {
          success: true,
          data: priceAnalysisData
        };
      }),
      catchError(error => {
        console.error('Error fetching price analysis:', error);
        return of({
          success: false,
          data: {
            products: [],
            stats: {
              avgCostPrice: 0,
              avgSellingPrice: 0,
              avgProfitMargin: 0,
              totalProducts: 0
            }
          }
        });
      })
    );
  }

  /**
   * Prepare price analysis data for a bar chart
   */
  preparePriceChartData(products: PriceAnalysisProduct[]): {
    labels: string[];
    costPrices: number[];
    sellingPrices: number[];
  } {
    // Ensure products is an array before mapping
    const validProducts = Array.isArray(products) ? products : [];
    const labels = validProducts.map(p => p.title || 'Untitled');
    const costPrices = validProducts.map(p => p.costPrice || 0);
    const sellingPrices = validProducts.map(p => p.sellingPrice || 0);
    
    return { labels, costPrices, sellingPrices };
  }

  /**
   * Generate a set of visually distinct colors for the chart
   */
  private generateChartColors(count: number): string[] {
    const colors = [
      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
      '#5a5c69', '#858796', '#5a5c69', '#3a3b45', '#2e59d9'
    ];
    
    // If we need more colors than we have predefined, generate some
    if (count > colors.length) {
      for (let i = colors.length; i < count; i++) {
        colors.push(this.getRandomColor());
      }
    }
    
    return colors.slice(0, count);
  }
  
  /**
   * Generate a random color
   */
  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  /**
   * Adjust color brightness
   */
  private adjustColor(color: string, amount: number): string {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
      ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
  }

  /**
   * Get stock levels data, optionally filtered by genre
   * @param genreId Optional genre ID to filter by
   */
  getStockLevels(genreId?: number): Observable<StockLevelData> {
    const url = genreId 
      ? `${this.apiUrl}/stock-levels/${genreId}`
      : `${this.apiUrl}/stock-levels`;
      
    return this.http.get<{ success: boolean; data: StockLevelData }>(url).pipe(
      map(response => {
        const data = response.data || { products: [], stats: this.getEmptyStockStats() };
        // Calculate inStockCount if not provided
        if (data.stats && data.stats.totalProducts !== undefined) {
          data.stats.inStockCount = data.stats.totalProducts - 
            (data.stats.lowStockCount || 0) - 
            (data.stats.outOfStockCount || 0);
        }
        return data;
      }),
      catchError(error => {
        console.error('Error fetching stock levels:', error);
        return of({
          products: [],
          stats: this.getEmptyStockStats()
        });
      })
    );
  }

  /**
   * Subscribe to real-time stock level updates
   * @param genreId Optional genre ID to filter by
   * @param callback Function to call when updates are received
   * @returns Unsubscribe function
   */
  subscribeToStockLevelUpdates(genreId: number | null, callback: (data: StockLevelData) => void): () => void {
    // Subscribe to inventory updates
    const subscription = this.websocketService.getInventoryUpdates().subscribe({
      next: (update: StockLevelUpdate | null) => {
        if (update) {
          // If we're filtering by a specific genre, only process matching updates
          if (genreId === null || (update.genreId !== undefined && update.genreId === genreId)) {
            // Calculate inStockCount if not provided
            const stockData = update.stockLevels;
            if (stockData.stats && stockData.stats.totalProducts !== undefined) {
              stockData.stats.inStockCount = 
                stockData.stats.totalProducts - 
                (stockData.stats.lowStockCount || 0) - 
                (stockData.stats.outOfStockCount || 0);
            }
            callback(stockData);
          }
        }
      },
      error: (error) => {
        console.error('Error in stock level subscription:', error);
      }
    });

    // Join the analytics room
    this.websocketService.joinAnalyticsRoom();
    
    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get empty stock level stats object
   */
  private getEmptyStockStats(): StockLevelStats {
    return {
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inStockCount: 0,
      totalProducts: 0
    };
  }
}
