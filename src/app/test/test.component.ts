import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SessionInfo {
  sessionId: string;
  counter: number;
  cookie: any;
}

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Session Test</h2>
      
      <div class="mb-4">
        <button 
          (click)="testSession()" 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Session
        </button>
      </div>

      <div *ngIf="sessionInfo" class="mt-4 p-4 border rounded">
        <h3 class="font-bold mb-2">Session Information:</h3>
        <pre class="text-sm bg-gray-100 p-2 rounded overflow-auto">
{{ sessionInfo | json }}
        </pre>
      </div>

      <div *ngIf="error" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 class="font-bold">Error:</h3>
        <pre class="text-sm">{{ error | json }}</pre>
      </div>
    </div>
  `,
  styles: []
})
export class TestComponent {
  sessionInfo: SessionInfo | null = null;
  error: any = null;

  constructor(private http: HttpClient) {}

  testSession() {
    this.error = null;
    console.log('Testing session...');
    
    this.http.get<SessionInfo>('/api/v1/test/session')
      .subscribe({
        next: (response) => {
          console.log('Session response:', response);
          this.sessionInfo = response;
        },
        error: (err) => {
          console.error('Session test error:', err);
          this.error = err;
        }
      });
  }
}
