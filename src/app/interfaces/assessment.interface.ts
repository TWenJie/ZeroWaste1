// First, check if these enums are already defined elsewhere in your project
// If not, define them here:

export enum QuestionType {
  MULTIPLE_CHOICE = 'multipleChoice',
  TRUE_FALSE = 'trueFalse',
  SHORT_ANSWER = 'shortAnswer'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// Then continue with the rest of your interfaces
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category?: string;
  options?: string[];
  correctAnswer: string[];
  points: number;
  difficulty: DifficultyLevel;
  // Any other properties
}

export interface AssessmentConfig {
  timeLimit: number;
  questionsPerAssessment: number;
  passingScore: number;
  // Add other required properties
}

export interface UserAssessmentProgress {
  userId: string;
  attemptsCompleted: number;
  totalScore: number;
  averageTime: number;
  lastAttemptDate: Date | null;
  badgesEarned: Badge[];
  // Other properties
}

export interface AssessmentAttempt {
  id: string | null;
  userId: string;
  date: Date;
  score: number;
  timeTaken: number;
  difficulty: DifficultyLevel;
  questions: Question[];
  passed: boolean;
  questionsAnswered: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  criteria: string;
}

export interface LeaderboardEntry {
  id: string;
  userName: string;
  score: number;
  rank: number;
  // Other properties
}