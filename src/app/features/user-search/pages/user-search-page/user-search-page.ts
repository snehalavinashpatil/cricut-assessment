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
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {
    console.log('UserSearchPage component created');
  }

  ngOnInit() {
    console.log('UserSearchPage ngOnInit called');
    this.loadAllUsers();
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
          this.allUsers = users;
          this.users = users;
          this.loading = false;
          this.cdr.markForCheck();
          console.log('✅ Component users array updated:', this.users);
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

  ngOnDestroy() {
    console.log('UserSearchPage ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }
}

