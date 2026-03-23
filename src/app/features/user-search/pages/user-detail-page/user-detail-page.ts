import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { IUser } from '../../models/user.model';
import { UserService } from '../../../../core/services/user';

@Component({
  selector: 'app-user-detail-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
})
export class UserDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  userForm: FormGroup | undefined;
  user: IUser | null = null;
  loading = false;
  saving = false;

  ngOnInit() {
    const userIdParam = this.route.snapshot.paramMap.get('id');
    console.log('Route param id:', userIdParam);
    const userId = Number(userIdParam);
    console.log('Parsed userId:', userId);
    if (userId && !isNaN(userId)) {
      this.loadUser(userId);
    } else {
      console.error('Invalid user ID from route');
      this.loading = false;
    }
  }

  private loadUser(userId: number) {
    this.loading = true;
    console.log('Loading user with ID:', userId);
    this.userService.getUserById(userId).subscribe({
      next: (user: IUser) => {
        console.log('User data received:', user);
        this.user = user;
        this.initializeForm();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading user:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initializeForm() {
    if (!this.user) {
      console.error('User is null in initializeForm');
      return;
    }
    
    try {
      console.log('Initializing form with user data:', this.user);
      
      // Ensure company and address exist as default objects
      const company = this.user.company || { name: '', catchPhrase: '', bs: '' };
      const address = this.user.address || { street: '', suite: '', city: '', zipcode: '', geo: { lat: '', lng: '' } };
      const geo = address.geo || { lat: '', lng: '' };
      
      this.userForm = this.fb.group({
        name: [this.user.name || '', [Validators.required, Validators.minLength(2)]],
        username: [this.user.username || '', [Validators.required]],
        email: [this.user.email || '', [Validators.required, Validators.email]],
        phone: [this.user.phone || '', [Validators.required]],
        website: [this.user.website || '', [Validators.required]],
        company: this.fb.group({
          name: [company.name || ''],
          catchPhrase: [company.catchPhrase || ''],
          bs: [company.bs || '']
        }),
        address: this.fb.group({
          street: [address.street || ''],
          suite: [address.suite || ''],
          city: [address.city || ''],
          zipcode: [address.zipcode || ''],
          geo: this.fb.group({
            lat: [geo.lat || ''],
            lng: [geo.lng || '']
          })
        })
      });
      
      console.log('Form successfully created:', this.userForm.value);
      console.log('Form status:', this.userForm.status);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error creating form:', error);
    }
  }

  onSave() {
    if (!this.userForm) {
      console.error('Form is not initialized');
      return;
    }
    
    if (this.userForm.valid && this.user) {
      this.saving = true;
      const formValue = this.userForm.value;
      
      // Merge form values with existing user object
      const updatedUser: IUser = {
        ...this.user,
        ...formValue,
        // Ensure nested objects are properly merged
        company: {
          ...this.user.company,
          ...formValue.company
        },
        address: {
          ...this.user.address,
          ...formValue.address,
          geo: {
            ...this.user.address?.geo,
            ...formValue.address?.geo
          }
        }
      };
      
      console.log('Saving user:', updatedUser);
      
      // Call the update service method
      this.userService.updateUser(updatedUser).subscribe({
        next: (savedUser: IUser) => {
          console.log('User saved successfully:', savedUser);
          // Update the local user object to reflect changes
          this.user = savedUser;
          // Re-initialize form with updated data
          this.initializeForm();
          this.saving = false;
          this.cdr.detectChanges();
          // Navigate back to user list after a short delay to ensure cache updates are complete
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 100);
        },
        error: (error: any) => {
          console.error('Error saving user:', error);
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!this.userForm.valid) {
        console.error('Form is invalid');
      }
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/users']);
  }

  private markFormGroupTouched() {
    if (!this.userForm) return;
    
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm?.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    if (!this.userForm) return '';
    
    const control = this.userForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters`;
    }
    return '';
  }
}
