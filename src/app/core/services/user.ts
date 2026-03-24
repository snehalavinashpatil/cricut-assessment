import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, concat, delay, map, tap, catchError, of, BehaviorSubject, shareReplay } from 'rxjs';
import { IUser } from '../../features/user-search/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService  {
   private api = 'https://jsonplaceholder.typicode.com/users';
   private usersSubject = new BehaviorSubject<IUser[]>([]);
   public users$ = this.usersSubject.asObservable();
   private readonly STORAGE_KEY = 'app_users_cache';
   
   // RxJS Caching
   private allUsers$?: Observable<IUser[]>;
   private userById$ = new Map<number, Observable<IUser>>();

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<IUser[]> {
    // Use the cached getAllUsers instead of making a new HTTP request
    return this.getAllUsers().pipe(
      map(users =>
        users.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  getAllUsers(): Observable<IUser[]> {
    if (!this.allUsers$) {
      const savedUsers = this.getSavedUsersFromStorage();
      if (savedUsers && savedUsers.length > 0) {
        this.usersSubject.next(savedUsers);
      }

      const api$ = this.http.get<IUser[]>(this.api).pipe(
        delay(500), // simulate loading
        map(users => this.mergeWithSavedUpdates(users)),
        tap(mergedUsers => {
          this.usersSubject.next(mergedUsers);
          this.saveUsersToStorage(mergedUsers);
        }),
        catchError(error => {
          console.error('API Error:', error);
          const fallbackUsers = this.getSavedUsersFromStorage();
          if (fallbackUsers && fallbackUsers.length > 0) {
            this.usersSubject.next(fallbackUsers);
            return of(fallbackUsers);
          }
          return of([]);
        })
      );

      this.allUsers$ = savedUsers && savedUsers.length > 0
        ? concat(of(savedUsers), api$).pipe(shareReplay(1))
        : api$.pipe(shareReplay(1));
    }
    return this.allUsers$;
  }

  getUserById(id: number): Observable<IUser> {
    if (!this.userById$.has(id)) {
      const userObs$ = this.http.get<IUser>(`${this.api}/${id}`).pipe(
        delay(500),
        map(apiUser => {
          const savedUser = this.getSavedUserFromStorage(id);
          if (savedUser) {
            return { ...apiUser, ...savedUser };
          }
          return apiUser;
        }),
        tap(user => {
          const currentUsers = this.usersSubject.value;
          const index = currentUsers.findIndex(u => u.id === user.id);
          if (index >= 0) {
            const nextUsers = [...currentUsers];
            nextUsers[index] = user;
            this.usersSubject.next(nextUsers);
          } else {
            this.usersSubject.next([...currentUsers, user]);
          }

          this.userById$.set(id, of(user));
        }),
        catchError(error => {
          console.error('API Error for user', id, ':', error);
          const savedUser = this.getSavedUserFromStorage(id);
          if (savedUser) {
            return of(savedUser);
          }
          throw error;
        }),
        shareReplay(1)
      );
      this.userById$.set(id, userObs$);
    }
    return this.userById$.get(id)!;
  }

  updateUser(user: IUser): Observable<IUser> {
    return of(user).pipe(
      delay(500),
      tap(updatedUser => {
        this.updateLocalCache(updatedUser);
        this.userById$.set(updatedUser.id, of(updatedUser));
        if (this.allUsers$) {
          this.allUsers$ = of(this.usersSubject.value).pipe(shareReplay(1));
        }
      })
    );
  }

  private updateLocalCache(updatedUser: IUser): void {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(u => u.id === updatedUser.id);
    
    if (userIndex > -1) {
      currentUsers[userIndex] = updatedUser;
      const updatedList = [...currentUsers];
      this.usersSubject.next(updatedList);
      // Persist to localStorage
      this.saveUsersToStorage(updatedList);
    }
  }

  private invalidateCache(): void {
    this.allUsers$ = undefined;
    this.userById$.clear();
  }

  clearCache(): void {
    this.invalidateCache();
  }

  private saveUsersToStorage(users: IUser[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  }

  private getSavedUsersFromStorage(): IUser[] | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const users = JSON.parse(saved) as IUser[];
        return users;
      }
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
    }
    return null;
  }

  private getSavedUserFromStorage(id: number): IUser | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const users = JSON.parse(saved) as IUser[];
        const user = users.find(u => u.id === id);
        if (user) {
          return user;
        }
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
    return null;
  }

  private mergeWithSavedUpdates(apiUsers: IUser[]): IUser[] {
    const savedUsers = this.getSavedUsersFromStorage();
    if (!savedUsers || savedUsers.length === 0) {
      return apiUsers;
    }

    return apiUsers.map(apiUser => {
      const savedUser = savedUsers.find(u => u.id === apiUser.id);
      return savedUser || apiUser;
    });
  }
}
