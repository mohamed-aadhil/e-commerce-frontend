import { Component } from '@angular/core';

@Component({
  selector: 'app-shared-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class SharedFooter {
  public currentYear = new Date().getFullYear();
} 