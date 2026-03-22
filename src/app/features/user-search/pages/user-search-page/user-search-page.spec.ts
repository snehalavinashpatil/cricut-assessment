import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSearchPage } from './user-search-page';

describe('UserSearchPage', () => {
  let component: UserSearchPage;
  let fixture: ComponentFixture<UserSearchPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSearchPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSearchPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
