import { ChangeDetectorRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { UserService } from '../../../../core/services/user';
import { UserDetailPage } from './user-detail-page';

describe('UserDetailPage', () => {
  let component: UserDetailPage;
  let fixture: ComponentFixture<UserDetailPage>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    username: 'test',
    email: 'test@example.com',
    phone: '123-456',
    website: 'example.com',
    address: { street: '', suite: '', city: '', zipcode: '', geo: { lat: '', lng: '' } },
    company: { name: '', catchPhrase: '', bs: '' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailPage],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => {}, markForCheck: () => {} } },
        { provide: UserService, useValue: { getUserById: () => of(mockUser), updateUser: () => of(mockUser) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
