import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserSearchPage } from './features/user-search/pages/user-search-page/user-search-page';

@Component({
  selector: 'app-root',
  imports: [UserSearchPage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cricut-assessment');
}
