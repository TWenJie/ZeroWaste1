// src/app/interfaces/assessment.interface.ts

export enum QuestionType {
  MULTIPLE_CHOICE = 'multipleChoice',
  TRUE_FALSE = 'trueFalse',
  SHORT_ANSWER = 'shortAnswer'
}

export enum DifficultyLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum BadgeCategory {
  ASSESSMENT = 'assessment',
  STREAK = 'streak',
  MASTERY = 'mastery',
  SOCIAL = 'social',
  SPECIAL = 'special',
  ZERO_WASTE = 'zero-waste',
  THREE_R = '3r-principles',
  COMPOSTING = 'composting'
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum LeaderboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

export enum ImprovementTrend {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining'
}

export enum AwarenessLevel {
  BEGINNER = 'Beginner',
  GROWING = 'Growing',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert'
}

export const CATEGORIES = {
  ZERO_WASTE: 'zero-waste',
  THREE_R: '3r-principles',
  COMPOSTING: 'composting'
} as const;

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category?: string;
  options?: string[];
  correctAnswer: string[];
  points: number;
  difficulty: DifficultyLevel;
  explanation?: string;
  tags?: string[];
  timeEstimate?: number;
  learningObjective?: string;
}

export interface AssessmentConfig {
  timeLimit: number;
  questionsPerAssessment: number;
  passingScore: number;
  difficultyProgression?: {
    minScoreToAdvance: number;
    attemptsBeforeAdvance: number;
  };
  leaderboardConfig?: {
    updateFrequency: number;
    rankingAlgorithm: 'score' | 'improvement' | 'activity';
    minimumAttemptsForRanking: number;
  };
}

export interface WeeklyStats {
  weekStartDate: Date;
  attemptCount: number;
  averageScore: number;
  totalTimeSpent: number;
  improvementFromPreviousWeek: number;
}

export interface CategoryProgress {
  attempts: number;
  totalScore: number;
  averageScore: number;
  lastAttemptDate: Date;
  currentStreak: number;
  longestStreak?: number;
  highestDifficulty: DifficultyLevel;
  totalTimeSpent?: number;
  perfectScores?: number;
  improvementTrend?: ImprovementTrend;
  weeklyStats?: WeeklyStats[];
  recentAttempts: Array<{
    score: number;
    date: Date;
    passed: boolean;
    timeSpent?: number;
    difficulty?: DifficultyLevel;
  }>;
}

export interface PerformanceSnapshot {
  date: Date;
  averageScore: number;
  totalAssessments: number;
  activeDays: number;
  topCategory: string;
  weakestCategory: string;
}

export interface UserAssessmentProgress {
  userId: string;
  attemptsCompleted: number;
  totalScore: number;
  averageTime?: number;
  lastAttemptDate?: Date | null;
  badgesEarned?: Badge[];
  currentStreak?: number;
  longestStreak?: number;
  friendsCount?: number;
  achievements?: Achievement[];
  perfectScores?: number;
  socialActions?: number;
  categoryProgress?: { [categoryId: string]: CategoryProgress };
  currentLevel: DifficultyLevel;
  totalTimeSpent?: number;
  awarenessLevel?: AwarenessLevel;
  improvementTrend?: ImprovementTrend;
  rankingScore?: number;
  lastRankUpdate?: Date;
  isOnline?: boolean;
  studyStreak?: number;
  weeklyGoal?: number;
  weeklyGoalProgress?: number;
  performanceHistory?: PerformanceSnapshot[];
  strengthAreas?: string[];
  improvementAreas?: string[];
  followers?: number;
  following?: number;
  sharedAssessments?: number;
  helpedOthers?: number;
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  category: string;
  difficulty: DifficultyLevel;
}

export interface AssessmentAttempt {
  id?: string | null;
  userId: string;
  questions: Question[];
  answers: string[][];
  score: number;
  totalPossibleScore: number;
  passed: boolean;
  timeTaken: number;
  difficulty: DifficultyLevel;
  completedAt: Date;
  categoryId?: string;
  categoryName?: string;
  timeSpent?: number;
  hintsUsed?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendedActions?: string[];
  startTime?: Date;
  endTime?: Date;
  pausedTime?: number;
  perfectScore?: boolean;
  timeBonus?: number;
  incorrectAnswers?: QuestionResult[];
  moodBefore?: 'confident' | 'nervous' | 'excited' | 'unsure';
  moodAfter?: 'satisfied' | 'disappointed' | 'motivated' | 'confused';
}

export interface RankSnapshot {
  date: Date;
  rank: number;
  score: number;
  category?: string;
}

