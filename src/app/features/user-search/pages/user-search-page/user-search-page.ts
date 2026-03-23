import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UserService  } from '../../../../core/services/user';
import { IUser } from '../../models/user.model';
import { UserList } from '../../components/user-list/user-list';
import { CommonModule } from '@angular/common';
import { SearchInput } from '../../components/search-input/search-input';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-search-page',
  imports: [UserList, CommonModule, SearchInput],
  templateUrl: './user-search-page.html',
  styleUrl: './user-search-page.scss',
})
export class UserSearchPage implements OnInit, OnDestroy {
  allUsers: IUser[] = [];
  users: IUser[] = [];
  loading = false;
  error = false;
  private currentSearchQuery = '';
  savedSearchQuery = ''; // For binding to search input
  private destroy$ = new Subject<void>();
  private readonly SEARCH_STORAGE_KEY = 'current_search_query';

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {
    console.log('UserSearchPage component created');
  }

  ngOnInit() {
    console.log('UserSearchPage ngOnInit called');
    // Clear cache to ensure fresh data on navigation
    this.userService.clearCache();
    // Restore search query from sessionStorage
    this.restoreSearchQuery();
    this.loadAllUsers();
    
    // Subscribe to user updates from the service
    // This will automatically update the list when a user is modified
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedUsers => {
        console.log('User list updated from service:', updatedUsers);
        if (updatedUsers && updatedUsers.length > 0) {
          this.allUsers = updatedUsers;
          // Re-apply current search filter if any
          if (this.currentSearchQuery && this.currentSearchQuery.trim() !== '') {
            this.onSearch(this.currentSearchQuery);
          } else {
            this.users = [...this.allUsers];
          }
          this.cdr.markForCheck();
        }
      });
  }

  loadAllUsers() {
    console.log('loadAllUsers() - Starting to load users');
    this.loading = true;
    this.error = false;
    this.cdr.markForCheck();
    
    this.userService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          console.log('✅ loadAllUsers() - Subscribe next received:', users);
          console.log('✅ Users loaded count:', users ? users.length : 0);
          // Don't set this.users here - let the users$ subscription handle filtering
          this.loading = false;
          this.cdr.markForCheck();
          console.log('✅ Users loaded, filtering will be applied by subscription');
        },
        error: (err) => {
          console.error('❌ loadAllUsers() - Subscribe error:', err);
          this.error = true;
          this.loading = false;
          this.cdr.markForCheck();
        },
        complete: () => {
          console.log('✅ loadAllUsers() - Subscribe complete');
        }
      });
  }

  onSearch(query: string) {
    console.log('onSearch() called with query:', query);
    this.currentSearchQuery = query;
    this.savedSearchQuery = query;
    // Persist search query to sessionStorage
    this.saveSearchQuery(query);
    
    if (!query || query.trim() === '') {
      this.users = [...this.allUsers];
      console.log('Filtered results count if:', this.users.length);
    } else {
      this.users = this.allUsers.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      console.log('Filtered results count else:', this.users.length);
    }
    this.cdr.markForCheck();
  }

  private saveSearchQuery(query: string): void {
    try {
      sessionStorage.setItem(this.SEARCH_STORAGE_KEY, query);
      console.log('Search query saved to sessionStorage:', query);
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  }

  private restoreSearchQuery(): void {
    try {
      const savedQuery = sessionStorage.getItem(this.SEARCH_STORAGE_KEY);
      if (savedQuery) {
        console.log('Restored search query from sessionStorage:', savedQuery);
        this.savedSearchQuery = savedQuery;
        this.currentSearchQuery = savedQuery;
      }
    } catch (error) {
      console.error('Error restoring search query:', error);
    }
  }

  ngOnDestroy() {
    console.log('UserSearchPage ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }
}

