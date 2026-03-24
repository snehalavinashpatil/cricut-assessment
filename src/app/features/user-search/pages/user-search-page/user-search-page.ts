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
  savedSearchQuery = '';
  private destroy$ = new Subject<void>();
  private readonly SEARCH_STORAGE_KEY = 'current_search_query';

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.restoreSearchQuery();
    this.loadAllUsers();
    
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedUsers => {
        if (updatedUsers && updatedUsers.length > 0) {
          this.allUsers = updatedUsers;
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
    this.loading = true;
    this.error = false;
    this.cdr.markForCheck();
    
    this.userService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ loadAllUsers() - Subscribe error:', err);
          this.error = true;
          this.loading = false;
          this.cdr.markForCheck();
        },
        complete: () => {
        }
      });
  }

  onSearch(query: string) {
    this.currentSearchQuery = query;
    this.savedSearchQuery = query;
    this.saveSearchQuery(query);
    
    if (!query || query.trim() === '') {
      this.users = [...this.allUsers];
    } else {
      this.users = this.allUsers.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
    }
    this.cdr.markForCheck();
  }

  private saveSearchQuery(query: string): void {
    try {
      sessionStorage.setItem(this.SEARCH_STORAGE_KEY, query);
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  }

  private restoreSearchQuery(): void {
    try {
      const savedQuery = sessionStorage.getItem(this.SEARCH_STORAGE_KEY);
      if (savedQuery) {
        this.savedSearchQuery = savedQuery;
        this.currentSearchQuery = savedQuery;
      }
    } catch (error) {
      console.error('Error restoring search query:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

