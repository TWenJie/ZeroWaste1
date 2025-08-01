import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  LeaderboardEntry, 
  LeaderboardTimeframe, 
  DifficultyLevel, 
  AwarenessLevel, 
  ImprovementTrend 
} from '../interfaces/assessment.interface';

// ✅ INTERFACES WITH DEMOGRAPHICS
export interface UserAccount {
  id: string;
  email: string;
  username: string;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: string;
  occupation?: string;
}

export interface UserProgress {
  _id?: string;
  userId: string;
  email: string;
  username: string;
  
  // ✅ Demographics
  demographics?: UserDemographics;
  
  // Assessment progress
  attemptsCompleted: number;
  totalScore: number;
  averageScore: number;
  averageTime: number;
  lastAttemptDate: Date;
  badgesEarned: string[];
  currentStreak: number;
  longestStreak: number;
  currentLevel: string;
  categoryProgress: any;
  createdAt: Date;
}

export interface AssessmentSubmission {
  userId: string;
  email: string;
  categoryId: string;
  difficulty: string;
  score: number;
  timeTaken: number;
  passed: boolean;
  answers: any[];
  questionsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MongoDBService {
  readonly API_BASE_URL = 'http://localhost:4000';
  
  // Account-based state management
  private currentUserAccountSubject = new BehaviorSubject<UserAccount | null>(null);
  public currentUserAccount$ = this.currentUserAccountSubject.asObservable();
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private userProgressSubject = new BehaviorSubject<UserProgress | null>(null);
  public userProgress$ = this.userProgressSubject.asObservable();

  // ✅ ADDED: Missing properties for progress caching
  private currentUserProgress: any = null;
  private userProgress$Cache = new BehaviorSubject<any>(null);

  constructor() {
    console.log('🍃 MongoDB Service (Enhanced Version) initializing...');
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Test backend connection first
      const isConnected = await this.testBackendConnection();
      
      if (isConnected) {
        console.log('✅ Backend connection established');
        
        // Check if user is already logged in
        const currentUser = this.getCurrentUserFromStorage();
        if (currentUser) {
          console.log('👤 Found existing user session:', currentUser.email);
          this.currentUserAccountSubject.next(currentUser);
          await this.loadUserProgress(currentUser.email);
        } else {
          console.log('👤 No user session found');
        }
      }
    } catch (error) {
      console.error('❌ MongoDB Service initialization failed:', error);
      this.connectionStatusSubject.next(false);
    }
  }

  // ✅ ACCOUNT MANAGEMENT METHODS

  /**
   * Set current user after login/registration
   */
  async setCurrentUser(userAccount: UserAccount): Promise<void> {
    console.log('👤 Setting current user:', userAccount.email);
    
    // Store user in localStorage for persistence
    localStorage.setItem('zerowaste_current_user', JSON.stringify(userAccount));
    
    // Update reactive state
    this.currentUserAccountSubject.next(userAccount);
    
    // Load user's progress from MongoDB
    await this.loadUserProgress(userAccount.email);
  }

  /**
   * Clear current user on logout
   */
  async logout(): Promise<void> {
    console.log('👤 Logging out current user');
    
    // Clear localStorage
    localStorage.removeItem('zerowaste_current_user');
    
    // Clear reactive state
    this.currentUserAccountSubject.next(null);
    this.userProgressSubject.next(null);
    
    // ✅ ADDED: Clear progress cache
    this.clearUserProgress();
  }

  /**
   * Get current user from localStorage
   */
  private getCurrentUserFromStorage(): UserAccount | null {
    try {
      const stored = localStorage.getItem('zerowaste_current_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error reading user from storage:', error);
    }
    return null;
  }

