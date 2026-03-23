import { Component, EventEmitter, Output, OnDestroy, OnInit, Input } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-input',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  standalone: true,
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
})
export class SearchInput implements OnDestroy, OnInit {
  @Input() initialValue: string = '';
  @Output() search = new EventEmitter<string>();
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  searchValue: string = '';

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => this.search.emit(value));
  }

  ngOnInit() {
    // Restore initial search value
    this.searchValue = this.initialValue;
  }

  onInput(event: any) {
    this.searchValue = event.target.value;
    this.searchSubject.next(event.target.value);
  }

  onClear() {
    this.searchValue = '';
    this.searchSubject.next('');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
