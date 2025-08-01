// src/app/assessment/leaderboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, interval, merge, Observable, of } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { MongoDBService } from '../services/mongodb.service';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user.class';
import { 
  LeaderboardEntry, 
  DifficultyLevel, 
  AwarenessLevel, 
  ImprovementTrend,
  RankSnapshot,
  LeaderboardTimeframe 
} from '../interfaces/assessment.interface';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  leaderboard: LeaderboardEntry[] = [];
  previousLeaderboard: LeaderboardEntry[] = [];
  loading: boolean = true;
  selectedView: 'overall' | 'improved' | 'active' = 'overall';
  selectedTimeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME;
  currentUser: User | null = null;
  
  // Real-time update properties
  isRealTimeEnabled: boolean = true;
  refreshInterval: number = 30000; // 30 seconds
  lastUpdated: Date = new Date();
  rankingChanges: Map<string, { oldRank: number, newRank: number }> = new Map();
  
  // Animation and visual feedback
  recentlyUpdatedUsers: Set<string> = new Set();
  showRankingChanges: boolean = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private mongoService: MongoDBService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('🏆 Leaderboard component initialized with real-time updates');
    
    // Get current user for highlighting
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Initialize leaderboard and start real-time updates
    this.initializeRealTimeLeaderboard();
  }

  /**
   * Initialize real-time leaderboard with periodic updates
   */
  private initializeRealTimeLeaderboard() {
    console.log('🔄 Setting up real-time leaderboard updates...');
    
    // Create observable that combines:
    // 1. Initial load
    // 2. Periodic refresh every 30 seconds
    // 3. Manual refresh triggers
    const refreshTrigger$ = merge(
      // Initial load
      interval(0).pipe(startWith(0)),
      // Periodic updates every 30 seconds
      interval(this.refreshInterval)
    );

    refreshTrigger$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadLeaderboardData())
      )
      .subscribe({
        next: (newData) => {
          this.handleLeaderboardUpdate(newData);
        },
        error: (error) => {
          console.error('❌ Error in real-time leaderboard updates:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Load leaderboard data from service with timeframe
   */
  private loadLeaderboardData(): Observable<LeaderboardEntry[]> {
    console.log('📊 Loading leaderboard data for timeframe:', this.selectedTimeframe);
    
    // Check if MongoDB service has the updated getLeaderboard method
    if (this.mongoService.getLeaderboard) {
      // Try to call with timeframe parameter
      try {
        return this.mongoService.getLeaderboard(this.selectedTimeframe);
      } catch (error) {
        console.warn('⚠️ MongoDB service getLeaderboard with timeframe failed, trying without timeframe:', error);
        // Fallback to calling without parameters
        return this.mongoService.getLeaderboard();
      }
    } else {
      console.warn('⚠️ MongoDB service does not have getLeaderboard method, using mock data');
      // Return mock data as fallback
      return this.getMockLeaderboardData();
    }
  }

  /**
   * Get mock leaderboard data for development/testing
   */
  private getMockLeaderboardData(): Observable<LeaderboardEntry[]> {
    const mockData: LeaderboardEntry[] = [
      {
        id: 'user1',
        userName: 'EcoWarrior2024',
        displayName: 'Eco Warrior',
        score: 95,
        rank: 1,
        totalAssessments: 25,
        averageScore: 95,
        streak: 7,
        badges: 8,
        lastActive: new Date(),
        isOnline: true,
        level: DifficultyLevel.ADVANCED,
        awarenessLevel: AwarenessLevel.EXPERT,
        improvementTrend: ImprovementTrend.IMPROVING,
        studyTime: 120,
        weeklyAssessments: 5,
        monthlyAssessments: 20,
        perfectScoreCount: 10,
        helpfulVotes: 45,
        categoryExpertise: { 'zero-waste': 95, 'composting': 88 },
        rankingHistory: [],
        joinDate: new Date('2024-01-01'),
        daysActive: 30,
        longestStudySession: 180,
        favoriteCategory: 'zero-waste',
        followers: 12,
        following: 8,
        postsShared: 5,
        communityChallenges: 3
      },
      {
        id: 'user2',
        userName: 'GreenThumb',
        displayName: 'Green Thumb',
        score: 87,
        rank: 2,
        totalAssessments: 18,
        averageScore: 87,
        streak: 4,
        badges: 5,
        lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        isOnline: false,
        level: DifficultyLevel.INTERMEDIATE,
        awarenessLevel: AwarenessLevel.ADVANCED,
        improvementTrend: ImprovementTrend.STABLE,
        studyTime: 90,
        weeklyAssessments: 3,
        monthlyAssessments: 15,
        perfectScoreCount: 6,
        helpfulVotes: 23,
        categoryExpertise: { '3r-principles': 92, 'composting': 85 },
        rankingHistory: [],
        joinDate: new Date('2024-02-15'),
        daysActive: 20,
        longestStudySession: 120,
        favoriteCategory: '3r-principles',
        followers: 8,
        following: 15,
        postsShared: 2,
        communityChallenges: 1
      },
      {
        id: 'user3',
        userName: 'Recycler101',
        displayName: 'Recycler 101',
        score: 78,
        rank: 3,
        totalAssessments: 12,
        averageScore: 78,
        streak: 2,
        badges: 3,
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isOnline: false,
        level: DifficultyLevel.BEGINNER,
        awarenessLevel: AwarenessLevel.INTERMEDIATE,
        improvementTrend: ImprovementTrend.IMPROVING,
        studyTime: 45,
        weeklyAssessments: 2,
        monthlyAssessments: 8,
        perfectScoreCount: 2,
        helpfulVotes: 12,
        categoryExpertise: { 'composting': 80, 'zero-waste': 76 },
        rankingHistory: [],
        joinDate: new Date('2024-03-01'),
        daysActive: 15,
        longestStudySession: 90,
        favoriteCategory: 'composting',
        followers: 5,
        following: 10,
        postsShared: 1,
        communityChallenges: 0
      }
    ];

    // Add current user to mock data if available
    if (this.currentUser) {
      const currentUserEntry: LeaderboardEntry = {
        id: String(this.currentUser.id || this.currentUser.email), // Convert to string
        userName: this.currentUser.email,
        displayName: this.currentUser.email, // Use email since displayName doesn't exist
        score: 65,
        rank: 4,
        totalAssessments: 8,
        averageScore: 65,
        streak: 1,
        badges: 2,
        lastActive: new Date(),
        isOnline: true,
        level: DifficultyLevel.BEGINNER,
        awarenessLevel: AwarenessLevel.GROWING,
        improvementTrend: ImprovementTrend.IMPROVING,
        studyTime: 30,
        weeklyAssessments: 1,
        monthlyAssessments: 5,
        perfectScoreCount: 1,
        helpfulVotes: 3,
        categoryExpertise: { 'zero-waste': 65 },
        rankingHistory: [],
        joinDate: new Date(),
        daysActive: 5,
        longestStudySession: 45,
        favoriteCategory: 'zero-waste',
        followers: 2,
        following: 3,
        postsShared: 0,
        communityChallenges: 0
      };
      
      mockData.push(currentUserEntry);
    }

    return of(mockData);
  }

  /**
   * Handle leaderboard update with ranking change detection
   */
  private handleLeaderboardUpdate(newData: LeaderboardEntry[]) {
    console.log('🔄 Processing leaderboard update...', newData.length, 'entries');
    
    // Store previous state for comparison
    this.previousLeaderboard = [...this.leaderboard];
    
    // Update leaderboard data
    this.leaderboard = newData;
    this.lastUpdated = new Date();
    this.loading = false;
    
    // Detect and process ranking changes
    this.detectRankingChanges();
    
    // Clear recently updated users after animation period
    setTimeout(() => {
      this.recentlyUpdatedUsers.clear();
    }, 5000);
    
    console.log('✅ Leaderboard updated successfully');
  }

  /**
   * Detect ranking changes between old and new leaderboard data
   */
  private detectRankingChanges() {
    if (this.previousLeaderboard.length === 0) {
      console.log('📊 Initial leaderboard load - no ranking changes to detect');
      return;
    }

    console.log('🔍 Detecting ranking changes...');
    
    // Clear previous ranking changes
    this.rankingChanges.clear();
    this.recentlyUpdatedUsers.clear();
    
    // Get current filtered/sorted leaderboard for accurate ranking
    const currentSorted = this.filteredLeaderboard;
    const previousSorted = this.getSortedLeaderboard(this.previousLeaderboard);
    
    // Create ranking maps for comparison
    const currentRankings = new Map<string, number>();
    const previousRankings = new Map<string, number>();
    
    currentSorted.forEach((entry, index) => {
      currentRankings.set(entry.id || entry.userName, index + 1);
    });
    
    previousSorted.forEach((entry, index) => {
      previousRankings.set(entry.id || entry.userName, index + 1);
    });
    
    // Detect changes in rankings
    let changesDetected = 0;
    
    currentRankings.forEach((newRank, userId) => {
      const oldRank = previousRankings.get(userId);
      
      if (oldRank && oldRank !== newRank) {
        this.rankingChanges.set(userId, { oldRank, newRank });
        this.recentlyUpdatedUsers.add(userId);
        changesDetected++;
        
        console.log(`📈 Ranking change detected: User ${userId} moved from #${oldRank} to #${newRank}`);
      }
    });
    
    // Detect new users who weren't in previous leaderboard
    currentRankings.forEach((newRank, userId) => {
      if (!previousRankings.has(userId)) {
        this.recentlyUpdatedUsers.add(userId);
        console.log(`🆕 New user in leaderboard: ${userId} at rank #${newRank}`);
      }
    });
    
    // Check for score/attempt updates even without rank changes
    this.detectScoreUpdates(currentSorted, previousSorted);
    
    if (changesDetected > 0) {
      console.log(`✅ Detected ${changesDetected} ranking changes`);
      this.showRankingChangeNotification(changesDetected);
    } else {
      console.log('📊 No ranking changes detected');
    }
  }

  /**
   * Detect score or attempt updates without rank changes
   */
  private detectScoreUpdates(current: LeaderboardEntry[], previous: LeaderboardEntry[]) {
    const previousMap = new Map<string, LeaderboardEntry>();
    previous.forEach(entry => {
      previousMap.set(entry.id || entry.userName, entry);
    });
    
    current.forEach(currentEntry => {
      const userId = currentEntry.id || currentEntry.userName;
      const previousEntry = previousMap.get(userId);
      
      if (previousEntry) {
        // Check for score or attempt updates
        const scoreChanged = currentEntry.averageScore !== previousEntry.averageScore;
        const attemptsChanged = currentEntry.totalAssessments !== previousEntry.totalAssessments;
        
        if (scoreChanged || attemptsChanged) {
          this.recentlyUpdatedUsers.add(userId);
          console.log(`📊 Stats updated for user ${userId}:`, {
            scoreChanged: scoreChanged ? `${previousEntry.averageScore} → ${currentEntry.averageScore}` : 'No change',
            attemptsChanged: attemptsChanged ? `${previousEntry.totalAssessments} → ${currentEntry.totalAssessments}` : 'No change'
          });
        }
      }
    });
  }

  /**
   * Get sorted leaderboard based on current view
   */
  private getSortedLeaderboard(data: LeaderboardEntry[]): LeaderboardEntry[] {
    let sortedData = [...data];
    
    switch (this.selectedView) {
      case 'overall':
        return sortedData.sort((a, b) => b.averageScore - a.averageScore);
      
      case 'improved':
        return sortedData.sort((a, b) => {
          const aImprovement = a.improvementTrend === ImprovementTrend.IMPROVING ? 1 : 0;
          const bImprovement = b.improvementTrend === ImprovementTrend.IMPROVING ? 1 : 0;
          if (aImprovement !== bImprovement) {
            return bImprovement - aImprovement;
          }
          return b.streak - a.streak;
        });
      
      case 'active':
        return sortedData.sort((a, b) => b.totalAssessments - a.totalAssessments);
      
      default:
        return sortedData;
    }
  }

  /**
   * Show notification about ranking changes
   */
  private showRankingChangeNotification(changeCount: number) {
    // You can implement a toast notification here
    console.log(`🎉 ${changeCount} ranking changes detected! Leaderboard updated.`);
  }

  /**
   * Manual refresh trigger
   */
  refreshLeaderboard() {
    console.log('🔄 Manual leaderboard refresh triggered');
    this.loading = true;
    
    this.loadLeaderboardData().subscribe({
      next: (data) => {
        this.handleLeaderboardUpdate(data);
      },
      error: (error) => {
        console.error('❌ Manual refresh failed:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Toggle real-time updates
   */
  toggleRealTimeUpdates() {
    this.isRealTimeEnabled = !this.isRealTimeEnabled;
    
    if (this.isRealTimeEnabled) {
      console.log('✅ Real-time updates enabled');
      this.initializeRealTimeLeaderboard();
    } else {
      console.log('⏸️ Real-time updates disabled');
      // Real-time updates will stop due to takeUntil(this.destroy$)
    }
  }

  /**
   * Set leaderboard view and refresh
   */
  setView(view: 'overall' | 'improved' | 'active') {
    console.log('🔄 Switching leaderboard view to:', view);
    this.selectedView = view;
    
    // Recalculate ranking changes for new view
    if (this.previousLeaderboard.length > 0) {
      this.detectRankingChanges();
    }
  }

  /**
   * Set leaderboard timeframe and refresh
   */
  setTimeframe(timeframe: LeaderboardTimeframe) {
    console.log('📅 Switching leaderboard timeframe to:', timeframe);
    this.selectedTimeframe = timeframe;
    this.refreshLeaderboard();
  }

  /**
   * Get filtered and sorted leaderboard
   */
  get filteredLeaderboard(): LeaderboardEntry[] {
    if (!this.leaderboard || this.leaderboard.length === 0) {
      return [];
    }

    return this.getSortedLeaderboard(this.leaderboard);
  }

  /**
   * Check if user has ranking change indicator
   */
  hasRankingChange(userId: string): boolean {
    return this.rankingChanges.has(userId);
  }

  /**
   * Get ranking change for user
   */
  getRankingChange(userId: string): { oldRank: number, newRank: number } | null {
    return this.rankingChanges.get(userId) || null;
  }

  /**
   * Check if user was recently updated
   */
  isRecentlyUpdated(userId: string): boolean {
    return this.recentlyUpdatedUsers.has(userId);
  }

  /**
   * Check if current user
   */
  isCurrentUser(entry: LeaderboardEntry): boolean {
    if (!this.currentUser) return false;
    
    // Convert both to strings for safe comparison
    const entryId = String(entry.id);
    const currentUserId = String(this.currentUser.id);
    const currentUserEmail = String(this.currentUser.email);
    
    return entryId === currentUserId || 
           entry.userName === currentUserEmail || 
           entryId === currentUserEmail ||
           entry.userName === currentUserEmail;
  }

  /**
   * Get ranking change indicator text
   */
  getRankingChangeText(userId: string): string {
    const change = this.getRankingChange(userId);
    if (!change) return '';
    
    const direction = change.newRank < change.oldRank ? '↑' : '↓';
    const positions = Math.abs(change.newRank - change.oldRank);
    
    return `${direction} ${positions}`;
  }

  /**
   * Get CSS class for ranking change
   */
  getRankingChangeClass(userId: string): string {
    const change = this.getRankingChange(userId);
    if (!change) return '';
    
    return change.newRank < change.oldRank ? 'rank-up' : 'rank-down';
  }

  /**
   * Format last updated time
   */
  getLastUpdatedText(): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.lastUpdated.getTime()) / 1000);
    
    if (diff < 60) return `Updated ${diff}s ago`;
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    return `Updated ${Math.floor(diff / 3600)}h ago`;
  }

  /**
   * Force immediate refresh when user completes assessment
   */
  onUserAssessmentCompleted(userId?: string) {
    console.log('🎯 User assessment completed - forcing leaderboard refresh', userId ? `for user: ${userId}` : '');
    
    // If specific user is provided, highlight them when data refreshes
    if (userId) {
      this.recentlyUpdatedUsers.add(userId);
    }
    
    this.refreshLeaderboard();
  }

  /**
   * Get user's current rank
   */
  getUserRank(userId: string): number {
    const userEntry = this.filteredLeaderboard.find(entry => entry.id === userId || entry.userName === userId);
    return userEntry ? userEntry.rank : 0;
  }

  /**
   * Get user's rank change since last update
   */
  getUserRankChange(userId: string): { direction: 'up' | 'down' | 'same', positions: number } | null {
    const change = this.getRankingChange(userId);
    if (!change) return null;
    
    const positions = Math.abs(change.newRank - change.oldRank);
    const direction = change.newRank < change.oldRank ? 'up' : change.newRank > change.oldRank ? 'down' : 'same';
    
    return { direction, positions };
  }

  /**
   * Get difficulty level display text
   */
  getDifficultyDisplay(level: DifficultyLevel): string {
    switch (level) {
      case DifficultyLevel.BEGINNER: return 'Beginner';
      case DifficultyLevel.INTERMEDIATE: return 'Intermediate';
      case DifficultyLevel.ADVANCED: return 'Advanced';
      default: return 'Unknown';
    }
  }

  /**
   * Get awareness level display text
   */
  getAwarenessDisplay(level?: AwarenessLevel): string {
    if (!level) return 'Unknown';
    
    switch (level) {
      case AwarenessLevel.BEGINNER: return 'Beginner';
      case AwarenessLevel.GROWING: return 'Growing';
      case AwarenessLevel.INTERMEDIATE: return 'Intermediate';
      case AwarenessLevel.ADVANCED: return 'Advanced';
      case AwarenessLevel.EXPERT: return 'Expert';
      default: return 'Unknown';
    }
  }

  /**
   * Get improvement trend display
   */
  getImprovementDisplay(trend?: ImprovementTrend): { text: string, color: string, icon: string } {
    if (!trend) return { text: 'Unknown', color: 'gray', icon: '─' };
    
    switch (trend) {
      case ImprovementTrend.IMPROVING:
        return { text: 'Improving', color: 'success', icon: '↗️' };
      case ImprovementTrend.STABLE:
        return { text: 'Stable', color: 'warning', icon: '→' };
      case ImprovementTrend.DECLINING:
        return { text: 'Declining', color: 'danger', icon: '↘️' };
      default:
        return { text: 'Unknown', color: 'gray', icon: '─' };
    }
  }

  /**
   * Get timeframe display text
   */
  getTimeframeDisplay(timeframe: LeaderboardTimeframe): string {
    switch (timeframe) {
      case LeaderboardTimeframe.DAILY: return 'Today';
      case LeaderboardTimeframe.WEEKLY: return 'This Week';
      case LeaderboardTimeframe.MONTHLY: return 'This Month';
      case LeaderboardTimeframe.ALL_TIME: return 'All Time';
      default: return 'All Time';
    }
  }

  /**
   * Check if user is in top performers
   */
  isTopPerformer(rank: number): boolean {
    return rank <= 3;
  }

  /**
   * Get user's activity status
   */
  getUserActivityStatus(entry: LeaderboardEntry): { status: string, color: string } {
    const now = new Date();
    const lastActive = new Date(entry.lastActive);
    const minutesSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (entry.isOnline) {
      return { status: 'Online', color: 'success' };
    } else if (minutesSinceActive < 60) {
      return { status: `${minutesSinceActive}m ago`, color: 'warning' };
    } else if (minutesSinceActive < 1440) { // 24 hours
      const hours = Math.floor(minutesSinceActive / 60);
      return { status: `${hours}h ago`, color: 'medium' };
    } else {
      const days = Math.floor(minutesSinceActive / 1440);
      return { status: `${days}d ago`, color: 'dark' };
    }
  }

  /**
   * Format large numbers with suffixes (1.2k, 1.5M, etc.)
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * Get user's badge count display
   */
  getBadgeCountDisplay(count: number): string {
    if (count === 0) return 'No badges';
    if (count === 1) return '1 badge';
    return `${this.formatNumber(count)} badges`;
  }

  /**
   * Track by function for Angular ngFor optimization
   */
  trackByUserId(index: number, entry: LeaderboardEntry): string {
    return entry.id || entry.userName;
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up leaderboard component');
    this.destroy$.next();
    this.destroy$.complete();
  }
}