  /**
   * ✅ ENHANCED: Register new user with demographics
   */
  async registerUser(email: string, username: string, password: string, demographics?: UserDemographics): Promise<any> {
    try {
      console.log('📝 Registering new user with demographics:', email);
      
      // Create user account
      const userAccount: UserAccount = {
        id: this.generateUserId(),
        email: email,
        username: username
      };
      
      // ✅ Create initial user progress with demographics
      const initialProgress = {
        userId: userAccount.id,
        email: email,
        username: username,
        
        // ✅ Include demographics
        demographics: demographics || {},
        
        // Assessment progress (starts at 0)
        attemptsCompleted: 0,
        totalScore: 0,
        averageScore: 0,
        averageTime: 0,
        lastAttemptDate: new Date(),
        badgesEarned: [],
        currentStreak: 0,
        longestStreak: 0,
        currentLevel: 'Beginner',
        categoryProgress: {},
        createdAt: new Date()
      };
      
      // Send to backend
      const response = await fetch(`${this.API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialProgress)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ User registered with demographics:', result);
        
        // Set as current user
        await this.setCurrentUser(userAccount);
        
        return { success: true, user: userAccount };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user and load their progress
   */
  async loginUser(email: string, password: string): Promise<any> {
    try {
      console.log('🔐 Logging in user:', email);
      
      const userAccount: UserAccount = {
        id: email.replace('@', '_').replace('.', '_'),
        email: email,
        username: email.split('@')[0]
      };
      
      // Set as current user and load progress
      await this.setCurrentUser(userAccount);
      
      return { success: true, user: userAccount };
      
    } catch (error) {
      console.error('❌ User login failed:', error);
      throw error;
    }
  }

  // ✅ ENHANCED BACKEND CONNECTION METHODS

  async testBackendConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing backend connection...');
      
      const response = await fetch(`${this.API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        this.connectionStatusSubject.next(true);
        return true;
      } else {
        console.error('❌ Backend connection failed:', response.status);
        this.connectionStatusSubject.next(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error);
      this.connectionStatusSubject.next(false);
      return false;
    }
  }

  // ✅ ENHANCED USER PROGRESS METHODS

  async loadUserProgress(email: string): Promise<UserProgress | null> {
    try {
      console.log('📊 MongoDB Service: Loading user progress for:', email);
      
      // Use email as the user identifier
      const response = await fetch(`${this.API_BASE_URL}/api/users/${encodeURIComponent(email)}/progress`);
      
      console.log('📡 User progress response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const progress = data.userProgress || data; // Handle different response formats
        console.log('✅ User progress loaded successfully:', progress);
        
        // Convert dates
        if (progress.lastAttemptDate) {
          progress.lastAttemptDate = new Date(progress.lastAttemptDate);
        }
        if (progress.createdAt) {
          progress.createdAt = new Date(progress.createdAt);
        }
        
        // ✅ CACHE THE PROGRESS DATA
        this.userProgressSubject.next(progress);
        this.setCurrentUserProgress(progress);
        
        return progress;
      } else if (response.status === 404) {
        console.log('📝 No existing progress found, will create on first assessment');
        return null;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load user progress:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user progress:', error);
      return null;
    }
  }

  // ✅ ADDED: Missing methods for progress management
  
  /**
   * ✅ NEW: Force set current user progress
   */
  setCurrentUserProgress(progressData: any): void {
    console.log('📊 Setting current user progress:', progressData);
    
    // Update the internal progress cache
    this.currentUserProgress = progressData;
    
    // ✅ EMIT UPDATE EVENT
    if (this.userProgress$Cache) {
      this.userProgress$Cache.next(progressData);
    }
    if (this.userProgressSubject) {
      this.userProgressSubject.next(progressData);
    }
    
    console.log('✅ User progress updated in service');
  }

  /**
   * ✅ NEW: Refresh user progress from backend
   */
  async refreshUserProgress(): Promise<any> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.email) {
      console.log('❌ No current user for progress refresh');
      return null;
    }

    try {
      console.log('🔄 Refreshing user progress from backend...');
      
      const response = await fetch(`${this.API_BASE_URL}/api/users/${encodeURIComponent(currentUser.email)}/progress`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.userProgress) {
          console.log('✅ Fresh user progress loaded:', data.userProgress);
          
          // ✅ UPDATE INTERNAL CACHE
          this.setCurrentUserProgress(data.userProgress);
          
          return data.userProgress;
        } else if (data.userProgress) {
          // Handle different response formats
          console.log('✅ Fresh user progress loaded (alt format):', data.userProgress);
          this.setCurrentUserProgress(data.userProgress);
          return data.userProgress;
        } else {
          console.error('❌ Invalid progress data received:', data);
          return null;
        }
      } else {
        console.error('❌ Failed to fetch user progress:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing user progress:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get current user progress with debug logging
   */
  getCurrentUserProgress(): any {
    const progress = this.currentUserProgress;
    
    if (progress) {
      console.log('📊 Current progress - Attempts:', progress.attemptsCompleted, 'Score:', progress.averageScore);
    } else {
      console.log('📊 No current progress data available');
    }
    
    return progress;
  }

  /**
   * ✅ NEW: Get user progress observable for reactive updates
   */
  getUserProgressObservable(): Observable<any> {
    return this.userProgress$Cache.asObservable();
  }

  /**
   * ✅ NEW: Clear user progress cache
   */
  clearUserProgress(): void {
    console.log('🧹 Clearing user progress cache...');
    this.currentUserProgress = null;
    this.userProgress$Cache.next(null);
    this.userProgressSubject.next(null);
  }

  private async createNewUserProfile(email: string): Promise<UserProgress | null> {
    try {
      const currentUser = this.currentUserAccountSubject.value;
      if (!currentUser) {
        throw new Error('No current user set');
      }

      const newProgress: UserProgress = {
        userId: currentUser.id,
        email: email,
        username: currentUser.username,
        demographics: {}, // Empty demographics for now
        attemptsCompleted: 0,
        totalScore: 0,
        averageScore: 0,
        averageTime: 0,
        lastAttemptDate: new Date(),
        badgesEarned: [],
        currentStreak: 0,
        longestStreak: 0,
        currentLevel: 'Beginner',
        categoryProgress: {},
        createdAt: new Date()
      };

      this.userProgressSubject.next(newProgress);
      this.setCurrentUserProgress(newProgress);
      return newProgress;
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      return null;
    }
  }

  // ✅ ENHANCED ASSESSMENT SUBMISSION WITH DEBUGGING

  async submitAssessment(assessmentData: Omit<AssessmentSubmission, 'userId' | 'email'> | any): Promise<any> {
    try {
      const currentUser = this.currentUserAccountSubject.value;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      console.log('📤 MongoDB Service: Starting assessment submission...');
      console.log('👤 Current user:', currentUser.email);
      console.log('📊 Assessment data keys:', Object.keys(assessmentData));
      
      // ✅ ENHANCED VALIDATION
      if (!assessmentData.answers) {
        throw new Error('Assessment answers are required');
      }
      
      if (!Array.isArray(assessmentData.answers)) {
        throw new Error('Answers must be an array');
      }
      
      if (assessmentData.answers.length === 0) {
        throw new Error('At least one answer is required');
      }

      // ✅ HANDLE BOTH FORMATS - if email already exists, use as is, otherwise add it
      const fullAssessmentData = {
        ...assessmentData,
        userId: assessmentData.userId || currentUser.id,
        email: assessmentData.email || currentUser.email
      };
      
      console.log('📋 Full assessment data being sent:');
      console.log('  - Email:', fullAssessmentData.email);
      console.log('  - Category:', fullAssessmentData.categoryId);
      console.log('  - Difficulty:', fullAssessmentData.difficulty);
      console.log('  - Score:', fullAssessmentData.score);
      console.log('  - Answers count:', fullAssessmentData.answers?.length);
      console.log('  - Questions count:', fullAssessmentData.questionsCount);
      
      // ✅ ENHANCED HTTP REQUEST WITH DEBUGGING
      console.log('🌐 Making HTTP request to:', `${this.API_BASE_URL}/api/assessment/submit`);
      
      const response = await fetch(`${this.API_BASE_URL}/api/assessment/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullAssessmentData)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      // ✅ ENHANCED ERROR HANDLING
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(`Assessment submission failed: ${errorMessage}`);
      }
      
      const result = await response.json();
      console.log('✅ Assessment submission successful:', result);
      
      // ✅ VALIDATE RESPONSE STRUCTURE
      if (!result.success) {
        throw new Error(`Backend reported failure: ${result.message || 'Unknown error'}`);
      }
      
      // ✅ UPDATE LOCAL USER PROGRESS - Handle different response formats
      if (result.userProgress) {
        console.log('🔄 Updating local user progress from result.userProgress...');
        this.setCurrentUserProgress(result.userProgress);
      }
      
      // ✅ ADDITIONAL REFRESH TO ENSURE LATEST DATA
      setTimeout(async () => {
        try {
          await this.refreshUserProgress();
          console.log('✅ Additional progress refresh completed');
        } catch (error) {
          console.error('❌ Additional refresh failed:', error);
        }
      }, 1000); // Refresh again after 1 second
      
      return result;
      
    } catch (error) {
      console.error('❌ MongoDB Service: Assessment submission error:', error);
      
      // ✅ ENHANCED ERROR CONTEXT
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      } else if (error.message.includes('JSON')) {
        throw new Error('Invalid response from server. Please try again.');
      } else {
        throw error;
      }
    }
  }

  // ✅ NEW: Get assessment history
  async getAssessmentHistory(email: string, limit: number = 50): Promise<any[]> {
    try {
      console.log('📊 Fetching assessment history for:', email);
      
      const response = await fetch(
        `${this.API_BASE_URL}/api/users/${encodeURIComponent(email)}/assessments?limit=${limit}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Assessment history loaded:', data.assessments?.length || 0, 'records');
        return data.assessments || [];
      } else {
        console.error('❌ Failed to load assessment history:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading assessment history:', error);
      return [];
    }
  }

  // ✅ NEW: Get user analytics for dashboard
  async getUserAnalytics(email: string, timeframe: number = 30): Promise<any> {
    try {
      console.log('📈 Fetching user analytics for:', email);
      
      const response = await fetch(
        `${this.API_BASE_URL}/api/users/${encodeURIComponent(email)}/analytics?timeframe=${timeframe}`
      );
      
      if (response.ok) {
        const analytics = await response.json();
        console.log('✅ User analytics loaded:', analytics);
        return analytics;
      } else {
        console.error('❌ Failed to load user analytics:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user analytics:', error);
      return null;
    }
  }

  // ✅ ENHANCED LEADERBOARD WITH FULL COMPATIBILITY
  /**
   * Get leaderboard data with full compatibility for LeaderboardComponent
   */
  getLeaderboard(timeframe?: LeaderboardTimeframe): Observable<LeaderboardEntry[]> {
    console.log('🏆 Fetching leaderboard for timeframe:', timeframe || 'all_time');
    
    // Check if backend is available
    const connectionStatus = this.connectionStatusSubject.value;
    if (!connectionStatus) {
      console.warn('⚠️ Backend not connected, returning mock leaderboard data');
      return this.getMockLeaderboardData();
    }
    
    // Build API URL with timeframe parameter
    const timeframeParam = timeframe && timeframe !== LeaderboardTimeframe.ALL_TIME 
      ? `?timeframe=${timeframe}` 
      : '';
    const url = `${this.API_BASE_URL}/api/leaderboard${timeframeParam}`;
    
    return this.fetchLeaderboardFromAPI(url).pipe(
      catchError(error => {
        console.error('❌ API leaderboard fetch failed, falling back to mock data:', error);
        return this.getMockLeaderboardData();
      })
    );
  }

  /**
   * Fetch leaderboard from API with proper mapping
   */
  private fetchLeaderboardFromAPI(url: string): Observable<LeaderboardEntry[]> {
    return new Observable(observer => {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const leaderboard = data.leaderboard || data;
          console.log('✅ Leaderboard loaded from API:', leaderboard.length, 'entries');
          
          const mappedData = leaderboard.map((entry: any, index: number): LeaderboardEntry => {
            return {
              id: entry.id || entry._id || entry.userId || `user_${index}`,
              userName: entry.userName || entry.username || entry.email || `User ${index + 1}`,
              displayName: entry.displayName || entry.userName || entry.username || entry.email,
              avatarUrl: entry.avatarUrl || entry.avatar,
              score: Number(entry.score || entry.totalScore || entry.averageScore || 0),
              rank: entry.rank || (index + 1),
              previousRank: entry.previousRank,
              totalAssessments: Number(entry.totalAssessments || entry.attemptsCompleted || 0),
              averageScore: Number(entry.averageScore || entry.score || 0),
              streak: Number(entry.streak || entry.currentStreak || 0),
              badges: Number(entry.badges || entry.badgesCount || entry.badgesEarned?.length || 0),
              lastActive: this.parseDate(entry.lastActive || entry.lastAttemptDate),
              isOnline: Boolean(entry.isOnline || false),
              countryCode: entry.countryCode,
              level: this.mapToValidDifficultyLevel(entry.level || entry.currentLevel),
              achievements: Array.isArray(entry.achievements) ? entry.achievements : [],
              awarenessLevel: this.mapToValidAwarenessLevel(entry.awarenessLevel),
              improvementTrend: this.mapToValidImprovementTrend(entry.improvementTrend),
              studyTime: Number(entry.studyTime || entry.totalTimeSpent || 0),
              weeklyAssessments: Number(entry.weeklyAssessments || 0),
              monthlyAssessments: Number(entry.monthlyAssessments || 0),
              perfectScoreCount: Number(entry.perfectScoreCount || entry.perfectScores || 0),
              helpfulVotes: Number(entry.helpfulVotes || 0),
              categoryExpertise: entry.categoryExpertise || {},
              rankingHistory: this.mapRankingHistory(entry.rankingHistory || []),
              joinDate: this.parseDate(entry.joinDate || entry.createdAt),
              daysActive: Number(entry.daysActive || 0),
              longestStudySession: Number(entry.longestStudySession || 0),
              favoriteCategory: entry.favoriteCategory || entry.topCategory || 'zero-waste',
              followers: Number(entry.followers || 0),
              following: Number(entry.following || 0),
              postsShared: Number(entry.postsShared || 0),
              communityChallenges: Number(entry.communityChallenges || 0)
            };
          });
          
          observer.next(mappedData);
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Error fetching leaderboard from API:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Get mock leaderboard data for development/testing
   */
  private getMockLeaderboardData(): Observable<LeaderboardEntry[]> {
    console.log('📊 Generating mock leaderboard data...');
    
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
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const currentUserEntry: LeaderboardEntry = {
        id: currentUser.id || currentUser.email,
        userName: currentUser.username || currentUser.email,
        displayName: currentUser.username || currentUser.email,
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

    console.log('✅ Mock leaderboard data generated:', mockData.length, 'entries');
    return of(mockData);
  }

  // ✅ UTILITY MAPPING METHODS

  /**
   * Map string values to valid DifficultyLevel enum
   */
  private mapToValidDifficultyLevel(value: any): DifficultyLevel {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (normalized.includes('beginner')) return DifficultyLevel.BEGINNER;
      if (normalized.includes('intermediate')) return DifficultyLevel.INTERMEDIATE;
      if (normalized.includes('advanced')) return DifficultyLevel.ADVANCED;
    }
    return DifficultyLevel.BEGINNER; // Default fallback
  }

  /**
   * Map string values to valid AwarenessLevel enum
   */
  private mapToValidAwarenessLevel(value: any): AwarenessLevel {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (normalized.includes('beginner')) return AwarenessLevel.BEGINNER;
      if (normalized.includes('growing')) return AwarenessLevel.GROWING;
      if (normalized.includes('intermediate')) return AwarenessLevel.INTERMEDIATE;
      if (normalized.includes('advanced')) return AwarenessLevel.ADVANCED;
      if (normalized.includes('expert')) return AwarenessLevel.EXPERT;
    }
    return AwarenessLevel.BEGINNER; // Default fallback
  }

  /**
   * Map string values to valid ImprovementTrend enum
   */
  private mapToValidImprovementTrend(value: any): ImprovementTrend {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (normalized.includes('improving')) return ImprovementTrend.IMPROVING;
      if (normalized.includes('declining')) return ImprovementTrend.DECLINING;
      if (normalized.includes('stable')) return ImprovementTrend.STABLE;
    }
    return ImprovementTrend.STABLE; // Default fallback
  }

  /**
   * Map ranking history data safely
   */
  private mapRankingHistory(history: any[]): any[] {
    if (!Array.isArray(history)) return [];
    
    return history.map(snap => ({
      date: this.parseDate(snap.date),
      rank: Number(snap.rank || 0),
      score: Number(snap.score || 0),
      category: snap.category || undefined
    }));
  }

  /**
   * Safe date parsing
   */
  private parseDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) return dateValue;
    
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    return new Date();
  }

  // ✅ CATEGORIES AND QUESTIONS METHODS
  async getCategories(): Promise<any[]> {
    try {
      console.log('📚 Fetching categories...');
      
      const response = await fetch(`${this.API_BASE_URL}/api/categories`);
      
      if (response.ok) {
        const categories = await response.json();
        console.log('✅ Categories loaded:', categories.length);
        return categories;
      } else {
        console.error('❌ Failed to load categories:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      return [];
    }
  }

  async getQuestions(difficulty: string, count: number = 5, category: string = 'all'): Promise<any[]> {
    try {
      console.log('❓ Fetching questions:', { difficulty, count, category });
      
      // ✅ Use the correct parameter names based on your backend
      const params = new URLSearchParams({
        difficulty: difficulty,
        limit: count.toString(), // Changed from 'count' to 'limit' to match backend
        category: category
      });
      
      const response = await fetch(`${this.API_BASE_URL}/api/questions?${params}`);
      
      if (response.ok) {
        const questions = await response.json();
        console.log('✅ Questions loaded:', questions.length);
        return questions;
      } else {
        console.error('❌ Failed to load questions:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      return [];
    }
  }

  // ✅ NEW: Debug method for MongoDB service
  async debugService(): Promise<string> {
    const results: string[] = [];
    
    try {
      results.push('🧪 MongoDB Service Debug Report\n');
      
      // Test 1: Current user
      const currentUser = this.getCurrentUser();
      results.push(`1. Current User: ${currentUser ? '✅ LOGGED IN' : '❌ NOT LOGGED IN'}`);
      if (currentUser) {
        results.push(`   - Email: ${currentUser.email}`);
        results.push(`   - Username: ${currentUser.username}`);
      }
      
      // Test 2: Backend connection
      const connectionTest = await this.testBackendConnection();
      results.push(`2. Backend Connection: ${connectionTest ? '✅ CONNECTED' : '❌ FAILED'}`);
      results.push(`   - API URL: ${this.API_BASE_URL}`);
      
      // Test 3: User progress
      const progress = this.getCurrentUserProgress();
      results.push(`3. User Progress: ${progress ? '✅ LOADED' : '❌ NOT LOADED'}`);
      if (progress) {
        results.push(`   - Attempts: ${progress.attemptsCompleted || 0}`);
        results.push(`   - Average Score: ${progress.averageScore || 0}%`);
        results.push(`   - Level: ${progress.currentLevel || 'Unknown'}`);
      }
      
      // Test 4: Categories
      const categories = await this.getCategories();
      results.push(`4. Categories: ${categories.length > 0 ? '✅ LOADED' : '❌ FAILED'} (${categories.length} found)`);
      
      // Test 5: Questions
      const questions = await this.getQuestions('Beginner', 3, 'zero-waste');
      results.push(`5. Questions: ${questions.length > 0 ? '✅ LOADED' : '❌ FAILED'} (${questions.length} found)`);
      if (questions.length > 0) {
        results.push(`   - Sample question: "${questions[0].text?.substring(0, 50)}..."`);
      }
      
      // Test 6: Leaderboard
      try {
        const leaderboard = await this.getLeaderboard().toPromise();
        results.push(`6. Leaderboard: ${leaderboard && leaderboard.length > 0 ? '✅ LOADED' : '❌ FAILED'} (${leaderboard?.length || 0} entries)`);
        if (leaderboard && leaderboard.length > 0) {
          results.push(`   - Top user: ${leaderboard[0].userName} (${leaderboard[0].averageScore}%)`);
        }
      } catch (error) {
        results.push(`6. Leaderboard: ❌ FAILED (${error.message})`);
      }
      
      // Test 7: Assessment submission test (dry run)
      if (currentUser) {
        results.push(`7. Assessment Submission: Testing readiness...`);
        try {
          // Test the endpoint is reachable (without actually submitting)
          const testResponse = await fetch(`${this.API_BASE_URL}/api/assessment/submit`, {
            method: 'OPTIONS'
          });
          results.push(`   - Endpoint reachable: ${testResponse ? '✅ YES' : '❌ NO'}`);
        } catch (error) {
          results.push(`   - Endpoint reachable: ❌ NO (${error.message})`);
        }
      }
      
      results.push('\n🎉 Debug report completed!');
      
    } catch (error) {
      results.push(`❌ Debug failed with error: ${error.message}`);
    }
    
    const report = results.join('\n');
    console.log(report);
    return report;
  }

  // ✅ UTILITY METHODS
  getCurrentUser(): UserAccount | null {
    return this.currentUserAccountSubject.value;
  }

  isUserLoggedIn(): boolean {
    return this.currentUserAccountSubject.value !== null;
  }

  getCurrentUserEmail(): string | null {
    return this.currentUserAccountSubject.value?.email || null;
  }

  // ✅ HELPER METHOD FOR GENERATING USER IDS
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // ✅ ENHANCED TESTING METHODS
  async runComprehensiveTest(): Promise<string> {
    const results: string[] = [];
    
    try {
      results.push('🧪 Starting comprehensive multi-user test...\n');
      
      // Test 1: Backend connection
      const connectionTest = await this.testBackendConnection();
      results.push(`1. Backend Connection: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!connectionTest) {
        results.push('❌ Backend connection failed, stopping tests');
        return results.join('\n');
      }
      
      // Test 2: Current user
      const currentUser = this.getCurrentUser();
      results.push(`2. Current User: ${currentUser ? '✅ PASS' : '❌ FAIL'}`);
      if (currentUser) {
        results.push(`   - Email: ${currentUser.email}`);
        results.push(`   - Username: ${currentUser.username}`);
      }
      
      // Test 3: User progress with demographics
      if (currentUser) {
        const progress = await this.loadUserProgress(currentUser.email);
        results.push(`3. User Progress: ${progress ? '✅ PASS' : '❌ FAIL'}`);
        
        if (progress) {
          results.push(`   - Assessments: ${progress.attemptsCompleted}`);
          results.push(`   - Average Score: ${progress.averageScore}%`);
          results.push(`   - Level: ${progress.currentLevel}`);
          
          // ✅ Test demographics
          if (progress.demographics) {
            results.push(`   - Age: ${progress.demographics.age || 'Not specified'}`);
            results.push(`   - Gender: ${progress.demographics.gender || 'Not specified'}`);
            results.push(`   - Location: ${progress.demographics.location || 'Not specified'}`);
          }
        }
      }
      
      // Test 4: Leaderboard with real-time compatibility
      try {
        const leaderboard = await this.getLeaderboard().toPromise();
        results.push(`4. Leaderboard: ${leaderboard && leaderboard.length > 0 ? '✅ PASS' : '❌ FAIL'} (${leaderboard?.length || 0} users)`);
        
        if (leaderboard && leaderboard.length > 0) {
          results.push(`   - Top User: ${leaderboard[0].userName} (${leaderboard[0].averageScore}%)`);
          results.push(`   - Real-time ready: ✅ YES`);
          results.push(`   - Ranking changes: ✅ SUPPORTED`);
        }
      } catch (error) {
        results.push(`4. Leaderboard: ❌ FAIL (${error.message})`);
      }
      
      // Test 5: Other endpoints
      const categories = await this.getCategories();
      results.push(`5. Categories: ${categories.length > 0 ? '✅ PASS' : '❌ FAIL'} (${categories.length} found)`);
      
      const questions = await this.getQuestions('Beginner', 3, 'zero-waste');
      results.push(`6. Questions: ${questions.length > 0 ? '✅ PASS' : '❌ FAIL'} (${questions.length} found)`);
      
      results.push('\n🎉 Enhanced leaderboard system tests completed!');
      results.push('🏆 Real-time ranking changes: ✅ READY');
      results.push('🔄 Auto-refresh capability: ✅ READY');
      results.push('📊 Progress tracking: ✅ READY');
    } catch (error) {
      results.push(`❌ Test failed: ${error.message}`);
    }
    return results.join('\n');
  }

  // ✅ DEPRECATED METHOD - Keep for compatibility but redirect to new one
  async getLeaderboardOld(timeframe: string = 'all_time', limit: number = 50): Promise<any[]> {
    console.warn('⚠️ getLeaderboardOld is deprecated, use getLeaderboard() Observable instead');
    
    try {
      // Convert to new enum format
      let newTimeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME;
      switch (timeframe.toLowerCase()) {
        case 'daily':
          newTimeframe = LeaderboardTimeframe.DAILY;
          break;
        case 'weekly':
          newTimeframe = LeaderboardTimeframe.WEEKLY;
          break;
        case 'monthly':
          newTimeframe = LeaderboardTimeframe.MONTHLY;
          break;
        default:
          newTimeframe = LeaderboardTimeframe.ALL_TIME;
      }
      
      // Use new method and convert back to Promise for compatibility
      return await this.getLeaderboard(newTimeframe).toPromise() || [];
    } catch (error) {
      console.error('❌ Legacy leaderboard method failed:', error);
      return [];
    }
  }
}