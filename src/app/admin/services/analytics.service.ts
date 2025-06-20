import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface GenreDistribution {
  id: number;
  name: string;
  bookCount: number;
}

export interface GenreStats {
  totalBooks: number;
  totalGenres: number;
  mostPopularGenre: {
    id: number;
    name: string;
    bookCount: number;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = '/api/v1/analytics';

  constructor(private http: HttpClient) {}

  /**
   * Get the current genre distribution data
   */
  getGenreDistribution(): Observable<GenreDistribution[]> {
    return this.http.get<{ success: boolean; data: GenreDistribution[] }>(`${this.apiUrl}/genre-distribution`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get genre statistics
   */
  getGenreStats(): Observable<GenreStats> {
    return this.http.get<{ success: boolean; data: GenreStats }>(`${this.apiUrl}/genre-stats`).pipe(
      map(response => response.data)
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
}
