import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  imports: [],
  standalone: true,
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
})
export class SearchInput implements OnDestroy {
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  @Output() search = new EventEmitter<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => this.search.emit(value));
  }

  onInput(event: any) {
    this.searchSubject.next(event.target.value);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
