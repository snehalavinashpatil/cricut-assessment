import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { UserService } from './user';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.removeItem('app_users_cache');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('app_users_cache');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and return cached users when localStorage has data', () => {
    const savedUsers = [{ id: 1, name: 'Saved', username: 'user1', email: 'saved@a.com', phone: '111-1111', website: 'saved.com', address: { street: 'X', suite: '1', city: 'C', zipcode: '00000', geo: { lat: '0', lng: '0' } }, company: { name: 'Co', catchPhrase: 'CP', bs: 'BS' } }];
    const apiUsers = [{ id: 1, name: 'API', username: 'user1', email: 'api@a.com', phone: '222-2222', website: 'api.com', address: { street: 'Y', suite: '1', city: 'C', zipcode: '00000', geo: { lat: '0', lng: '0' } }, company: { name: 'Co', catchPhrase: 'CP', bs: 'BS' } }];

    localStorage.setItem('app_users_cache', JSON.stringify(savedUsers));

    const results: unknown[] = [];
    service.getAllUsers().subscribe(value => results.push(value));

    const req = httpMock.expectOne('https://jsonplaceholder.typicode.com/users');
    expect(req.request.method).toBe('GET');
    req.flush(apiUsers);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(results.length).toBe(2);
        expect(results[0]).toEqual(savedUsers);
        expect(results[1]).toEqual(savedUsers);
        expect(JSON.parse(localStorage.getItem('app_users_cache')!)).toEqual(savedUsers);
        resolve();
      }, 600);
    });
  });

  it('should update user and keep cache in sync', () => {
    const existingUser = { id: 1, name: 'Old', username: 'old', email: 'old@a.com', phone: '111', website: 'old.com', address: { street: 'A', suite: '1', city: 'C', zipcode: '99999', geo: { lat: '0', lng: '0' } }, company: { name: 'OldCo', catchPhrase: 'Old', bs: 'Old' } };
    service['usersSubject'].next([existingUser]);

    const updatedUser = { ...existingUser, name: 'New' };
    let saved: any;
    service.updateUser(updatedUser).subscribe(value => (saved = value));

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(saved).toEqual(updatedUser);
        expect(service['usersSubject'].value[0].name).toBe('New');
        expect(JSON.parse(localStorage.getItem('app_users_cache')!)[0].name).toBe('New');
        expect(service['userById$'].has(1)).toBe(true);
        resolve();
      }, 600);
    });
  });
});
