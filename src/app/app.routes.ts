import { Routes } from '@angular/router';
import { UserSearchPage } from './features/user-search/pages/user-search-page/user-search-page';
import { UserDetailPage } from './features/user-search/pages/user-detail-page/user-detail-page';

export const routes: Routes = [
  { path: '', redirectTo: '/users', pathMatch: 'full' },
  { path: 'users', component: UserSearchPage },
  { path: 'users/:id', component: UserDetailPage }
];
