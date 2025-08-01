// src/app/services/assessment.service.ts - COMPLETE VERSION WITH LEADERBOARD AND ANALYTICS
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { delay, tap, catchError, map, retry } from 'rxjs/operators';
import { 
  LeaderboardEntry, 
  Question, 
  DifficultyLevel, 
  QuestionType,
  UserAssessmentProgress,
  AssessmentConfig,
  AssessmentAttempt,
  Badge,
  BadgeRequirement,
  BadgeCategory,
  BadgeRarity,
  LeaderboardTimeframe,
  AwarenessLevel,
  ImprovementTrend,
  Achievement,
  LearningAnalytics,
  Milestone,
  UserStatistics,
  Activity,
  MonthlyProgress,
  CATEGORIES
} from '../interfaces/assessment.interface';

// Enhanced interfaces for category system
export interface CategoryProgress {
  attempts: number;
  totalScore: number;
  averageScore: number;
  lastAttemptDate: Date;
  currentStreak: number;
  highestDifficulty: DifficultyLevel;
  recentAttempts: Array<{score: number, date: Date, passed: boolean}>;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  questionCount: number;
  difficulties: DifficultyLevel[];
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  // REAL BACKEND CONFIGURATION
  private readonly API_BASE_URL = 'http://localhost:4000/api';
  
  // HTTP Options
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  // Current state tracking
  private currentDifficulty: DifficultyLevel = DifficultyLevel.BEGINNER;
  private currentDifficultySubject = new BehaviorSubject<DifficultyLevel>(this.currentDifficulty);
  currentDifficulty$ = this.currentDifficultySubject.asObservable();
  
  private currentCategory: string = '';
  private selectedCategorySubject = new BehaviorSubject<QuestionCategory | null>(null);
  selectedCategory$ = this.selectedCategorySubject.asObservable();
  
  // User progress tracking
  private userProgressSubject = new BehaviorSubject<UserAssessmentProgress | null>(null);
  userProgress$ = this.userProgressSubject.asObservable();

  // Categories
  private availableCategoriesSubject = new BehaviorSubject<QuestionCategory[]>([]);
  availableCategories$ = this.availableCategoriesSubject.asObservable();

  // Connection status
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  // Assessment config
  private assessmentConfig: AssessmentConfig = {
    timeLimit: 300,
    questionsPerAssessment: 5,
    passingScore: 70
  };

  // Dynamic difficulty thresholds
  private difficultyThresholds = {
    increase: {
      score: 85,
      streak: 3,
      recent: 80
    },
    decrease: {
      score: 40,
      recent: 30
    }
  };

