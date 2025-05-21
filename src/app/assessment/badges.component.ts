// src/app/assessment/badges.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssessmentService } from '../services/assessment.service';
import { Badge } from '../interfaces/assessment.interface';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.scss']
})
export class BadgesComponent implements OnInit, OnDestroy {
  badges: Badge[] = [];
  loading: boolean = true;
  
  private destroy$ = new Subject<void>();

  constructor(private assessmentService: AssessmentService) {}

  ngOnInit() {
    this.loadBadges();
  }

  loadBadges() {
    this.loading = true;
    
    this.assessmentService.getAvailableBadges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (badges) => {
          console.log('Loaded badges:', badges);
          this.badges = badges;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading badges:', error);
          this.loading = false;
          // Could implement retry or other error handling here
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}