import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { GenreDataUpdate, PriceDataUpdate } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket;
  private connected = new BehaviorSubject<boolean>(false);
  private genreUpdates = new BehaviorSubject<GenreDataUpdate | null>(null);
  private priceUpdates = new BehaviorSubject<PriceDataUpdate | null>(null);

  constructor() {
    // Initialize socket connection
    this.socket = io(environment.apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    // Set up event listeners
    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    // Connection status
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected.next(true);
      this.joinAnalyticsRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected.next(false);
    });

    // Handle genre data updates
    this.socket.on('genre-data-updated', (data: GenreDataUpdate) => {
      console.log('Received genre data update:', data);
      this.genreUpdates.next(data);
    });

    // Handle price data updates
    this.socket.on('price-data-updated', (data: PriceDataUpdate) => {
      console.log('Received price data update for genre:', data.genreId);
      this.priceUpdates.next(data);
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected.next(false);
    });
  }

  /**
   * Join the analytics room to receive updates
   */
  private joinAnalyticsRoom(): void {
    this.socket.emit('joinAnalyticsRoom');
  }

  /**
   * Check if the socket is currently connected
   */
  isConnected(): boolean {
    return this.socket.connected;
  }

  /**
   * Reconnect to the WebSocket server
   */
  reconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket.connected) {
        resolve();
        return;
      }

      const onConnect = () => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        resolve();
      };

      const onError = (error: any) => {
        this.socket.off('connect', onConnect);
        this.socket.off('connect_error', onError);
        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
      this.socket.connect();
    });
  }

  /**
   * Get the current connection status as an Observable
   */
  get connectionStatus$(): Observable<boolean> {
    return this.connected.asObservable();
  }

  /**
   * Get observable for genre data updates
   */
  getGenreUpdates(): Observable<GenreDataUpdate | null> {
    return this.genreUpdates.asObservable();
  }

  /**
   * Get observable for price data updates
   */
  getPriceUpdates(): Observable<PriceDataUpdate | null> {
    return this.priceUpdates.asObservable();
  }

  /**
   * Connect to WebSocket server and return an observable of events
   */
  connect(): Observable<{ type: string; [key: string]: any }> {
    return new Observable(subscriber => {
      // Emit current connection status
      subscriber.next({
        type: this.connected.value ? 'connected' : 'disconnected'
      });

      // Subscribe to connection status changes
      const connectionSub = this.connected.subscribe(isConnected => {
        subscriber.next({
          type: isConnected ? 'connected' : 'disconnected'
        });
      });

      // Subscribe to genre updates
      const genreSub = this.genreUpdates.subscribe(update => {
        if (update) {
          subscriber.next({
            type: 'genre-data-updated',
            ...update
          });
        }
      });

      // Subscribe to price updates
      const priceSub = this.priceUpdates.subscribe(update => {
        if (update) {
          subscriber.next({
            type: 'price-data-updated',
            ...update
          });
        }
      });

      // Cleanup function
      return () => {
        connectionSub.unsubscribe();
        genreSub.unsubscribe();
        priceSub.unsubscribe();
      };
    });
  }

  /**
   * Clean up on service destruction
   */
  ngOnDestroy(): void {
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('genre-data-updated');
    this.socket.off('connect_error');
    this.socket.disconnect();
  }
}
