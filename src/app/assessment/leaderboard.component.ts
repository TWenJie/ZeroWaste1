// src/app/assessment/leaderboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssessmentService } from '../services/assessment.service';
import { LeaderboardEntry } from '../interfaces/assessment.interface';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  leaderboard: LeaderboardEntry[] = [];
  loading: boolean = true;
  
  private destroy$ = new Subject<void>();
  private currentUserId: string = '';

  constructor(private assessmentService: AssessmentService) {
    // Subscribe to the userProgress$ observable to get current user ID
    this.assessmentService.userProgress$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(progress => {
      if (progress) {
        this.currentUserId = progress.userId;
      }
    });
  }

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.loading = true;
    
    this.assessmentService.getLeaderboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Loaded leaderboard:', data);
          this.leaderboard = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading leaderboard:', error);
          this.loading = false;
        }
      });
  }

  isCurrentUser(entry: LeaderboardEntry): boolean {
    return entry.id === this.currentUserId;
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'warning'; // Gold
    if (rank === 2) return 'light';   // Silver
    if (rank === 3) return 'tertiary'; // Bronze
    return 'medium';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}