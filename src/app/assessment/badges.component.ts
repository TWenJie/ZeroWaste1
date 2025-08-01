import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssessmentService } from '../services/assessment.service';
import { 
  Badge, 
  UserAssessmentProgress, 
  BadgeCategory, 
  BadgeRarity,
  DifficultyLevel,
  CATEGORIES
} from '../interfaces/assessment.interface';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.scss']
})
export class BadgesComponent implements OnInit, OnDestroy {
  allBadges: Badge[] = [];
  earnedBadges: Badge[] = [];
  selectedCategory: string | 'all' = 'all';
  loading: boolean = true;
  error: string | null = null;
  userProgress: UserAssessmentProgress | null = null;
  
  badgeStats = {
    totalEarned: 0,
    totalAvailable: 0,
    completionPercentage: 0,
    totalPoints: 0,
    recentBadges: [] as Badge[]
  };

  categories = [
    { value: 'all', label: 'All Categories', icon: 'apps-outline' },
    { value: CATEGORIES.ZERO_WASTE, label: 'Zero Waste', icon: 'leaf-outline' },
    { value: CATEGORIES.THREE_R, label: '3R Principles', icon: 'reload-outline' },
    { value: CATEGORIES.COMPOSTING, label: 'Composting', icon: 'nutrition-outline' },
    { value: BadgeCategory.ASSESSMENT, label: 'Assessment', icon: 'school-outline' },
    { value: BadgeCategory.STREAK, label: 'Streak', icon: 'flame-outline' },
    { value: BadgeCategory.MASTERY, label: 'Mastery', icon: 'trophy-outline' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(private assessmentService: AssessmentService) {}

  ngOnInit() {
    this.loadUserProgress();
    this.loadBadges();
  }

  loadUserProgress() {
    this.assessmentService.userProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.userProgress = progress;
          if (progress) {
            this.earnedBadges = progress.badgesEarned || [];
            this.updateBadgeStats();
          }
        },
        error: (error) => {
          this.error = 'Failed to load user progress';
        }
      });
  }

  loadBadges() {
    this.loading = true;
    this.error = null;
    
    this.assessmentService.getAvailableBadges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (badges) => {
          this.allBadges = badges;
          this.updateBadgeStats();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load badges. Please try again.';
          this.loading = false;
          this.loadFallbackBadges();
        }
      });
  }

  private loadFallbackBadges() {
    this.allBadges = [
      {
        id: 'first-assessment',
        name: 'First Steps',
        description: 'Complete your first assessment',
        category: BadgeCategory.ASSESSMENT,
        rarity: BadgeRarity.COMMON,
        points: 50,
        requirements: [
          { type: 'assessments_completed', value: 1, description: 'Complete 1 assessment' }
        ],
        criteria: 'Complete any assessment',
        icon: 'school-outline',
        color: '#4CAF50'
      },
      {
        id: 'streak-starter',
        name: 'Streak Starter',
        description: 'Maintain a 3-day learning streak',
        category: BadgeCategory.STREAK,
        rarity: BadgeRarity.COMMON,
        points: 100,
        requirements: [
          { type: 'streak_achieved', value: 3, description: 'Achieve 3-day streak' }
        ],
        criteria: 'Complete assessments for 3 consecutive days',
        icon: 'flame-outline',
        color: '#FF9800'
      },
      {
        id: 'zero-waste-expert',
        name: 'Zero Waste Expert',
        description: 'Master zero waste principles',
        category: CATEGORIES.ZERO_WASTE,
        rarity: BadgeRarity.EPIC,
        points: 500,
        requirements: [
          { type: 'category_mastery', value: 90, description: 'Achieve 90% in Zero Waste category', category: CATEGORIES.ZERO_WASTE }
        ],
        criteria: 'Achieve 90% average score in Zero Waste assessments',
        icon: 'leaf-outline',
        color: '#2E7D32'
      }
    ];
    this.updateBadgeStats();
    this.loading = false;
  }

  private updateBadgeStats() {
    const totalPoints = this.earnedBadges.reduce((sum, badge) => sum + (badge.points || 0), 0);
    
    this.badgeStats = {
      totalEarned: this.earnedBadges.length,
      totalAvailable: this.allBadges.length,
      completionPercentage: this.allBadges.length > 0 
        ? Math.round((this.earnedBadges.length / this.allBadges.length) * 100) 
        : 0,
      totalPoints,
      recentBadges: this.getRecentBadges()
    };
  }

  private getRecentBadges(): Badge[] {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.earnedBadges
      .filter(badge => badge.earnedDate && new Date(badge.earnedDate).getTime() > oneWeekAgo)
      .sort((a, b) => new Date(b.earnedDate!).getTime() - new Date(a.earnedDate!).getTime())
      .slice(0, 3);
  }

  get filteredBadges(): Badge[] {
    let badges = this.allBadges;
    
    if (this.selectedCategory !== 'all') {
      badges = badges.filter(badge => badge.category === this.selectedCategory);
    }
    
    return badges.sort((a, b) => {
      const aEarned = this.isBadgeEarned(a);
      const bEarned = this.isBadgeEarned(b);
      
      if (aEarned !== bEarned) {
        return bEarned ? 1 : -1;
      }
      
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      const aRarity = rarityOrder[a.rarity] || 0;
      const bRarity = rarityOrder[b.rarity] || 0;
      
      if (aRarity !== bRarity) {
        return bRarity - aRarity;
      }
      
      return (b.points || 0) - (a.points || 0);
    });
  }

  isBadgeEarned(badge: Badge): boolean {
    return this.earnedBadges.some(earned => earned.id === badge.id);
  }

  getBadgeProgress(badge: Badge): number {
    if (!this.userProgress) {
      return 0;
    }
    
    if (this.isBadgeEarned(badge)) {
      return 100;
    }
    
    try {
      return this.assessmentService.calculateBadgeProgress(badge, this.userProgress);
    } catch (error) {
      return 0;
    }
  }

  getBadgeRarityColor(rarity: BadgeRarity): string {
    const colors = {
      [BadgeRarity.COMMON]: 'success',
      [BadgeRarity.RARE]: 'primary',
      [BadgeRarity.EPIC]: 'secondary',
      [BadgeRarity.LEGENDARY]: 'warning'
    };
    return colors[rarity] || 'medium';
  }

  getBadgeRarityIcon(rarity: BadgeRarity): string {
    const icons = {
      [BadgeRarity.COMMON]: 'star-outline',
      [BadgeRarity.RARE]: 'star-half-outline',
      [BadgeRarity.EPIC]: 'star',
      [BadgeRarity.LEGENDARY]: 'diamond-outline'
    };
    return icons[rarity] || 'help-outline';
  }

  getCategoryIcon(category: string): string {
    const icons = {
      [CATEGORIES.ZERO_WASTE]: 'leaf-outline',
      [CATEGORIES.THREE_R]: 'reload-outline',
      [CATEGORIES.COMPOSTING]: 'nutrition-outline',
      [BadgeCategory.ASSESSMENT]: 'school-outline',
      [BadgeCategory.STREAK]: 'flame-outline',
      [BadgeCategory.MASTERY]: 'trophy-outline',
      [BadgeCategory.SOCIAL]: 'people-outline',
      [BadgeCategory.SPECIAL]: 'gift-outline'
    };
    return icons[category] || 'help-outline';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    if (progress >= 40) return 'primary';
    return 'medium';
  }

  setCategoryFilter(category: string | 'all') {
    this.selectedCategory = category;
  }

  viewBadgeDetails(badge: Badge) {
    const earned = this.isBadgeEarned(badge);
    const progress = this.getBadgeProgress(badge);
    
    let message = `🏆 ${badge.name}\n\n`;
    message += `📖 Description: ${badge.description}\n\n`;
    message += `🏷️ Category: ${badge.category}\n`;
    message += `💎 Rarity: ${badge.rarity}\n`;
    message += `⭐ Points: ${badge.points || 0}\n\n`;
    
    if (badge.requirements && badge.requirements.length > 0) {
      message += `📋 Requirements:\n`;
      badge.requirements.forEach(req => {
        message += `  • ${req.description}\n`;
      });
      message += `\n`;
    }
    
    message += `🎯 Progress: ${progress}%\n\n`;
    
    if (earned && badge.earnedDate) {
      message += `🎉 Earned: ${new Date(badge.earnedDate).toLocaleDateString()}`;
    } else if (progress > 0) {
      message += `🚀 Keep going! You're ${progress}% there!`;
    } else {
      message += `💪 Start working towards this badge!`;
    }
    
    alert(message);
  }

  getNextBadgeToEarn(): Badge | null {
    const unearned = this.allBadges.filter(badge => !this.isBadgeEarned(badge));
    
    if (unearned.length === 0) return null;
    
    const withProgress = unearned
      .map(badge => ({ 
        badge, 
        progress: this.getBadgeProgress(badge),
        points: badge.points || 0
      }))
      .filter(item => item.progress > 0)
      .sort((a, b) => {
        if (a.progress !== b.progress) {
          return b.progress - a.progress;
        }
        return b.points - a.points;
      });
    
    return withProgress.length > 0 ? withProgress[0].badge : unearned[0];
  }

  getBadgeRecommendations(): string[] {
    const recommendations: string[] = [];
    const nextBadge = this.getNextBadgeToEarn();
    
    if (!nextBadge) {
      recommendations.push("🎉 Congratulations! You've earned all available badges!");
      return recommendations;
    }
    
    const progress = this.getBadgeProgress(nextBadge);
    
    if (progress > 75) {
      recommendations.push(`🎯 You're almost there! ${nextBadge.name} is ${progress}% complete.`);
    } else if (progress > 25) {
      recommendations.push(`🚀 Keep working on ${nextBadge.name} - you're ${progress}% there!`);
    } else {
      recommendations.push(`💪 Start working towards ${nextBadge.name} in the ${nextBadge.category} category.`);
    }
    
    if (this.userProgress) {
      if (this.userProgress.attemptsCompleted < 5) {
        recommendations.push("📚 Complete more assessments to unlock achievement badges.");
      }
      
      if (!this.userProgress.currentStreak || this.userProgress.currentStreak < 3) {
        recommendations.push("🔥 Build a study streak by completing assessments daily.");
      }
    }
    
    return recommendations;
  }

  getCompletionMessage(): string {
    const percentage = this.badgeStats.completionPercentage;
    
    if (percentage === 100) return "🎉 Zero Waste Master! All badges earned!";
    if (percentage >= 80) return "🏆 Eco Warrior! Almost there!";
    if (percentage >= 60) return "⭐ Green Champion! Keep going!";
    if (percentage >= 40) return "🎯 Eco Explorer! Great progress!";
    if (percentage >= 20) return "🌟 Green Beginner! Nice start!";
    return "🚀 Start your zero waste journey!";
  }

  isBackendConnected(): boolean {
    return this.assessmentService.isBackendAvailable();
  }

  retryLoadBadges() {
    this.error = null;
    this.loadBadges();
  }

  trackByBadgeId(index: number, badge: Badge): string {
    return badge.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}