export interface LeaderboardEntry {
  id: string;
  userName: string;
  displayName?: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  previousRank?: number;
  totalAssessments: number;
  averageScore: number;
  streak: number;
  badges: number;
  lastActive: Date;
  isOnline?: boolean;
  countryCode?: string;
  level: DifficultyLevel;
  achievements?: string[];
  awarenessLevel?: AwarenessLevel;
  improvementTrend?: ImprovementTrend;
  studyTime?: number;
  weeklyAssessments: number;
  monthlyAssessments: number;
  perfectScoreCount: number;
  helpfulVotes: number;
  categoryExpertise: { [category: string]: number };
  rankingHistory: RankSnapshot[];
  joinDate: Date;
  daysActive: number;
  longestStudySession: number;
  favoriteCategory: string;
  followers: number;
  following: number;
  postsShared: number;
  communityChallenges: number;
}

export interface BadgeRequirement {
  type: 'assessments_completed' | 'consecutive_passes' | 'perfect_scores' | 'difficulty_reached' | 'streak_achieved' | 'social_action' | 'time_spent' | 'category_mastery';
  value: number | DifficultyLevel;
  description: string;
  category?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: BadgeRarity;
  points?: number;
  requirements?: BadgeRequirement[];
  earnedDate?: Date;
  criteria?: string;
  icon?: string;
  color?: string;
  unlocksAt?: {
    assessments?: number;
    streak?: number;
    score?: number;
  };
  nextBadge?: string;
  seriesProgress?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  earnedDate: Date;
  category: 'assessment' | 'social' | 'streak' | 'mastery' | 'improvement' | 'consistency';
  rarity: BadgeRarity;
  points?: number;
  shareText?: string;
  unlockedFeatures?: string[];
  celebrationMessage?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  assessmentsTaken: number;
  topicsStudied: string[];
  averageScore: number;
  mood: 'focused' | 'distracted' | 'motivated' | 'tired';
  goals: string[];
  achievements: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  estimatedTimeToComplete: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: {
    badges?: string[];
    points?: number;
    features?: string[];
  };
}

export interface LearningAnalytics {
  userId: string;
  generatedAt: Date;
  timeframe: 'daily' | 'weekly' | 'monthly';
  averageScore: number;
  scoreImprovement: number;
  consistencyScore: number;
  efficiencyScore: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  averageSessionLength: number;
  mostProductiveDay: string;
  strongestCategory: string;
  growthCategory: string;
  recommendedStudyTime: number;
  suggestedCategories: string[];
  skillGaps: string[];
  nextMilestones: Milestone[];
}

export interface Friend {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'in_assessment';
  lastSeen: Date;
  mutualBadges: number;
  friendSince: Date;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  type: 'head_to_head' | 'best_of_three' | 'time_trial';
  status: 'pending' | 'active' | 'completed' | 'declined';
  difficulty: DifficultyLevel;
  createdDate: Date;
  expiryDate: Date;
  results?: ChallengeResult[];
}

export interface ChallengeResult {
  userId: string;
  score: number;
  timeTaken: number;
  completedDate: Date;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special_event';
  startDate: Date;
  endDate: Date;
  participants: number;
  prizes: Prize[];
  rules: string[];
  status: 'upcoming' | 'active' | 'completed';
}

export interface Prize {
  rank: number;
  badge?: Badge;
  title?: string;
  description: string;
}

export interface UserStatistics {
  totalAssessments: number;
  totalTimeSpent: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  friendsCount: number;
  challengesWon: number;
  perfectScores: number;
  assessmentsByDifficulty: {
    [key in DifficultyLevel]: number;
  };
  monthlyProgress: MonthlyProgress[];
  recentActivity: Activity[];
}

export interface MonthlyProgress {
  month: string;
  assessmentsCompleted: number;
  averageScore: number;
  badgesEarned: number;
}

export interface Activity {
  id: string;
  type: 'assessment_completed' | 'badge_earned' | 'friend_added' | 'challenge_won' | 'streak_achieved' | 'level_up';
  description: string;
  date: Date;
  data?: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'badge_earned' | 'challenge_received' | 'friend_request' | 'competition_started' | 'streak_lost';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdDate: Date;
}

export interface UserSettings {
  userId: string;
  notifications: {
    badgeEarned: boolean;
    challengeReceived: boolean;
    friendRequests: boolean;
    streakReminders: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    showInLeaderboard: boolean;
    allowChallenges: boolean;
    showOnlineStatus: boolean;
    showProfileToFriends: boolean;
  };
  preferences: {
    defaultDifficulty: DifficultyLevel;
    autoAdvanceDifficulty: boolean;
    soundEffects: boolean;
    darkMode: boolean;
    language: string;
  };
}