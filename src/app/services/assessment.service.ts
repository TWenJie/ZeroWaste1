// src/app/services/assessment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { 
  LeaderboardEntry, 
  Question, 
  DifficultyLevel, 
  QuestionType,
  UserAssessmentProgress,
  AssessmentConfig,
  AssessmentAttempt,
  Badge
} from '../interfaces/assessment.interface';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = 'your-api-endpoint'; // Replace with your actual API endpoint when ready
  
  // Mock assessment configuration
  private mockAssessmentConfig: AssessmentConfig = {
    timeLimit: 300, // 5 minutes
    questionsPerAssessment: 10,
    passingScore: 70
  };

  // Mock user progress
  private mockUserProgress: UserAssessmentProgress = {
    userId: 'user-123',
    attemptsCompleted: 2,
    totalScore: 150,
    averageTime: 240,
    lastAttemptDate: new Date(),
    badgesEarned: [
      {
        id: 'badge-1',
        name: 'Recycling Rookie',
        description: 'Completed your first assessment',
        criteria: 'Complete 1 assessment',
        imageUrl: 'assets/badges/rookie.png'
      }
    ]
  };
  
  // User progress BehaviorSubject
  private userProgressSubject = new BehaviorSubject<UserAssessmentProgress>(this.mockUserProgress);
  userProgress$ = this.userProgressSubject.asObservable();

  // Mock question bank
  private mockQuestions: { [key in DifficultyLevel]: Question[] } = {
    [DifficultyLevel.BEGINNER]: [
      {
        id: 'q1',
        text: 'Which of these items cannot be recycled?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Plastic bottles', 'Glass jars', 'Styrofoam containers', 'Aluminum cans'],
        correctAnswer: ['Styrofoam containers'],
        points: 10,
        difficulty: DifficultyLevel.BEGINNER
      },
      {
        id: 'q2',
        text: 'What does the term "zero waste" mean?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'Producing no trash at all',
          'Sending nothing to landfill',
          'Recycling everything you use',
          'Only using biodegradable products'
        ],
        correctAnswer: ['Sending nothing to landfill'],
        points: 10,
        difficulty: DifficultyLevel.BEGINNER
      },
      {
        id: 'q3',
        text: 'Which of these is a principle of zero waste living?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Refuse', 'Restock', 'Rehome', 'Repurchase'],
        correctAnswer: ['Refuse'],
        points: 10,
        difficulty: DifficultyLevel.BEGINNER
      },
      {
        id: 'q4',
        text: 'Which material takes the longest to decompose in a landfill?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Paper', 'Aluminum cans', 'Plastic bottles', 'Glass bottles'],
        correctAnswer: ['Glass bottles'],
        points: 10,
        difficulty: DifficultyLevel.BEGINNER
      },
      {
        id: 'q5',
        text: 'What is composting?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'Burning waste to generate energy',
          'Decomposing organic matter into soil',
          'Recycling plastic into new products',
          'Treating water before disposal'
        ],
        correctAnswer: ['Decomposing organic matter into soil'],
        points: 10,
        difficulty: DifficultyLevel.BEGINNER
      }
    ],
    [DifficultyLevel.INTERMEDIATE]: [
      {
        id: 'q6',
        text: 'Which of these food items cannot be composted in a home composting system?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Fruit peels', 'Vegetable scraps', 'Dairy products', 'Coffee grounds'],
        correctAnswer: ['Dairy products'],
        points: 15,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: 'q7',
        text: 'What does the term "upcycling" refer to?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'Recycling items multiple times',
          'Converting waste into new materials of better quality',
          'Upgrading recycling facilities',
          'Using biodegradable materials'
        ],
        correctAnswer: ['Converting waste into new materials of better quality'],
        points: 15,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: 'q8',
        text: 'Which plastic recycling number is typically not accepted in curbside recycling programs?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['#1 (PET)', '#2 (HDPE)', '#6 (Polystyrene)', '#5 (Polypropylene)'],
        correctAnswer: ['#6 (Polystyrene)'],
        points: 15,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: 'q9',
        text: 'What is a "zero waste" store?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'A store that recycles everything it sells',
          'A store that sells products with minimal or no packaging',
          'A store that only sells biodegradable products',
          'A store that composts all its waste'
        ],
        correctAnswer: ['A store that sells products with minimal or no packaging'],
        points: 15,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      {
        id: 'q10',
        text: 'Which of these materials is biodegradable?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Traditional plastic', 'Aluminum', 'Cotton', 'Styrofoam'],
        correctAnswer: ['Cotton'],
        points: 15,
        difficulty: DifficultyLevel.INTERMEDIATE
      }
    ],
    [DifficultyLevel.ADVANCED]: [
      {
        id: 'q11',
        text: 'What is "wishcycling" and why is it problematic?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'Recycling items without cleaning them first, which contaminates recycling',
          'Putting items in recycling in hopes they can be recycled, which contaminates recycling streams',
          'Wishing for more recycling options, which leads to landfill overflow',
          'Recycling items too frequently, which wastes resources'
        ],
        correctAnswer: ['Putting items in recycling in hopes they can be recycled, which contaminates recycling streams'],
        points: 20,
        difficulty: DifficultyLevel.ADVANCED
      },
      {
        id: 'q12',
        text: 'Which of these approaches would have the lowest environmental impact according to zero waste principles?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'Recycling plastic water bottles',
          'Using compostable single-use cups',
          'Using a reusable water bottle',
          'Using aluminum cans instead of plastic'
        ],
        correctAnswer: ['Using a reusable water bottle'],
        points: 20,
        difficulty: DifficultyLevel.ADVANCED
      },
      {
        id: 'q13',
        text: 'What is "extended producer responsibility" (EPR)?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'When consumers take responsibility for properly disposing of products',
          'When manufacturers are responsible for the entire lifecycle of their products, including disposal',
          'When retailers offer recycling programs in their stores',
          'When products are designed to last longer'
        ],
        correctAnswer: ['When manufacturers are responsible for the entire lifecycle of their products, including disposal'],
        points: 20,
        difficulty: DifficultyLevel.ADVANCED
      },
      {
        id: 'q14',
        text: 'Which of these textiles has the lowest environmental impact?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Polyester', 'Conventional cotton', 'Organic hemp', 'Nylon'],
        correctAnswer: ['Organic hemp'],
        points: 20,
        difficulty: DifficultyLevel.ADVANCED
      },
      {
        id: 'q15',
        text: 'What is a "circular economy"?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          'An economy where products are made, used, and disposed of linearly',
          'An economic system aimed at eliminating waste by continually reusing resources',
          'An economy focused on recycling as the primary waste management strategy',
          'An economy where consumers are responsible for all waste management'
        ],
        correctAnswer: ['An economic system aimed at eliminating waste by continually reusing resources'],
        points: 20,
        difficulty: DifficultyLevel.ADVANCED
      }
    ]
  };

  // Mock badges
  private mockBadges: Badge[] = [
    {
      id: 'badge-1',
      name: 'Recycling Rookie',
      description: 'Completed your first assessment',
      criteria: 'Complete 1 assessment',
      imageUrl: 'assets/badges/rookie.png'
    },
    {
      id: 'badge-2',
      name: 'Sustainability Scholar',
      description: 'Achieved a perfect score on an intermediate assessment',
      criteria: 'Score 100% on intermediate difficulty',
      imageUrl: 'assets/badges/scholar.png'
    },
    {
      id: 'badge-3',
      name: 'Zero Waste Zealot',
      description: 'Completed 5 assessments with passing scores',
      criteria: 'Complete 5 assessments with passing scores',
      imageUrl: 'assets/badges/zealot.png'
    }
  ];

  // Mock leaderboard
  private mockLeaderboard: LeaderboardEntry[] = [
    {
      id: 'user-456',
      userName: 'EcoWarrior',
      score: 95,
      rank: 1
    },
    {
      id: 'user-789',
      userName: 'GreenGuru',
      score: 90,
      rank: 2
    },
    {
      id: 'user-123', // Current user
      userName: 'You',
      score: 85,
      rank: 3
    },
    {
      id: 'user-101',
      userName: 'RecycleKing',
      score: 80,
      rank: 4
    },
    {
      id: 'user-202',
      userName: 'EarthDefender',
      score: 75,
      rank: 5
    }
  ];

  constructor(private http: HttpClient) {
    // When in production mode, you would load actual user progress here
  }

  // Get assessment questions based on difficulty and type
  getQuestions(difficulty: DifficultyLevel, type: QuestionType): Observable<Question[]> {
    // In production, this would be an API call
    // For now, we'll return mock data with a simulated delay
    const questions = this.mockQuestions[difficulty]
      .filter(q => !type || q.type === type)
      .slice(0, this.mockAssessmentConfig.questionsPerAssessment);
      
    return of(questions).pipe(delay(800)); // Simulate network delay
  }
  
  // Submit assessment attempt
  submitAssessment(attempt: AssessmentAttempt): Observable<UserAssessmentProgress> {
    // In production, this would send data to your API
    // For now, we'll update the mock user progress
    
    // Update mock progress
    const updatedProgress: UserAssessmentProgress = {
      ...this.mockUserProgress,
      attemptsCompleted: this.mockUserProgress.attemptsCompleted + 1,
      totalScore: this.mockUserProgress.totalScore + attempt.score,
      averageTime: (this.mockUserProgress.averageTime * this.mockUserProgress.attemptsCompleted + attempt.timeTaken) / 
                  (this.mockUserProgress.attemptsCompleted + 1),
      lastAttemptDate: new Date()
    };
    
    // If they passed, maybe award a badge
    if (attempt.passed && updatedProgress.badgesEarned.length === 1) {
      updatedProgress.badgesEarned.push(this.mockBadges[1]); // Add scholar badge
    }
    
    // Update the BehaviorSubject
    this.mockUserProgress = updatedProgress;
    this.userProgressSubject.next(updatedProgress);
    
    // Return the updated progress with a simulated delay
    return of(updatedProgress).pipe(delay(1000));
  }
  
  // Get available badges
  getAvailableBadges(): Observable<Badge[]> {
    // In production, this would be an API call
    return of(this.mockBadges).pipe(delay(800));
  }

  // Get leaderboard
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    // In production, this would be an API call
    return of(this.mockLeaderboard).pipe(delay(800));
  }

  // Get assessment configuration
  getAssessmentConfig(): Observable<AssessmentConfig> {
    // In production, this would be an API call
    return of(this.mockAssessmentConfig).pipe(delay(500));
  }

  // Calculate adaptive difficulty based on user progress
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
}