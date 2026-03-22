import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, map, tap, catchError, of } from 'rxjs';
import { IUser } from '../../features/user-search/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService  {
   private api = 'https://jsonplaceholder.typicode.com/users';

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.api).pipe(
      delay(500), // simulate loading
      map(users =>
        users.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  getAllUsers(): Observable<IUser[]> {
    console.log('getAllUsers called - API URL:', this.api);
    return this.http.get<IUser[]>(this.api).pipe(
      delay(500), // simulate loading
      tap(users => {
        console.log('API Response received:', users);
      }),
      catchError(error => {
        console.error('API Error:', error);
        return of([]);
      })
    );
  }
}
