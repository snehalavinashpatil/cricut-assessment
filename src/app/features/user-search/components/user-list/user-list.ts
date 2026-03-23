import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IUser } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, MatExpansionModule],
  standalone: true,
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss'],
})
export class UserList {
  @Input() users: IUser[] = [];

  constructor(private router: Router) {}

  navigateToUserDetail(userId: number) {
    this.router.navigate(['/users', userId]);
  }

  trackById(index: number, user: IUser): number {
    return user.id;
  }
}
