import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, map, tap, catchError, of, BehaviorSubject, shareReplay } from 'rxjs';
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
      console.log('Creating new getAllUsers$ cache - API URL:', this.api);
      this.allUsers$ = this.http.get<IUser[]>(this.api).pipe(
        delay(500), // simulate loading
        tap(users => {
          console.log('API Response received:', users);
          // Merge API data with saved localStorage updates
          const mergedUsers = this.mergeWithSavedUpdates(users);
          // Store users in local cache
          this.usersSubject.next(mergedUsers);
        }),
        catchError(error => {
          console.error('API Error:', error);
          // Try to load from localStorage if API fails
          const savedUsers = this.getSavedUsersFromStorage();
          if (savedUsers && savedUsers.length > 0) {
            console.log('Loaded users from localStorage (fallback):', savedUsers);
            this.usersSubject.next(savedUsers);
            return of(savedUsers);
          }
          return of([]);
        }),
        shareReplay(1) // Cache the result for subsequent calls
      );
    }
    return this.allUsers$;
  }

  getUserById(id: number): Observable<IUser> {
    // Check if we already have a cached observable for this user
    if (!this.userById$.has(id)) {
      console.log('Creating new getUserById$ cache - API URL:', `${this.api}/${id}`);
      const userObs$ = this.http.get<IUser>(`${this.api}/${id}`).pipe(
        delay(500), // simulate loading
        tap(user => {
          console.log('User API Response received:', user);
          // Check if there's a saved version of this user
          const savedUser = this.getSavedUserFromStorage(id);
          if (savedUser) {
            console.log('Using saved version of user:', savedUser);
          }
        }),
        catchError(error => {
          console.error('API Error for user', id, ':', error);
          // Try to load from localStorage if API fails
          const savedUser = this.getSavedUserFromStorage(id);
          if (savedUser) {
            console.log('Loaded user from localStorage (fallback):', savedUser);
            return of(savedUser);
          }
          throw error;
        }),
        shareReplay(1) // Cache the result for this specific user
      );
      this.userById$.set(id, userObs$);
    }
    return this.userById$.get(id)!;
  }

  updateUser(user: IUser): Observable<IUser> {
    console.log('updateUser called with:', user);
    // Since JSONPlaceholder is read-only, we'll simulate the update
    // by storing it in our local cache and localStorage
    return of(user).pipe(
      delay(500),
      tap(updatedUser => {
        this.updateLocalCache(updatedUser);
        // Invalidate cache after update so next call fetches fresh data
        this.invalidateCache();
        console.log('User updated successfully:', updatedUser);
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
      console.log('User cache and localStorage updated');
    }
  }

  private invalidateCache(): void {
    console.log('Invalidating RxJS cache');
    this.allUsers$ = undefined; // Clear the all users cache
    this.userById$.clear(); // Clear all individual user caches
  }

  /**
   * Manually clear the cache if needed
   * Useful if you need to force a fresh API call
   */
  clearCache(): void {
    console.log('Manually clearing RxJS cache');
    this.invalidateCache();
  }

  private saveUsersToStorage(users: IUser[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
      console.log('Users saved to localStorage');
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  }

  private getSavedUsersFromStorage(): IUser[] | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const users = JSON.parse(saved) as IUser[];
        console.log('Loaded users from localStorage:', users);
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
          console.log('Loaded user from localStorage:', user);
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

    // Merge: use saved version if exists, otherwise use API version
    return apiUsers.map(apiUser => {
      const savedUser = savedUsers.find(u => u.id === apiUser.id);
      return savedUser || apiUser;
    });
  }
}