  constructor(private http: HttpClient) {
    console.log('🚀 Assessment Service initializing with real backend...');
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.testBackendConnection();
      await this.loadAssessmentConfig();
      await this.loadUserProgress();
      await this.initializeCategories();
      
      console.log('✅ Assessment Service initialized with real backend');
    } catch (error) {
      console.error('❌ Assessment Service initialization failed:', error);
      this.fallbackToOfflineMode();
    }
  }

  // BACKEND CONNECTION MANAGEMENT
  private async testBackendConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing backend connection...');
      
      const response = await this.http.get(`${this.API_BASE_URL}/health`, this.httpOptions)
        .pipe(retry(2), catchError(this.handleError))
        .toPromise();
      
      console.log('✅ Backend connected successfully');
      this.connectionStatusSubject.next(true);
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      this.connectionStatusSubject.next(false);
      return false;
    }
  }

  private async loadAssessmentConfig(): Promise<void> {
    try {
      console.log('✅ Using default assessment config');
    } catch (error) {
      console.error('❌ Failed to load assessment config:', error);
    }
  }

  private async loadUserProgress(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const progress = await this.http.get<UserAssessmentProgress>(
        `${this.API_BASE_URL}/users/${userId}/progress`, 
        this.httpOptions
      ).pipe(catchError(this.handleError)).toPromise();
      
      if (progress) {
        if (!progress.categoryProgress) {
          progress.categoryProgress = {};
        }
        
        this.userProgressSubject.next(progress);
        this.updateDifficultyFromProgress(progress);
        console.log('✅ User progress loaded from backend');
      }
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    }
  }

  // UPDATED CATEGORY MANAGEMENT FOR NEW CATEGORIES
  async initializeCategories(): Promise<void> {
    try {
      console.log('🏷️ Loading available categories...');
      
      const categories = await this.getAvailableCategories().toPromise();
      this.availableCategoriesSubject.next(categories || []);
      
      console.log('✅ Categories initialized');
    } catch (error) {
      console.error('❌ Failed to initialize categories:', error);
      this.loadFallbackCategories();
    }
  }

  getAvailableCategories(): Observable<QuestionCategory[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/categories`).pipe(
      map(backendCategories => this.transformBackendCategories(backendCategories)),
      catchError(error => {
        console.error('❌ Failed to fetch categories:', error);
        return this.getFallbackCategories();
      })
    );
  }

  private transformBackendCategories(backendCategories: any[]): QuestionCategory[] {
    return backendCategories.map(cat => ({
      id: cat.id || cat._id,
      name: cat.name || this.formatCategoryName(cat.id),
      description: cat.description || `Questions about ${cat.name || cat.id}`,
      icon: this.getCategoryIcon(cat.id || cat.name),
      color: this.getCategoryColor(cat.id || cat.name),
      questionCount: cat.questionCount || 0,
      difficulties: cat.difficulties || [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
    }));
  }

  private formatCategoryName(categoryId: string): string {
    // UPDATED: Handle new category names
    const nameMap: { [key: string]: string } = {
      'zero-waste': 'Zero Waste',
      '3r-principles': '3R Principles',
      'composting': 'Composting'
    };
    
    return nameMap[categoryId] || categoryId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getCategoryIcon(categoryName: string): string {
    // UPDATED: Icons for new categories
    const iconMap: { [key: string]: string } = {
      'zero-waste': '🌍',
      '3r-principles': '♻️',
      'composting': '🌱'
    };
    return iconMap[categoryName] || '❓';
  }

  private getCategoryColor(categoryName: string): string {
    // UPDATED: Colors for new categories
    const colorMap: { [key: string]: string } = {
      'zero-waste': '#2E7D32',      // Dark Green
      '3r-principles': '#1976D2',   // Blue
      'composting': '#388E3C'       // Green
    };
    return colorMap[categoryName] || '#757575';
  }

  private getFallbackCategories(): Observable<QuestionCategory[]> {
    // UPDATED: Fallback categories matching your database
    const fallbackCategories: QuestionCategory[] = [
      {
        id: 'zero-waste',
        name: 'Zero Waste',
        description: 'Learn about zero waste principles and practices',
        icon: '🌍',
        color: '#2E7D32',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      },
      {
        id: '3r-principles',
        name: '3R Principles',
        description: 'Reduce, Reuse, Recycle - the fundamental principles',
        icon: '♻️',
        color: '#1976D2',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      },
      {
        id: 'composting',
        name: 'Composting',
        description: 'Organic waste composting techniques and benefits',
        icon: '🌱',
        color: '#388E3C',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      }
    ];
    return of(fallbackCategories);
  }

  private loadFallbackCategories(): void {
    this.getFallbackCategories().subscribe(categories => {
      this.availableCategoriesSubject.next(categories);
    });
  }

  // CATEGORY SELECTION
  selectCategory(category: QuestionCategory): void {
    console.log('🏷️ Selected category:', category.name);
    this.selectedCategorySubject.next(category);
    this.currentCategory = category.id;
    
    // Update difficulty based on category progress
    const userProgress = this.userProgressSubject.value;
    if (userProgress?.categoryProgress?.[category.id]) {
      const categoryProgress = userProgress.categoryProgress[category.id];
      this.setCurrentDifficulty(categoryProgress.highestDifficulty);
    }
  }

  getCurrentCategory(): QuestionCategory | null {
    return this.selectedCategorySubject.value;
  }

  // QUESTION FETCHING
  getQuestions(difficulty?: DifficultyLevel, type?: QuestionType): Observable<Question[]> {
    const targetDifficulty = difficulty || this.currentDifficulty;
    
    const params = new URLSearchParams();
    params.append('difficulty', targetDifficulty);
    params.append('count', this.assessmentConfig.questionsPerAssessment.toString());
    if (type) params.append('type', type);
    
    // Add category parameter if available
    if (this.currentCategory) {
      params.append('category', this.currentCategory);
    }
  
    console.log(`📝 Fetching ${this.assessmentConfig.questionsPerAssessment} questions (${targetDifficulty}) from backend...`);
    console.log(`🏷️ Category: ${this.currentCategory || 'All categories'}`);
    
    return this.http.get<any[]>(
      `${this.API_BASE_URL}/questions?${params.toString()}`, 
      this.httpOptions
    ).pipe(
      map(backendQuestions => this.transformBackendQuestions(backendQuestions)),
      tap(questions => {
        console.log(`✅ Received ${questions.length} questions from backend`);
        if (questions.length === 0) {
          console.warn(`⚠️ No questions found for category: ${this.currentCategory} at difficulty: ${targetDifficulty}`);
        }
      }),
      catchError(error => {
        console.error('❌ Failed to fetch questions from backend:', error);
        return this.getFallbackQuestions(targetDifficulty);
      })
    );
  }

  private transformBackendQuestions(backendQuestions: any[]): Question[] {
    return backendQuestions.map(backendQ => {
      const transformed: Question = {
        id: backendQ._id || backendQ.id,
        text: backendQ.questionText,
        type: QuestionType.MULTIPLE_CHOICE,
        options: backendQ.options || [],
        correctAnswer: Array.isArray(backendQ.correctAnswer) 
          ? backendQ.correctAnswer 
          : [backendQ.correctAnswer],
        points: this.getPointsPerQuestion(backendQ.difficulty),
        difficulty: backendQ.difficulty as DifficultyLevel,
        explanation: backendQ.explanation,
        category: backendQ.category
      };
      
      return transformed;
    });
  }

  // ASSESSMENT SUBMISSION WITH ENHANCED LEADERBOARD TRACKING
  submitAssessment(attempt: AssessmentAttempt): Observable<UserAssessmentProgress> {
    console.log('📤 Submitting assessment to backend:', attempt);
    console.log('🏷️ Current category:', this.currentCategory);
    
    // Enhance the attempt with leaderboard data
    const enhancedAttempt = {
      ...attempt,
      categoryId: this.currentCategory,
      categoryName: this.getCurrentCategory()?.name || 'General',
      timeSpent: Math.round(attempt.timeTaken / 60), // convert to minutes
      hintsUsed: 0, // track if hints system is implemented
      strengths: this.identifyStrengths(attempt),
      weaknesses: this.identifyWeaknesses(attempt),
      recommendedActions: this.generateRecommendations(attempt)
    };
    
    return this.http.post<{
      success: boolean;
      userProgress: UserAssessmentProgress;
      difficultyChanged?: boolean;
      newDifficulty?: DifficultyLevel;
    }>(`${this.API_BASE_URL}/assessment/submit`, enhancedAttempt, this.httpOptions)
    .pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Assessment submitted successfully');
          
          // Update category progress properly
          const updatedProgress = this.updateCategoryProgressLocally(response.userProgress, enhancedAttempt);
          
          // Apply dynamic difficulty adjustments and other progress-based updates
          this.updateImprovementTrend(updatedProgress);
          this.updateAwarenessLevel(updatedProgress);
          this.checkForNewAchievements(updatedProgress);

          // Push the updated progress
          this.userProgressSubject.next(updatedProgress);
          
          // Handle dynamic difficulty changes from backend
          if (response.difficultyChanged && response.newDifficulty) {
            console.log(`🎚️ Backend adjusted difficulty to: ${response.newDifficulty}`);
            this.setCurrentDifficulty(response.newDifficulty);
          } else {
            // Apply local dynamic difficulty adjustment
            this.applyDynamicDifficultyAdjustment(enhancedAttempt);
          }

          // Update study session tracking
          this.updateStudySession(enhancedAttempt);
        }
      }),
      map(response => response.userProgress),
      catchError(error => {
        console.error('❌ Failed to submit assessment:', error);
        return this.handleOfflineAssessmentSubmission(enhancedAttempt);
      })
    );
  }

  // ENHANCED METHOD TO GET QUESTIONS BY CATEGORY
  getQuestionsByCategory(categoryId: string, difficulty?: DifficultyLevel, count: number = 5): Observable<Question[]> {
    const targetDifficulty = difficulty || this.currentDifficulty;
    
    const params = new URLSearchParams();
    params.append('category', categoryId);
    params.append('difficulty', targetDifficulty);
    params.append('count', count.toString());

    console.log(`📝 Fetching questions for category: ${categoryId}, difficulty: ${targetDifficulty}`);
    
    return this.http.get<any[]>(
      `${this.API_BASE_URL}/questions?${params.toString()}`,
      this.httpOptions
    ).pipe(
      map(backendQuestions => this.transformBackendQuestions(backendQuestions)),
      tap(questions => {
        console.log(`✅ Found ${questions.length} questions for ${categoryId}`);
        questions.forEach(q => console.log(`   - ${q.text.substring(0, 50)}...`));
      }),
      catchError(error => {
        console.error(`❌ Failed to fetch questions for category ${categoryId}:`, error);
        return this.getFallbackQuestions(targetDifficulty);
      })
    );
  }

  // GET CATEGORY STATISTICS
  getCategoryStatistics(): Observable<any> {
    console.log('📊 Fetching category statistics...');
    
    return this.http.get(`${this.API_BASE_URL}/categories/statistics`, this.httpOptions).pipe(
      tap(stats => console.log('✅ Category statistics loaded:', stats)),
      catchError(error => {
        console.error('❌ Failed to fetch category statistics:', error);
        return of({
          'zero-waste': { total: 15, byDifficulty: { Beginner: 5, Intermediate: 5, Advanced: 5 }},
          '3r-principles': { total: 15, byDifficulty: { Beginner: 5, Intermediate: 5, Advanced: 5 }},
          'composting': { total: 15, byDifficulty: { Beginner: 5, Intermediate: 5, Advanced: 5 }}
        });
      })
    );
  }

  // BADGE PROGRESS CALCULATION METHODS
  /**
   * Calculate badge progress based on user progress and badge requirements
   */
  calculateBadgeProgress(badge: Badge, userProgress: UserAssessmentProgress): number {
    if (!userProgress || !badge.requirements || badge.requirements.length === 0) {
      return 0;
    }

    let totalProgress = 0;
    let totalRequirements = badge.requirements.length;

    for (const requirement of badge.requirements) {
      const progress = this.calculateRequirementProgress(requirement, userProgress);
      totalProgress += Math.min(progress, 100); // Cap at 100% per requirement
    }

    // Return average progress across all requirements
    return Math.round(totalProgress / totalRequirements);
  }

  /**
   * Calculate progress for a specific badge requirement
   */
  private calculateRequirementProgress(requirement: BadgeRequirement, userProgress: UserAssessmentProgress): number {
    switch (requirement.type) {
      case 'assessments_completed':
        return this.calculateAssessmentsProgress(requirement.value as number, userProgress);
      
      case 'consecutive_passes':
        return this.calculateConsecutivePassesProgress(requirement.value as number, userProgress);
      
      case 'perfect_scores':
        return this.calculatePerfectScoresProgress(requirement.value as number, userProgress);
      
      case 'difficulty_reached':
        return this.calculateDifficultyProgressForBadge(requirement.value as DifficultyLevel, userProgress);
      
      case 'streak_achieved':
        return this.calculateStreakProgress(requirement.value as number, userProgress);
      
      case 'social_action':
        return this.calculateSocialActionProgress(requirement.value as number, userProgress);
      
      default:
        console.warn(`Unknown badge requirement type: ${requirement.type}`);
        return 0;
    }
  }

  private calculateAssessmentsProgress(required: number, userProgress: UserAssessmentProgress): number {
    const completed = userProgress.attemptsCompleted || 0;
    return Math.min((completed / required) * 100, 100);
  }

  private calculateConsecutivePassesProgress(required: number, userProgress: UserAssessmentProgress): number {
    const currentStreak = userProgress.currentStreak || 0;
    return Math.min((currentStreak / required) * 100, 100);
  }

  private calculatePerfectScoresProgress(required: number, userProgress: UserAssessmentProgress): number {
    const perfectScores = userProgress.perfectScores || 0;
    return Math.min((perfectScores / required) * 100, 100);
  }

  private calculateDifficultyProgressForBadge(requiredDifficulty: DifficultyLevel, userProgress: UserAssessmentProgress): number {
    // Check if user has reached the required difficulty in any category
    if (!userProgress.categoryProgress) return 0;
    
    const requiredLevel = this.getDifficultyOrder(requiredDifficulty);
    
    for (const categoryProgress of Object.values(userProgress.categoryProgress)) {
      const achievedLevel = this.getDifficultyOrder(categoryProgress.highestDifficulty);
      if (achievedLevel >= requiredLevel) {
        return 100;
      }
    }
    
    // Calculate partial progress based on highest achieved difficulty
    let highestAchieved = DifficultyLevel.BEGINNER;
    for (const categoryProgress of Object.values(userProgress.categoryProgress)) {
      if (this.getDifficultyOrder(categoryProgress.highestDifficulty) > this.getDifficultyOrder(highestAchieved)) {
        highestAchieved = categoryProgress.highestDifficulty;
      }
    }
    
    const achievedLevel = this.getDifficultyOrder(highestAchieved);
    return Math.min((achievedLevel / requiredLevel) * 100, 100);
  }

  private calculateStreakProgress(required: number, userProgress: UserAssessmentProgress): number {
    // Check both global streak and category-specific streaks
    const globalStreak = userProgress.currentStreak || 0;
    let maxCategoryStreak = 0;
    
    if (userProgress.categoryProgress) {
      for (const categoryProgress of Object.values(userProgress.categoryProgress)) {
        maxCategoryStreak = Math.max(maxCategoryStreak, categoryProgress.currentStreak);
      }
    }
    
    const bestStreak = Math.max(globalStreak, maxCategoryStreak);
    return Math.min((bestStreak / required) * 100, 100);
  }

  private calculateSocialActionProgress(required: number, userProgress: UserAssessmentProgress): number {
    const socialActions = userProgress.socialActions || 0;
    return Math.min((socialActions / required) * 100, 100);
  }

  // CATEGORY PROGRESS TRACKING
  private updateCategoryProgressLocally(userProgress: UserAssessmentProgress, attempt: AssessmentAttempt): UserAssessmentProgress {
    const category = this.currentCategory;
    if (!category) return userProgress;
    
    if (!userProgress.categoryProgress) {
      userProgress.categoryProgress = {};
    }
    
    if (!userProgress.categoryProgress[category]) {
      userProgress.categoryProgress[category] = {
        attempts: 0,
        totalScore: 0,
        averageScore: 0,
        lastAttemptDate: new Date(),
        currentStreak: 0,
        highestDifficulty: this.currentDifficulty,
        recentAttempts: []
      };
    }

    const categoryProgress = userProgress.categoryProgress[category];
    
    // Update category statistics
    categoryProgress.attempts++;
    categoryProgress.totalScore += attempt.score;
    categoryProgress.averageScore = categoryProgress.totalScore / categoryProgress.attempts;
    categoryProgress.lastAttemptDate = new Date();

    // Update streak
    if (attempt.passed) {
      categoryProgress.currentStreak++;
    } else {
      categoryProgress.currentStreak = 0;
    }

    // Update highest difficulty achieved
    const difficultyOrder = this.getDifficultyOrder(this.currentDifficulty);
    const highestOrder = this.getDifficultyOrder(categoryProgress.highestDifficulty);
    if (difficultyOrder > highestOrder) {
      categoryProgress.highestDifficulty = this.currentDifficulty;
    }

    // Update recent attempts (keep last 5)
    categoryProgress.recentAttempts.push({
      score: attempt.score,
      date: new Date(),
      passed: attempt.passed
    });
    
    if (categoryProgress.recentAttempts.length > 5) {
      categoryProgress.recentAttempts = categoryProgress.recentAttempts.slice(-5);
    }

    console.log(`📊 Updated progress for ${category}:`, categoryProgress);
    return userProgress;
  }

  // DYNAMIC DIFFICULTY ADJUSTMENT
  private applyDynamicDifficultyAdjustment(attempt: AssessmentAttempt): void {
    const userProgress = this.userProgressSubject.value;
    if (!userProgress || !this.currentCategory) return;

    const categoryProgress = userProgress.categoryProgress?.[this.currentCategory];
    if (!categoryProgress) return;

    console.log('🎚️ Applying dynamic difficulty adjustment for:', this.currentCategory);

    const averageScore = categoryProgress.averageScore;
    const recentPerformance = this.calculateRecentPerformance(this.currentCategory);
    const streak = categoryProgress.currentStreak;
    const attempts = categoryProgress.attempts;

    console.log('📊 Performance metrics:', {
      category: this.currentCategory,
      averageScore,
      recentPerformance,
      streak,
      attempts,
      currentDifficulty: this.currentDifficulty
    });

    const newDifficulty = this.calculateOptimalDifficulty(
      this.currentDifficulty,
      averageScore,
      recentPerformance,
      streak,
      attempts
    );

    if (newDifficulty !== this.currentDifficulty) {
      console.log(`📈 Difficulty adjusted for ${this.currentCategory}: ${this.currentDifficulty} -> ${newDifficulty}`);
      this.setCurrentDifficulty(newDifficulty);
      
      // Show notification about difficulty change
      this.showDifficultyChangeNotification(this.currentDifficulty, newDifficulty);
    }
  }

  private showDifficultyChangeNotification(oldDifficulty: DifficultyLevel, newDifficulty: DifficultyLevel): void {
    const categoryName = this.getCurrentCategory()?.name || 'this category';
    const direction = this.getDifficultyOrder(newDifficulty) > this.getDifficultyOrder(oldDifficulty) ? 'increased' : 'decreased';
    
    console.log(`🎚️ Difficulty ${direction} for ${categoryName}: ${oldDifficulty} → ${newDifficulty}`);
    
    // You can add a toast notification here if you have Ionic toast controller
    // this.toastController.create({
    //   message: `Difficulty ${direction} to ${newDifficulty} for ${categoryName}!`,
    //   duration: 3000,
    //   color: direction === 'increased' ? 'success' : 'warning'
    // }).then(toast => toast.present());
  }

  private calculateRecentPerformance(category: string): number {
    const userProgress = this.userProgressSubject.value;
    if (!userProgress?.categoryProgress?.[category]) return 0;

    const recentAttempts = userProgress.categoryProgress[category].recentAttempts || [];
    if (recentAttempts.length === 0) return 0;

    const sum = recentAttempts.reduce((acc, attempt) => acc + attempt.score, 0);
    const averageScore = sum / recentAttempts.length;
    
    const maxScore = this.assessmentConfig.questionsPerAssessment * this.getPointsPerQuestion(this.currentDifficulty);
    return (averageScore / maxScore) * 100;
  }

  private calculateOptimalDifficulty(
    currentDifficulty: DifficultyLevel,
    averageScore: number,
    recentPerformance: number,
    streak: number,
    attempts: number
  ): DifficultyLevel {
    const maxScore = this.assessmentConfig.questionsPerAssessment * this.getPointsPerQuestion(currentDifficulty);
    const averageScorePercentage = (averageScore / maxScore) * 100;

    if (attempts < 3) {
      return currentDifficulty;
    }

    const shouldIncrease = 
      averageScorePercentage >= this.difficultyThresholds.increase.score &&
      recentPerformance >= this.difficultyThresholds.increase.recent &&
      streak >= this.difficultyThresholds.increase.streak &&
      currentDifficulty !== DifficultyLevel.ADVANCED;

    if (shouldIncrease) {
      return this.getNextDifficulty(currentDifficulty);
    }

    const shouldDecrease = 
      (averageScorePercentage < this.difficultyThresholds.decrease.score ||
       recentPerformance < this.difficultyThresholds.decrease.recent) &&
      currentDifficulty !== DifficultyLevel.BEGINNER;

    if (shouldDecrease) {
      return this.getPreviousDifficulty(currentDifficulty);
    }

    return currentDifficulty;
  }

  // HELPER METHODS
  private getDifficultyOrder(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return 1;
      case DifficultyLevel.INTERMEDIATE: return 2;
      case DifficultyLevel.ADVANCED: return 3;
      default: return 1;
    }
  }

  private setCurrentDifficulty(difficulty: DifficultyLevel): void {
    this.currentDifficulty = difficulty;
    this.currentDifficultySubject.next(difficulty);
  }

  private getPointsPerQuestion(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.ADVANCED: return 20;
      case DifficultyLevel.INTERMEDIATE: return 15;
      case DifficultyLevel.BEGINNER: return 10;
      default: return 10;
    }
  }

  private getNextDifficulty(currentDifficulty: DifficultyLevel): DifficultyLevel {
    switch (currentDifficulty) {
      case DifficultyLevel.BEGINNER: return DifficultyLevel.INTERMEDIATE;
      case DifficultyLevel.INTERMEDIATE: return DifficultyLevel.ADVANCED;
      case DifficultyLevel.ADVANCED: return DifficultyLevel.ADVANCED;
      default: return DifficultyLevel.BEGINNER;
    }
  }

  private getPreviousDifficulty(currentDifficulty: DifficultyLevel): DifficultyLevel {
    switch (currentDifficulty) {
      case DifficultyLevel.ADVANCED: return DifficultyLevel.INTERMEDIATE;
      case DifficultyLevel.INTERMEDIATE: return DifficultyLevel.BEGINNER;
      case DifficultyLevel.BEGINNER: return DifficultyLevel.BEGINNER;
      default: return DifficultyLevel.BEGINNER;
    }
  }

  // PUBLIC API METHODS
  getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }

  getAssessmentConfig(): Observable<AssessmentConfig> {
    return of(this.assessmentConfig);
  }

  getCurrentUserId(): string {
    return localStorage.getItem('current_user_id') || 'anonymous_user';
  }

  setDifficultyManually(difficulty: DifficultyLevel): void {
    this.setCurrentDifficulty(difficulty);
  }

  isBackendAvailable(): boolean {
    return this.connectionStatusSubject.value;
  }

  // FALLBACK METHODS
  private fallbackToOfflineMode(): void {
    console.log('📱 Falling back to offline mode...');
    this.loadCachedData();
    this.loadFallbackCategories();
  }

  private loadCachedData(): void {
    const cachedProgress = localStorage.getItem('assessment_progress');
    if (cachedProgress) {
      try {
        const progress = JSON.parse(cachedProgress);
        if (!progress.categoryProgress) {
          progress.categoryProgress = {};
        }
        this.userProgressSubject.next(progress);
        console.log('✅ Loaded cached assessment data');
      } catch (error) {
        console.error('❌ Failed to parse cached data:', error);
      }
    }
  }

  private getFallbackQuestions(difficulty: DifficultyLevel): Observable<Question[]> {
    // UPDATED: Fallback questions for new categories
    const categoryQuestions: { [key: string]: string } = {
      'zero-waste': 'What is the main goal of zero waste lifestyle?',
      '3r-principles': 'Which of the following is part of the 3R principles?',
      'composting': 'What materials are best for composting?'
    };

    const questionText = categoryQuestions[this.currentCategory] || 'What is the primary goal of waste reduction?';

    const fallbackQuestions: Question[] = [
      {
        id: 'fallback_q1',
        text: questionText,
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Reduce environmental impact', 'Increase recycling', 'Buy more products', 'Use more packaging'],
        correctAnswer: ['Reduce environmental impact'],
        points: this.getPointsPerQuestion(difficulty),
        difficulty: difficulty,
        category: this.currentCategory || 'general'
      }
    ];
    
    return of(fallbackQuestions);
  }

  private handleOfflineAssessmentSubmission(attempt: any): Observable<UserAssessmentProgress> {
    console.log('📱 Handling assessment submission offline...');
    
    const offlineAttempts = JSON.parse(localStorage.getItem('offline_attempts') || '[]');
    offlineAttempts.push({ ...attempt, timestamp: new Date() });
    localStorage.setItem('offline_attempts', JSON.stringify(offlineAttempts));
    
    const currentProgress = this.userProgressSubject.value;
    if (currentProgress) {
      const updatedProgress = this.updateCategoryProgressLocally(currentProgress, attempt);
      this.userProgressSubject.next(updatedProgress);
      localStorage.setItem('assessment_progress', JSON.stringify(updatedProgress));
      
      return of(updatedProgress);
    }
    
    return throwError('No user progress available');
  }

  private updateDifficultyFromProgress(progress: UserAssessmentProgress): void {
    const adaptiveDifficulty = this.calculateAdaptiveDifficulty(progress);
    this.setCurrentDifficulty(adaptiveDifficulty);
  }

  calculateAdaptiveDifficulty(progress: UserAssessmentProgress): DifficultyLevel {
    if (!progress || progress.attemptsCompleted === 0) {
      return DifficultyLevel.BEGINNER;
    }
    
    const averageScore = progress.totalScore / progress.attemptsCompleted;
    
    if (averageScore >= 85) {
      return DifficultyLevel.ADVANCED;
    } else if (averageScore >= 60) {
      return DifficultyLevel.INTERMEDIATE;
    } else {
      return DifficultyLevel.BEGINNER;
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('Backend API Error:', errorMessage);
    return throwError(errorMessage);
  };

  // ===================================================================
  // LEADERBOARD AND ANALYTICS INTEGRATION
  // ===================================================================

  // LEADERBOARD DATA MANAGEMENT
  getLeaderboard(timeframe: LeaderboardTimeframe = LeaderboardTimeframe.WEEKLY, category?: string): Observable<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);
    if (category && category !== 'all') {
      params.append('category', category);
    }

    console.log(`🏆 Fetching leaderboard data: ${timeframe}${category ? ` for ${category}` : ''}`);
    
    return this.http.get<any[]>(`${this.API_BASE_URL}/leaderboard?${params.toString()}`, this.httpOptions)
      .pipe(
        map(backendData => this.transformBackendLeaderboard(backendData)),
        tap(leaderboard => {
          console.log(`✅ Loaded ${leaderboard.length} leaderboard entries`);
          this.updateUserRankingPosition(leaderboard);
        }),
        catchError(error => {
          console.error('❌ Failed to fetch leaderboard:', error);
          return this.generateFallbackLeaderboard(timeframe, category);
        })
      );
  }

  private transformBackendLeaderboard(backendData: any[]): LeaderboardEntry[] {
    return backendData.map(entry => ({
      id: entry._id || entry.id,
      userName: entry.username || entry.userName,
      displayName: entry.displayName || entry.username,
      avatarUrl: entry.avatar || entry.avatarUrl,
      score: entry.totalScore || entry.score,
      rank: entry.rank,
      previousRank: entry.previousRank,
      totalAssessments: entry.assessmentsCompleted || entry.totalAssessments || 0,
      averageScore: entry.averageScore || 0,
      streak: entry.currentStreak || entry.streak || 0,
      badges: entry.badgesEarned?.length || entry.badges || 0,
      lastActive: new Date(entry.lastActiveDate || entry.lastActive || Date.now()),
      isOnline: entry.isOnline || false,
      level: entry.currentLevel || entry.level || DifficultyLevel.BEGINNER,
      achievements: entry.achievements || [],
      awarenessLevel: entry.awarenessLevel || AwarenessLevel.BEGINNER,
      improvementTrend: entry.improvementTrend || ImprovementTrend.STABLE,
      studyTime: entry.totalTimeSpent || entry.studyTime || 0,
      weeklyAssessments: entry.weeklyAssessments || 0,
      monthlyAssessments: entry.monthlyAssessments || 0,
      perfectScoreCount: entry.perfectScores || 0,
      helpfulVotes: entry.helpfulVotes || 0,
      categoryExpertise: entry.categoryExpertise || {},
      rankingHistory: entry.rankingHistory || [],
      joinDate: new Date(entry.createdAt || entry.joinDate || Date.now()),
      daysActive: entry.daysActive || 0,
      longestStudySession: entry.longestStudySession || 0,
      favoriteCategory: entry.favoriteCategory || '',
      followers: entry.followers || 0,
      following: entry.following || 0,
      postsShared: entry.postsShared || 0,
      communityChallenges: entry.communityChallenges || 0
    }));
  }

  private generateFallbackLeaderboard(timeframe: LeaderboardTimeframe, category?: string): Observable<LeaderboardEntry[]> {
    // Generate realistic mock data for testing
    const mockUsers = [
      { name: 'EcoWarrior2024', avatar: '🌟', level: DifficultyLevel.ADVANCED, trend: ImprovementTrend.IMPROVING },
      { name: 'GreenThumb', avatar: '🌱', level: DifficultyLevel.INTERMEDIATE, trend: ImprovementTrend.STABLE },
      { name: 'ZeroWasteHero', avatar: '♻️', level: DifficultyLevel.ADVANCED, trend: ImprovementTrend.IMPROVING },
      { name: 'CompostKing', avatar: '🌿', level: DifficultyLevel.INTERMEDIATE, trend: ImprovementTrend.DECLINING },
      { name: 'RecycleRanger', avatar: '🔄', level: DifficultyLevel.BEGINNER, trend: ImprovementTrend.IMPROVING }
    ];

    const fallbackData: LeaderboardEntry[] = mockUsers.map((user, index) => ({
      id: `fallback_user_${index}`,
      userName: user.name,
      displayName: user.name,
      avatarUrl: '',
      score: 950 - (index * 50) + Math.floor(Math.random() * 40),
      rank: index + 1,
      previousRank: index + 1 + (Math.random() > 0.5 ? 1 : -1),
      totalAssessments: 25 - index + Math.floor(Math.random() * 10),
      averageScore: 85 - (index * 3) + Math.floor(Math.random() * 10),
      streak: Math.floor(Math.random() * 15) + 1,
      badges: Math.floor(Math.random() * 8) + 2,
      lastActive: new Date(Date.now() - Math.random() * 86400000 * 7),
      isOnline: Math.random() > 0.6,
      level: user.level,
      achievements: [`${user.name} Badge`, 'First Steps'],
      awarenessLevel: this.calculateAwarenessLevel(85 - (index * 3)),
      improvementTrend: user.trend,
      studyTime: Math.floor(Math.random() * 120) + 30,
      weeklyAssessments: Math.floor(Math.random() * 10) + 2,
      monthlyAssessments: Math.floor(Math.random() * 40) + 10,
      perfectScoreCount: Math.floor(Math.random() * 5),
      helpfulVotes: Math.floor(Math.random() * 20),
      categoryExpertise: this.generateCategoryExpertise(),
      rankingHistory: [],
      joinDate: new Date(Date.now() - Math.random() * 86400000 * 365),
      daysActive: Math.floor(Math.random() * 100) + 10,
      longestStudySession: Math.floor(Math.random() * 180) + 30,
      favoriteCategory: Object.values(CATEGORIES)[Math.floor(Math.random() * 3)],
      followers: Math.floor(Math.random() * 50),
      following: Math.floor(Math.random() * 75),
      postsShared: Math.floor(Math.random() * 25),
      communityChallenges: Math.floor(Math.random() * 10)
    }));

    return of(fallbackData);
  }

  private calculateAwarenessLevel(averageScore: number): AwarenessLevel {
    if (averageScore >= 95) return AwarenessLevel.EXPERT;
    if (averageScore >= 85) return AwarenessLevel.ADVANCED;
    if (averageScore >= 75) return AwarenessLevel.INTERMEDIATE;
    if (averageScore >= 60) return AwarenessLevel.GROWING;
    return AwarenessLevel.BEGINNER;
  }

  private generateCategoryExpertise(): { [category: string]: number } {
    return {
      [CATEGORIES.ZERO_WASTE]: Math.floor(Math.random() * 100),
      [CATEGORIES.THREE_R]: Math.floor(Math.random() * 100),
      [CATEGORIES.COMPOSTING]: Math.floor(Math.random() * 100)
    };
  }

  private updateUserRankingPosition(leaderboard: LeaderboardEntry[]): void {
    const currentUserId = this.getCurrentUserId();
    const userEntry = leaderboard.find(entry => entry.id === currentUserId);
    
    if (userEntry) {
      // Store user's current ranking info
      localStorage.setItem('user_current_rank', JSON.stringify({
        rank: userEntry.rank,
        score: userEntry.score,
        lastUpdate: new Date(),
        category: this.currentCategory || 'overall'
      }));
      
      console.log(`📊 User rank updated: #${userEntry.rank} with score ${userEntry.score}`);
    }
  }

  // ENHANCED PROGRESS TRACKING
  private identifyStrengths(attempt: AssessmentAttempt): string[] {
    // Analyze which topics/categories user performed well in
    const strengths: string[] = [];
    const correctQuestions = attempt.questions.filter((q, index) => 
      attempt.score > (index + 1) * (100 / attempt.questions.length)
    );
    
    correctQuestions.forEach(q => {
      if (q.category && !strengths.includes(q.category)) {
        strengths.push(q.category);
      }
    });
    
    return strengths;
  }

  private identifyWeaknesses(attempt: AssessmentAttempt): string[] {
    // Analyze which topics/categories need improvement
    const weaknesses: string[] = [];
    const incorrectQuestions = attempt.questions.filter((q, index) => 
      attempt.score <= (index + 1) * (100 / attempt.questions.length)
    );
    
    incorrectQuestions.forEach(q => {
      if (q.category && !weaknesses.includes(q.category)) {
        weaknesses.push(q.category);
      }
    });
    
    return weaknesses;
  }

  private generateRecommendations(attempt: AssessmentAttempt): string[] {
    const recommendations: string[] = [];
    
    if (attempt.score < 70) {
      recommendations.push('Review basic concepts in this category');
      recommendations.push('Try easier difficulty questions first');
    } else if (attempt.score >= 85) {
      recommendations.push('Ready for more challenging questions');
      recommendations.push('Consider helping others in the community');
    }
    
    if (attempt.timeTaken > 300) { // 5 minutes
      recommendations.push('Practice to improve response speed');
    }
    
    return recommendations;
  }

  private updateStudySession(attempt: AssessmentAttempt): void {
    const sessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
    const today = new Date().toDateString();
    
    let todaySession = sessions.find((s: any) => new Date(s.date).toDateString() === today);
    
    if (!todaySession) {
      todaySession = {
        date: new Date(),
        assessmentsTaken: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        categoriesStudied: []
      };
      sessions.push(todaySession);
    }
    
    todaySession.assessmentsTaken++;
    todaySession.totalTimeSpent += Math.round(attempt.timeTaken / 60);
    todaySession.averageScore = (todaySession.averageScore * (todaySession.assessmentsTaken - 1) + attempt.score) / todaySession.assessmentsTaken;
    
    if (attempt.categoryId && !todaySession.categoriesStudied.includes(attempt.categoryId)) {
      todaySession.categoriesStudied.push(attempt.categoryId);
    }
    
    localStorage.setItem('study_sessions', JSON.stringify(sessions.slice(-30))); // Keep last 30 days
  }

  private updateImprovementTrend(progress: UserAssessmentProgress): void {
    if (!progress.categoryProgress) return;
    
    const currentCategory = this.currentCategory;
    if (!currentCategory || !progress.categoryProgress[currentCategory]) return;
    
    const categoryProgress = progress.categoryProgress[currentCategory];
    const recentAttempts = categoryProgress.recentAttempts || [];
    
    if (recentAttempts.length >= 3) {
      const recent = recentAttempts.slice(-3);
      const older = recentAttempts.slice(-6, -3);
      
      if (older.length >= 3) {
        const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, a) => sum + a.score, 0) / older.length;
        
        if (recentAvg > olderAvg + 5) {
          categoryProgress.improvementTrend = ImprovementTrend.IMPROVING;
        } else if (recentAvg < olderAvg - 5) {
          categoryProgress.improvementTrend = ImprovementTrend.DECLINING;
        } else {
          categoryProgress.improvementTrend = ImprovementTrend.STABLE;
        }
      }
    }
  }

  private updateAwarenessLevel(progress: UserAssessmentProgress): void {
    const averageScore = progress.totalScore / Math.max(progress.attemptsCompleted, 1);
    const oldLevel = progress.awarenessLevel;
    progress.awarenessLevel = this.calculateAwarenessLevel(averageScore);
    
    // Show notification if level changed
    if (oldLevel && oldLevel !== progress.awarenessLevel) {
      this.showAwarenessLevelChange(oldLevel, progress.awarenessLevel);
    }
  }
  
  private checkForNewAchievements(progress: UserAssessmentProgress): void {
    // Check for streak achievements
    if (progress.currentStreak && progress.currentStreak % 5 === 0) {
      this.unlockAchievement(`${progress.currentStreak}-day-streak`, `${progress.currentStreak} Day Streak!`);
    }
    
    // Check for assessment milestones
    if (progress.attemptsCompleted % 10 === 0) {
      this.unlockAchievement(`${progress.attemptsCompleted}-assessments`, `${progress.attemptsCompleted} Assessments Completed!`);
    }
    
    // Check for perfect score achievements
    if (progress.perfectScores && progress.perfectScores % 3 === 0) {
      this.unlockAchievement(`${progress.perfectScores}-perfect-scores`, `${progress.perfectScores} Perfect Scores!`);
    }
    
    // Check for awareness level achievements
    if (progress.awarenessLevel === AwarenessLevel.EXPERT) {
      this.unlockAchievement('expert-level', 'Zero Waste Expert!');
    }
  }

  private showAwarenessLevelChange(oldLevel: AwarenessLevel, newLevel: AwarenessLevel): void {
    const levelOrder = [AwarenessLevel.BEGINNER, AwarenessLevel.GROWING, AwarenessLevel.INTERMEDIATE, AwarenessLevel.ADVANCED, AwarenessLevel.EXPERT];
    const isImprovement = levelOrder.indexOf(newLevel) > levelOrder.indexOf(oldLevel);
    
    console.log(
      `🎯 Awareness level ${isImprovement ? 'increased' : 'decreased'}: ${oldLevel} → ${newLevel}`
    );
    
    // Here you could show a toast notification
    // this.toastController.create({
    //   message: `Your awareness level ${isImprovement ? 'increased' : 'changed'} to ${newLevel}!`,
    //   duration: 3000,
    //   color: isImprovement ? 'success' : 'warning'
    // }).then(toast => toast.present());
  }

  private unlockAchievement(achievementId: string, title: string): void {
    console.log(`🏆 Achievement unlocked: ${title}`);
    
    const achievement: Achievement = {
      id: achievementId,
      name: title,
      description: `Congratulations on reaching this milestone!`,
      icon: 'trophy',
      earnedDate: new Date(),
      category: 'assessment',
      rarity: BadgeRarity.COMMON,
      points: 100  // ✅ This is now optional in the Achievement interface, so you can include it
    };
    
    // Store locally until backend sync
    const achievements = JSON.parse(localStorage.getItem('user_achievements') || '[]');
    achievements.push(achievement);
    localStorage.setItem('user_achievements', JSON.stringify(achievements));
  }

  // ANALYTICS AND INSIGHTS
  generateLearningAnalytics(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Observable<LearningAnalytics> {
    const userId = this.getCurrentUserId();
    
    return this.http.get<LearningAnalytics>(
      `${this.API_BASE_URL}/analytics/${userId}?timeframe=${timeframe}`,
      this.httpOptions
    ).pipe(
      catchError(() => this.generateFallbackAnalytics(timeframe))
    );
  }

  private generateFallbackAnalytics(timeframe: string): Observable<LearningAnalytics> {
    const analytics: LearningAnalytics = {
      userId: this.getCurrentUserId(),
      generatedAt: new Date(),
      timeframe: timeframe as 'daily' | 'weekly' | 'monthly',
      averageScore: 75 + Math.floor(Math.random() * 20),
      scoreImprovement: Math.floor(Math.random() * 10) - 5,
      consistencyScore: 60 + Math.floor(Math.random() * 40),
      efficiencyScore: 70 + Math.floor(Math.random() * 30),
      preferredStudyTime: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)] as any,
      averageSessionLength: 15 + Math.floor(Math.random() * 30),
      mostProductiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
      strongestCategory: Object.values(CATEGORIES)[Math.floor(Math.random() * 3)],
      growthCategory: Object.values(CATEGORIES)[Math.floor(Math.random() * 3)],
      recommendedStudyTime: 20 + Math.floor(Math.random() * 20),
      suggestedCategories: [CATEGORIES.ZERO_WASTE, CATEGORIES.COMPOSTING],
      skillGaps: ['Advanced recycling techniques', 'Composting science'],
      nextMilestones: this.generateMilestones()
    };
    
    return of(analytics);
  }

  private generateMilestones(): Milestone[] {
    return [
      {
        id: 'streak-milestone',
        title: 'Reach 7-day streak',
        description: 'Complete assessments for 7 consecutive days',
        category: 'consistency',
        targetValue: 7,
        currentValue: 3,
        estimatedTimeToComplete: 4,
        difficulty: 'medium',
        rewards: {
          badges: ['Consistent Learner'],
          points: 200
        }
      },
      {
        id: 'score-milestone',
        title: 'Achieve 90% average',
        description: 'Maintain 90% average score across all categories',
        category: 'mastery',
        targetValue: 90,
        currentValue: 75,
        estimatedTimeToComplete: 14,
        difficulty: 'hard',
        rewards: {
          badges: ['Master Student'],
          points: 500,
          features: ['Advanced analytics']
        }
      }
    ];
  }

  // ENHANCED GETTERS FOR LEADERBOARD INTEGRATION
  getAvailableBadges(): Observable<Badge[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/badges`, this.httpOptions)
      .pipe(
        map(backendBadges => this.transformBackendBadges(backendBadges)),
        catchError(() => this.getFallbackBadges())
      );
  }

  private transformBackendBadges(backendBadges: any[]): Badge[] {
    return backendBadges.map(badge => ({
      id: badge._id || badge.id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      rarity: badge.rarity as BadgeRarity,
      points: badge.points || 100,
      requirements: badge.requirements || [],
      criteria: badge.criteria || badge.description,
      icon: badge.icon,
      color: badge.color,
      earnedDate: badge.earnedDate ? new Date(badge.earnedDate) : undefined
    }));
  }

  private getFallbackBadges(): Observable<Badge[]> {
    const fallbackBadges: Badge[] = [
      {
        id: 'first-assessment',
        name: 'First Steps',
        description: 'Complete your first assessment',
        category: CATEGORIES.ZERO_WASTE,
        rarity: BadgeRarity.COMMON,
        points: 50,
        requirements: [
          { type: 'assessments_completed', value: 1, description: 'Complete 1 assessment' }
        ],
        criteria: 'Complete any assessment',
        // REMOVE: icon: 'school',  - keep it or make it optional in interface
        color: '#4CAF50'
      },
      {
        id: 'streak-starter',
        name: 'Streak Starter',
        description: 'Maintain a 3-day learning streak',
        category: 'streak',
        rarity: BadgeRarity.COMMON,
        points: 100,
        requirements: [
          { type: 'streak_achieved', value: 3, description: 'Achieve 3-day streak' }
        ],
        criteria: 'Complete assessments for 3 consecutive days',
        // REMOVE: icon: 'flame',  - keep it or make it optional in interface
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
        // REMOVE: icon: 'leaf',  - keep it or make it optional in interface
        color: '#2E7D32'
      }
    ];
    
    return of(fallbackBadges);
  }

  getUserStatistics(): Observable<UserStatistics> {
    const userId = this.getCurrentUserId();
    
    return this.http.get<UserStatistics>(`${this.API_BASE_URL}/users/${userId}/statistics`, this.httpOptions)
      .pipe(
        catchError(() => this.generateFallbackUserStatistics())
      );
  }

  private generateFallbackUserStatistics(): Observable<UserStatistics> {
    const userProgress = this.userProgressSubject.value;
    
    const stats: UserStatistics = {
      totalAssessments: userProgress?.attemptsCompleted || 5,
      totalTimeSpent: userProgress?.totalTimeSpent || 120,
      averageScore: userProgress ? (userProgress.totalScore / Math.max(userProgress.attemptsCompleted, 1)) : 75,
      bestScore: 85 + Math.floor(Math.random() * 15),
      currentStreak: userProgress?.currentStreak || 2,
      longestStreak: userProgress?.longestStreak || 5,
      badgesEarned: userProgress?.badgesEarned?.length || 2,
      friendsCount: userProgress?.friendsCount || 0,
      challengesWon: 1,
      perfectScores: userProgress?.perfectScores || 1,
      assessmentsByDifficulty: {
        [DifficultyLevel.BEGINNER]: 3,
        [DifficultyLevel.INTERMEDIATE]: 2,
        [DifficultyLevel.ADVANCED]: 0
      },
      monthlyProgress: this.generateMonthlyProgress(),
      recentActivity: this.generateRecentActivity()
    };
    
    return of(stats);
  }

  private generateMonthlyProgress(): MonthlyProgress[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    return months.map(month => ({
      month,
      assessmentsCompleted: Math.floor(Math.random() * 15) + 5,
      averageScore: 60 + Math.floor(Math.random() * 30),
      badgesEarned: Math.floor(Math.random() * 3)
    }));
  }

  private generateRecentActivity(): Activity[] {
    return [
      {
        id: 'activity-1',
        type: 'assessment_completed',
        description: 'Completed Zero Waste Basics assessment',
        date: new Date(Date.now() - 86400000), // 1 day ago
        data: { score: 85, category: CATEGORIES.ZERO_WASTE }
      },
      {
        id: 'activity-2',
        type: 'badge_earned',
        description: 'Earned "First Steps" badge',
        date: new Date(Date.now() - 172800000), // 2 days ago
        data: { badgeId: 'first-assessment' }
      },
      {
        id: 'activity-3',
        type: 'streak_achieved',
        description: 'Achieved 3-day learning streak',
        date: new Date(Date.now() - 259200000), // 3 days ago
        data: { streakLength: 3 }
      }
    ];
  }

  // RANKING CALCULATION METHODS
  calculateUserRankingScore(progress: UserAssessmentProgress): number {
    if (!progress || progress.attemptsCompleted === 0) return 0;
    
    // Weighted scoring algorithm for leaderboard ranking
    const baseScore = progress.totalScore / progress.attemptsCompleted; // Average score (0-100)
    const activityWeight = Math.min(progress.attemptsCompleted / 10, 1); // Activity bonus (0-1)
    const streakWeight = Math.min((progress.currentStreak || 0) / 10, 0.5); // Streak bonus (0-0.5)
    const consistencyWeight = this.calculateConsistencyScore(progress); // Consistency bonus (0-0.3)
    
    // Final ranking score (0-200 scale)
    const rankingScore = baseScore * (1 + activityWeight + streakWeight + consistencyWeight);
    
    return Math.round(Math.min(rankingScore, 200));
  }

  private calculateConsistencyScore(progress: UserAssessmentProgress): number {
    if (!progress.categoryProgress) return 0;
    
    const categories = Object.values(progress.categoryProgress);
    if (categories.length === 0) return 0;
    
    // Calculate how evenly distributed attempts are across categories
    const totalAttempts = categories.reduce((sum, cat) => sum + cat.attempts, 0);
    const averageAttempts = totalAttempts / categories.length;
    
    const variance = categories.reduce((sum, cat) => {
      return sum + Math.pow(cat.attempts - averageAttempts, 2);
    }, 0) / categories.length;
    
    // Lower variance = higher consistency = higher score
    const consistencyScore = Math.max(0, 0.3 - (variance / 100));
    return Math.min(consistencyScore, 0.3);
  }

  updateUserOnlineStatus(isOnline: boolean): void {
    const userId = this.getCurrentUserId();
    
    // Update local status
    localStorage.setItem('user_online_status', JSON.stringify({
      isOnline,
      lastUpdate: new Date()
    }));
    
    // Update backend (fire and forget)
    this.http.patch(`${this.API_BASE_URL}/users/${userId}/status`, { isOnline }, this.httpOptions)
      .pipe(
        catchError(error => {
          console.warn('Failed to update online status:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // PERFORMANCE OPTIMIZATION
  private cacheLeaderboardData(data: LeaderboardEntry[], cacheKey: string): void {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    try {
      localStorage.setItem(`leaderboard_${cacheKey}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache leaderboard data:', error);
    }
  }

  private getCachedLeaderboardData(cacheKey: string): LeaderboardEntry[] | null {
    try {
      const cached = localStorage.getItem(`leaderboard_${cacheKey}`);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      if (Date.now() > cacheEntry.expires) {
        localStorage.removeItem(`leaderboard_${cacheKey}`);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached leaderboard data:', error);
      return null;
    }
  }

  // PUBLIC API METHODS FOR COMPONENTS
  getLeaderboardStats(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/leaderboard/stats`, this.httpOptions)
      .pipe(
        catchError(() => of({
          totalUsers: 150,
          averageScore: 72,
          topStreak: 15,
          mostActive: 'EcoWarrior2024',
          categoryLeaders: {
            [CATEGORIES.ZERO_WASTE]: 'EcoWarrior2024',
            [CATEGORIES.THREE_R]: 'RecycleRanger',
            [CATEGORIES.COMPOSTING]: 'CompostKing'
          }
        }))
      );
  }

  getCurrentUserRank(category?: string): Observable<number | null> {
    const userId = this.getCurrentUserId();
    const params = category ? `?category=${category}` : '';
    
    return this.http.get<{ rank: number }>(`${this.API_BASE_URL}/users/${userId}/rank${params}`, this.httpOptions)
      .pipe(
        map(response => response.rank),
        catchError(() => of(null))
      );
  }

  // SOCIAL FEATURES SUPPORT
  updateSocialMetrics(action: 'help_given' | 'post_shared' | 'challenge_completed'): void {
    const userId = this.getCurrentUserId();
    
    this.http.patch(`${this.API_BASE_URL}/users/${userId}/social`, { action }, this.httpOptions)
      .pipe(
        catchError(error => {
          console.warn('Failed to update social metrics:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  // Initialize user for leaderboard participation
  initializeUserForLeaderboard(): void {
    const userId = this.getCurrentUserId();
    if (!userId || userId === 'anonymous_user') return;
    
    // Ensure user has basic leaderboard profile
    this.http.post(`${this.API_BASE_URL}/leaderboard/initialize`, {
      userId,
      timestamp: new Date()
    }, this.httpOptions)
    .pipe(
      catchError(error => {
        console.warn('Failed to initialize user for leaderboard:', error);
        return of(null);
      })
    )
    .subscribe();
  }

  // Cleanup method to add to ngOnDestroy
  cleanupLeaderboardTracking(): void {
    // Update user as offline
    this.updateUserOnlineStatus(false);
    
    // Clear any pending updates
    // Cancel any running timers/intervals
  }
}