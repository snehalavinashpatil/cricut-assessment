import { Component, Input } from '@angular/core';
import { IUser } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  @Input() users: IUser[] = [];
}
