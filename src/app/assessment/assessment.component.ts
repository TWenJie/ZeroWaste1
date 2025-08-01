// assessment.component.ts - FIXED VERSION for 0% Score Issue

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { MongoDBService } from '../services/mongodb.service';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/user.class';

import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  UserAssessmentProgress,
  AssessmentAttempt,
  AssessmentConfig
} from '../interfaces/assessment.interface';

interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
  difficulties: DifficultyLevel[];
}

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.scss']
})
export class AssessmentComponent implements OnInit, OnDestroy {
  // Expose enum to the template
  DifficultyLevel = DifficultyLevel;
  QuestionType = QuestionType;
  
  private destroy$ = new Subject<void>();
  private timer: any;

  // 🔧 ENHANCED DEBUG MODE - SET TO TRUE FOR DEBUGGING
  debugMode = true;

  // USER MANAGEMENT
  currentUser: User | null = null;

  // Assessment state
  currentQuestions: Question[] = [];
  assessmentForm: FormGroup;
  timeRemaining: number = 0;
  currentDifficulty: DifficultyLevel = DifficultyLevel.BEGINNER;
  
  // PROGRESS TRACKING
  currentQuestionIndex: number = 0;
  answeredQuestions: Set<number> = new Set();
  progressPercentage: number = 0;
  
  // Category support
  availableCategories: QuestionCategory[] = [];
  selectedCategory: QuestionCategory | null = null;
  selectedDifficulty: DifficultyLevel | null = null;
  showCategorySelector = false;
  
  // Configuration and progress
  assessmentConfig: AssessmentConfig = {
    timeLimit: 300, // 5 minutes default
    passingScore: 70,
    questionsPerAssessment: 5
  };

  // UI states
  isAssessmentActive = false;
  isSubmitting = false;
  showResults = false;
  lastAssessmentResult: any = null;
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private mongoService: MongoDBService,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private zone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🚀 Assessment component initialized with MongoDB integration');
    
    this.authService.user.pipe(takeUntil(this.destroy$)).subscribe(async user => {
      this.currentUser = user;
      if (user) {
        console.log('👤 Current user for assessment:', user.email);
        await this.loadUserProgress();
      } else {
        console.log('⚠️ No user logged in');
        this.router.navigate(['/login']);
      }
    });

    this.loadCategoriesFromMongoDB();
  }

  private async loadCategoriesFromMongoDB() {
    try {
      console.log('📚 Loading categories from MongoDB...');
      const categories = await this.mongoService.getCategories();
      
      if (categories && categories.length > 0) {
        this.availableCategories = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          icon: this.getCategoryIcon(cat.id),
          color: this.getCategoryColor(cat.id),
          questionCount: cat.questionCount || 15,
          difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
        }));
        console.log('✅ Categories loaded from MongoDB:', this.availableCategories);
      } else {
        this.loadFallbackCategories();
      }
    } catch (error) {
      console.error('❌ Failed to load categories from MongoDB:', error);
      this.loadFallbackCategories();
    }
  }

  private loadFallbackCategories() {
    console.log('📚 Using fallback categories...');
    this.availableCategories = [
      {
        id: 'zero-waste',
        name: 'Zero Waste',
        description: 'Learn about zero waste principles and sustainable living practices',
        icon: '🌍',
        color: '#2E7D32',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      },
      {
        id: '3r-principles',
        name: '3R Principles',
        description: 'Master the 3R principles: Reduce, Reuse, and Recycle',
        icon: '♻️',
        color: '#1976D2',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      },
      {
        id: 'composting',
        name: 'Composting',
        description: 'Discover organic waste composting techniques and benefits',
        icon: '🌱',
        color: '#388E3C',
        questionCount: 15,
        difficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
      }
    ];
  }

  private getCategoryIcon(categoryId: string): string {
    const icons: { [key: string]: string } = {
      'zero-waste': '🌍',
      '3r-principles': '♻️',
      'composting': '🌱'
    };
    return icons[categoryId] || '📚';
  }

  private getCategoryColor(categoryId: string): string {
    const colors: { [key: string]: string } = {
      'zero-waste': '#2E7D32',
      '3r-principles': '#1976D2',
      'composting': '#388E3C'
    };
    return colors[categoryId] || '#666666';
  }

  startCategoryBasedAssessment() {
    console.log('🏷️ Starting category-based assessment');
    this.showCategorySelector = true;
  }

  selectCategory(category: QuestionCategory) {
    console.log('🏷️ Category selected:', category.name);
    this.selectedCategory = category;
  }

  selectDifficulty(difficulty: DifficultyLevel) {
    console.log('🎚️ Difficulty selected:', difficulty);
    this.selectedDifficulty = difficulty;
    this.showCategorySelector = false;
    this.startAssessment();
  }

  goBackToCategories() {
    this.selectedCategory = null;
    this.selectedDifficulty = null;
  }

  startGeneralAssessment() {
    console.log('🚀 Starting general assessment');
    this.selectedCategory = null;
    this.selectedDifficulty = this.currentDifficulty;
    this.startAssessment();
  }

  // 🎯 FIXED: Enhanced assessment start with better question mapping
  async startAssessment() {
    if (!this.currentUser) {
      alert('Please login to take assessment');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🚀 Starting assessment...');
    console.log('Selected category:', this.selectedCategory?.name || 'General');
    console.log('Selected difficulty:', this.selectedDifficulty || this.currentDifficulty);
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const targetDifficulty = this.selectedDifficulty || this.currentDifficulty;
      const categoryId = this.selectedCategory?.id || 'zero-waste';
      
      console.log('📝 Fetching questions from MongoDB:', {
        difficulty: this.getDifficultyLabel(targetDifficulty),
        category: categoryId,
        count: this.assessmentConfig.questionsPerAssessment
      });

      const questions = await this.mongoService.getQuestions(
        this.getDifficultyLabel(targetDifficulty),
        this.assessmentConfig.questionsPerAssessment,
        categoryId
      );

      if (!questions || questions.length === 0) {
        throw new Error(`No questions available for ${this.selectedCategory?.name || 'this category'} at ${this.getDifficultyLabel(targetDifficulty)} level`);
      }

      // 🎯 CRITICAL FIX: Enhanced question mapping with field validation
      this.currentQuestions = questions.map((q, index) => {
        if (this.debugMode) {
          console.log(`🔍 Processing question ${index + 1}:`, {
            id: q._id,
            text: q.text || q.questionText || q.question,
            correctAnswer: q.correctAnswer,
            options: q.options,
            rawQuestion: q
          });
        }

        // 🚨 CRITICAL: Determine the correct answer format
        let correctAnswer = q.correctAnswer;
        
        // If correctAnswer is a string but we need an array, convert it
        if (typeof correctAnswer === 'string') {
          correctAnswer = [correctAnswer];
        }
        
        // Ensure we have options
        const options = q.options || q.choices || [];
        
        // Validate that correct answer exists in options (for multiple choice)
        if (options.length > 0 && correctAnswer && correctAnswer.length > 0) {
          const correctInOptions = options.some((opt: string) => 
            correctAnswer.some((ans: string) => 
              opt.trim().toLowerCase() === ans.trim().toLowerCase()
            )
          );
          
          if (!correctInOptions && this.debugMode) {
            console.warn(`⚠️ Question ${index + 1}: Correct answer not found in options`, {
              correctAnswer,
              options
            });
          }
        }

        return {
          id: q._id || `q_${index}`,
          text: q.text || q.questionText || q.question,
          questionText: q.text || q.questionText || q.question,
          type: QuestionType.MULTIPLE_CHOICE,
          options: options,
          correctAnswer: correctAnswer, // Keep as array for consistency
          points: q.points || 10,
          difficulty: targetDifficulty,
          category: q.category || categoryId,
          explanation: q.explanation || ''
        };
      });

      console.log('✅ Questions loaded and mapped:', this.currentQuestions.length);
      
      if (this.debugMode) {
        console.log('🔍 Final question mapping:', this.currentQuestions.map(q => ({
          id: q.id,
          text: q.text?.substring(0, 50) + '...',
          correctAnswer: q.correctAnswer,
          options: q.options
        })));
      }

      // Reset progress tracking
      this.currentQuestionIndex = 0;
      this.answeredQuestions.clear();
      this.progressPercentage = 0;

      // Start the assessment
      this.zone.run(() => {
        this.isAssessmentActive = true;
        this.isLoading = false;
      });
      
      this.initializeAssessmentForm();
      this.startTimer();

    } catch (error) {
      console.error('❌ Error loading questions:', error);
      this.errorMessage = error.message || 'Failed to load questions';
      this.isLoading = false;
      alert(this.errorMessage);
    }
  }

  // 🎯 FIXED: Enhanced form initialization
  private initializeAssessmentForm() {
    if (!this.currentQuestions || this.currentQuestions.length === 0) {
      console.error('Cannot initialize form: no questions available');
      return;
    }

    const formControls = {};
    this.currentQuestions.forEach((question, index) => {
      formControls[`question_${index}`] = [''];
    });
    
    this.assessmentForm = this.formBuilder.group(formControls);
    
    // Listen for form changes to update progress
    this.assessmentForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.updateProgress(values);
      
      if (this.debugMode) {
        console.log('📝 Form values changed:', values);
      }
    });
    
    console.log('✅ Assessment form initialized with', Object.keys(formControls).length, 'controls');
  }

  private updateProgress(formValues: any) {
    this.answeredQuestions.clear();
    
    Object.keys(formValues).forEach(key => {
      if (formValues[key] && formValues[key] !== '') {
        const questionIndex = parseInt(key.split('_')[1]);
        this.answeredQuestions.add(questionIndex);
      }
    });
    
    this.progressPercentage = Math.round((this.answeredQuestions.size / this.currentQuestions.length) * 100);
  }

  // Navigation methods
  goToQuestion(index: number) {
    if (index >= 0 && index < this.currentQuestions.length) {
      this.currentQuestionIndex = index;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  isQuestionAnswered(index: number): boolean {
    return this.answeredQuestions.has(index);
  }

  getCurrentQuestion(): Question | null {
    return this.currentQuestions[this.currentQuestionIndex] || null;
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timeRemaining = this.assessmentConfig.timeLimit;
    console.log('⏰ Timer started with', this.timeRemaining, 'seconds');
    
    this.timer = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        this.submitAssessment();
      }
    }, 1000);
  }

  // 🎯 CRITICAL FIX: Enhanced submit assessment with detailed debugging
  async submitAssessment() {
    if (this.isSubmitting || !this.currentUser) return;
    
    this.isSubmitting = true;
    const formValues = this.assessmentForm.value;
    
    console.log('🚨 CRITICAL DEBUG - SUBMIT ASSESSMENT STARTED');
    console.log('📤 Form values:', formValues);
    console.log('📊 Current questions count:', this.currentQuestions.length);
    console.log('👤 Current user:', this.currentUser.email);

    try {
      // Validate prerequisites
      if (!this.currentUser.email) {
        throw new Error('User email is missing');
      }

      if (!this.currentQuestions || this.currentQuestions.length === 0) {
        throw new Error('No questions available for scoring');
      }

      // 🎯 ENHANCED: Step-by-step score calculation with detailed logging
      console.log('🧮 STARTING DETAILED SCORE CALCULATION...');
      
      let totalScore = 0;
      let correctCount = 0;
      const detailedAnswers: any[] = [];

      for (let i = 0; i < this.currentQuestions.length; i++) {
        const question = this.currentQuestions[i];
        const formKey = `question_${i}`;
        const userAnswer = formValues[formKey];
        
        console.log(`\n🔍 QUESTION ${i + 1} ANALYSIS:`);
        console.log('  Question ID:', question.id);
        console.log('  Question text:', question.text?.substring(0, 60) + '...');
        console.log('  Form key:', formKey);
        console.log('  User answer (raw):', userAnswer);
        console.log('  User answer type:', typeof userAnswer);
        console.log('  Question options:', question.options);
        console.log('  Correct answer:', question.correctAnswer);
        console.log('  Correct answer type:', typeof question.correctAnswer);
        
        // Check if answer is correct using enhanced method
        const isCorrect = this.isAnswerCorrectEnhanced(question, userAnswer);
        const points = isCorrect ? question.points : 0;
        
        if (isCorrect) {
          correctCount++;
          totalScore += points;
        }
        
        console.log(`  ✅ Is correct: ${isCorrect}`);
        console.log(`  📊 Points awarded: ${points}`);
        
        detailedAnswers.push({
          questionId: question.id,
          questionIndex: i + 1,
          question: question.text,
          userAnswer: userAnswer,
          correctAnswer: question.correctAnswer,
          correct: isCorrect,
          points: points,
          category: question.category,
          difficulty: question.difficulty,
          options: question.options
        });
      }

      const totalPossibleScore = this.currentQuestions.reduce((sum, q) => sum + q.points, 0);
      const scorePercentage = Math.round((totalScore / totalPossibleScore) * 100);
      const passed = scorePercentage >= this.assessmentConfig.passingScore;
      const timeTaken = this.assessmentConfig.timeLimit - this.timeRemaining;
      
      console.log('\n🏆 FINAL SCORE CALCULATION:');
      console.log('  Raw score:', totalScore);
      console.log('  Total possible:', totalPossibleScore);
      console.log('  Percentage:', scorePercentage);
      console.log('  Correct answers:', correctCount);
      console.log('  Total questions:', this.currentQuestions.length);
      console.log('  Passed:', passed);
      console.log('  Time taken:', timeTaken);
      
      // Create assessment data
      const assessmentData = {
        email: this.currentUser.email,
        categoryId: this.selectedCategory?.id || 'zero-waste',
        difficulty: this.getDifficultyLabel(this.selectedDifficulty || this.currentDifficulty),
        score: scorePercentage,
        timeTaken: timeTaken,
        passed: passed,
        questionsCount: this.currentQuestions.length,
        answers: detailedAnswers,
        submissionMetadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          sessionId: this.generateSessionId(),
          assessmentVersion: '1.0'
        }
      };

      console.log('📤 Final assessment data:', assessmentData);

      // Submit to MongoDB
      console.log('🌐 Submitting to MongoDB backend...');
      const result = await this.mongoService.submitAssessment(assessmentData);
      
      console.log('✅ Backend response:', result);

      if (!result || !result.success) {
        throw new Error(`Backend submission failed: ${result?.message || 'Unknown error'}`);
      }

      // Process results
      await this.processSubmissionResults(result, scorePercentage, timeTaken, passed, assessmentData);

    } catch (error) {
      console.error('❌ Assessment submission failed:', error);
      this.isSubmitting = false;
      
      let errorMessage = 'Failed to submit assessment. ';
      if (error.message.includes('email')) {
        errorMessage += 'User authentication issue.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network connection issue.';
      } else if (error.message.includes('questions')) {
        errorMessage += 'Question data issue.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(`${errorMessage}\n\nError details: ${error.message}`);
    }
  }

  // 🎯 CRITICAL FIX: Enhanced answer validation method
  private isAnswerCorrectEnhanced(question: Question, userAnswer: any): boolean {
    console.log('🔥🔥🔥 ENHANCED ANSWER VALIDATION:');
    console.log('  Question ID:', question.id);
    console.log('  User Answer (raw):', userAnswer);
    console.log('  User Answer Type:', typeof userAnswer);
    console.log('  Correct Answer (raw):', question.correctAnswer);
    console.log('  Is Correct Answer Array?:', Array.isArray(question.correctAnswer));
    
    // Handle empty/null answers
    if (!userAnswer || userAnswer === '' || userAnswer === null || userAnswer === undefined) {
      console.log('  ❌ FAIL: Empty user answer');
      return false;
    }
    
    if (!question.correctAnswer) {
      console.log('  ❌ FAIL: No correct answer defined');
      return false;
    }
    
    // Normalize correct answers to array
    let correctAnswers: string[] = [];
    if (Array.isArray(question.correctAnswer)) {
      correctAnswers = question.correctAnswer.map(ans => String(ans).trim());
    } else {
      correctAnswers = [String(question.correctAnswer).trim()];
    }
    
    // Normalize user answer
    const userAnswerStr = String(userAnswer).trim();
    
    console.log('  📝 Normalized User Answer:', `"${userAnswerStr}"`);
    console.log('  📝 Normalized Correct Answers:', correctAnswers);
    
    // Test multiple comparison methods
    const tests = {
      exactMatch: correctAnswers.includes(userAnswerStr),
      caseInsensitive: correctAnswers.some(correct => 
        correct.toLowerCase() === userAnswerStr.toLowerCase()
      ),
      trimmedMatch: correctAnswers.some(correct => 
        correct.trim().toLowerCase() === userAnswerStr.trim().toLowerCase()
      ),
      optionMatch: false
    };
    
    // If we have options, also check if user selected the correct option
    if (question.options && question.options.length > 0) {
      tests.optionMatch = question.options.some((option: string) => {
        const optionMatches = option.trim().toLowerCase() === userAnswerStr.trim().toLowerCase();
        const optionIsCorrect = correctAnswers.some(correct => 
          correct.trim().toLowerCase() === option.trim().toLowerCase()
        );
        return optionMatches && optionIsCorrect;
      });
    }
    
    console.log('  🧪 Test Results:', tests);
    
    const isCorrect = tests.exactMatch || tests.caseInsensitive || tests.trimmedMatch || tests.optionMatch;
    
    console.log(`  🎯 FINAL RESULT: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log('  ═══════════════════════════════════════════');
    
    return isCorrect;
  }

  // 🧪 CRITICAL DEBUG METHOD: Test scoring manually
  async testScoringLogic() {
    if (!this.currentQuestions || this.currentQuestions.length === 0) {
      console.warn('⚠️ No questions loaded for testing');
      alert('No questions loaded. Start an assessment first.');
      return;
    }

    console.log('🧪🧪🧪 MANUAL SCORING TEST STARTED');
    
    // Create test form values with correct answers
    const testFormValues: any = {};
    
    this.currentQuestions.forEach((question, index) => {
      const formKey = `question_${index}`;
      
      // Use the correct answer for testing
      let testAnswer = '';
      if (question.correctAnswer && question.correctAnswer.length > 0) {
        testAnswer = question.correctAnswer[0]; // Use first correct answer
      }
      
      testFormValues[formKey] = testAnswer;
      
      console.log(`🧪 Test Q${index + 1}:`, {
        formKey,
        testAnswer,
        questionCorrectAnswer: question.correctAnswer,
        questionOptions: question.options
      });
    });
    
    console.log('🧪 Test form values:', testFormValues);
    
    // Test the scoring logic
    let testScore = 0;
    let testCorrectCount = 0;
    
    for (let i = 0; i < this.currentQuestions.length; i++) {
      const question = this.currentQuestions[i];
      const formKey = `question_${i}`;
      const testAnswer = testFormValues[formKey];
      
      const isCorrect = this.isAnswerCorrectEnhanced(question, testAnswer);
      
      if (isCorrect) {
        testCorrectCount++;
        testScore += question.points;
      }
    }
    
    const testTotalPossible = this.currentQuestions.reduce((sum, q) => sum + q.points, 0);
    const testPercentage = Math.round((testScore / testTotalPossible) * 100);
    
    console.log('🧪 TEST RESULTS:');
    console.log('  Correct count:', testCorrectCount);
    console.log('  Total questions:', this.currentQuestions.length);
    console.log('  Raw score:', testScore);
    console.log('  Total possible:', testTotalPossible);
    console.log('  Percentage:', testPercentage);
    
    alert(`Test Results:\n${testCorrectCount}/${this.currentQuestions.length} correct\nScore: ${testPercentage}%\n\nCheck console for detailed logs.`);
  }

  // Continue with other methods...
  private async processSubmissionResults(result: any, scorePercentage: number, timeTaken: number, passed: boolean, assessmentData: any) {
    console.log('🎉 Processing submission results...');
    
    await this.forceRefreshUserProgress();
    await this.refreshMongoDBServiceCache();

    this.lastAssessmentResult = {
      score: scorePercentage,
      passed: passed,
      timeTaken: timeTaken,
      categoryName: this.selectedCategory?.name || 'General',
      difficulty: this.getDifficultyLabel(this.selectedDifficulty || this.currentDifficulty),
      answers: assessmentData.answers,
      
      analytics: {
        correctAnswers: assessmentData.answers.filter((a: any) => a.correct).length,
        incorrectAnswers: assessmentData.answers.filter((a: any) => !a.correct).length,
        accuracy: (assessmentData.answers.filter((a: any) => a.correct).length / this.currentQuestions.length) * 100,
        assessmentId: result.assessmentId,
        recommendations: result.recommendations || []
      }
    };

    await this.updateComponentProgressData();

    this.showResults = true;
    this.isAssessmentActive = false;
    this.isSubmitting = false;

    const accuracyText = `${this.lastAssessmentResult.analytics.correctAnswers}/${this.currentQuestions.length} correct`;
    const timeText = this.formatTime(timeTaken);
    
    alert(`Assessment completed! 
Score: ${scorePercentage}% (${accuracyText})
Time: ${timeText}
${passed ? '🎉 Passed!' : '📚 Keep studying to improve!'}`);

    console.log('✅ Submission processing completed with progress refresh');
  }

  private async forceRefreshUserProgress() {
    if (!this.currentUser?.email) {
      console.log('❌ No user email for progress refresh');
      return;
    }

    try {
      console.log('🔄 Force refreshing user progress for:', this.currentUser.email);
      await this.mongoService.loadUserProgress(this.currentUser.email);
      
      const response = await fetch(`http://localhost:4000/api/users/${encodeURIComponent(this.currentUser.email)}/progress`);
      
      if (response.ok) {
        const progressData = await response.json();
        console.log('✅ Fresh progress data loaded:', progressData.userProgress);
        this.mongoService.setCurrentUserProgress(progressData.userProgress);
      } else {
        console.error('❌ Failed to fetch fresh progress data:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Error refreshing user progress:', error);
    }
  }

  private async refreshMongoDBServiceCache() {
    try {
      console.log('🔄 Refreshing MongoDB service cache...');
      
      if (this.mongoService.refreshUserProgress) {
        await this.mongoService.refreshUserProgress();
      }
      
      if (this.currentUser?.email) {
        await this.mongoService.loadUserProgress(this.currentUser.email);
      }
      
      console.log('✅ MongoDB service cache refreshed');
    } catch (error) {
      console.error('❌ Error refreshing MongoDB service cache:', error);
    }
  }

  private async updateComponentProgressData() {
    try {
      console.log('🔄 Updating component progress data...');
      
      const latestProgress = this.mongoService.getCurrentUserProgress();
      
      if (latestProgress) {
        console.log('✅ Latest progress data:', latestProgress);
        this.zone.run(() => {
          console.log('🔄 Triggering change detection for progress update');
        });
      } else {
        console.warn('⚠️ No progress data available after refresh');
      }
      
    } catch (error) {
      console.error('❌ Error updating component progress data:', error);
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Helper methods
  getDifficultyLabel(difficulty: DifficultyLevel | null): string {
    if (!difficulty) return 'Beginner';
    
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return 'Beginner';
      case DifficultyLevel.INTERMEDIATE: return 'Intermediate';  
      case DifficultyLevel.ADVANCED: return 'Advanced';
      default: return 'Beginner';
    }
  }

  getDifficultyClass(difficulty: DifficultyLevel): string {
    return difficulty.toLowerCase();
  }

  getDifficultyInfo(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: 
        return 'Basic concepts and simple questions';
      case DifficultyLevel.INTERMEDIATE: 
        return 'More complex scenarios and applications';
      case DifficultyLevel.ADVANCED: 
        return 'Expert-level knowledge and analysis';
      default: 
        return '';
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getScorePercentage(): number {
    return this.lastAssessmentResult?.score || 0;
  }

  getCurrentDifficultyLabel(): string {
    return this.getDifficultyLabel(this.currentDifficulty);
  }

  getDifficultyColor(): string {
    switch (this.currentDifficulty) {
      case DifficultyLevel.BEGINNER:
        return 'green';
      case DifficultyLevel.INTERMEDIATE:
        return 'orange';
      case DifficultyLevel.ADVANCED:
        return 'red';
      default:
        return 'gray';
    }
  }

  getProgressBarColor(): string {
    if (this.progressPercentage >= 80) return 'success';
    if (this.progressPercentage >= 50) return 'warning';
    return 'danger';
  }

  getQuestionsAnswered(): string {
    return `${this.answeredQuestions.size} / ${this.currentQuestions.length}`;
  }

  // Progress getters with debug logs
  get userProgress() {
    const progress = this.mongoService.getCurrentUserProgress();
    if (this.debugMode) console.log('📊 Getting user progress:', progress);
    return progress;
  }

  getAverageScore(): number {
    const progress = this.mongoService.getCurrentUserProgress();
    const score = Math.round(progress?.averageScore || 0);
    if (this.debugMode) console.log('📊 Getting average score:', score);
    return score;
  }

  getProgressPercentage(): number {
    const progress = this.mongoService.getCurrentUserProgress();
    if (progress) {
      const attemptsProgress = Math.min((progress.attemptsCompleted / 10) * 100, 100);
      const scoreProgress = progress.averageScore || 0;
      const percentage = Math.round((attemptsProgress + scoreProgress) / 2);
      if (this.debugMode) console.log('📊 Getting progress percentage:', percentage);
      return percentage;
    }
    return 0;
  }

  getCurrentUserBadges(): number {
    const progress = this.mongoService.getCurrentUserProgress();
    const badges = progress?.badgesEarned?.length || 0;
    if (this.debugMode) console.log('📊 Getting badges count:', badges);
    return badges;
  }

  hasAttemptedAssessments(): boolean {
    const progress = this.mongoService.getCurrentUserProgress();
    const hasAttempts = (progress?.attemptsCompleted || 0) > 0;
    if (this.debugMode) console.log('📊 Has attempted assessments:', hasAttempts);
    return hasAttempts;
  }

  getCurrentUserLevel(): string {
    const progress = this.mongoService.getCurrentUserProgress();
    return progress?.currentLevel || 'Beginner';
  }

  getLastAttemptDate(): string {
    const progress = this.mongoService.getCurrentUserProgress();
    if (progress?.lastAttemptDate) {
      const date = new Date(progress.lastAttemptDate);
      return date.toLocaleDateString();
    }
    return 'Never';
  }

  getUserStatistics() {
    const progress = this.mongoService.getCurrentUserProgress();
    if (!progress) return null;
    
    return {
      totalAssessments: progress.attemptsCompleted || 0,
      averageScore: Math.round(progress.averageScore || 0),
      currentStreak: progress.currentStreak || 0,
      badgesEarned: progress.badgesEarned?.length || 0,
      currentLevel: progress.currentLevel || 'Beginner',
      lastAttemptDate: progress.lastAttemptDate
    };
  }

  // 🧪 DEBUG AND TESTING METHODS
  async debugSubmission() {
    console.log('🔧 DEBUG: Testing submission components...');
    
    console.log('1. Current user:', this.currentUser?.email || 'NOT LOGGED IN');
    console.log('2. Questions loaded:', this.currentQuestions.length);
    if (this.currentQuestions.length > 0) {
      console.log('   First question:', this.currentQuestions[0]);
    }
    console.log('3. Form valid:', this.assessmentForm?.valid);
    console.log('   Form values:', this.assessmentForm?.value);
    
    try {
      const testResponse = await fetch(`${this.mongoService.API_BASE_URL}/api/health`);
      console.log('4. Backend health:', testResponse.ok ? 'OK' : 'FAILED');
    } catch (error) {
      console.log('4. Backend health: CONNECTION FAILED', error.message);
    }
    
    console.log('5. MongoDB service:', this.mongoService ? 'AVAILABLE' : 'MISSING');
    console.log('   Current user progress:', this.mongoService.getCurrentUserProgress());

    alert('Debug completed! Check console for detailed results.');
  }

  async testMongoService() {
    try {
      const report = await this.mongoService.debugService();
      console.log('🧪 MongoDB Service Debug Report:', report);
      alert(`MongoDB Service Test:\n\n${report}`);
    } catch (error) {
      console.error('❌ MongoDB service test failed:', error);
      alert(`MongoDB Service Test Failed:\n${error.message}`);
    }
  }

  async manualRefreshProgress() {
    console.log('🔄 Manual progress refresh triggered...');
    
    try {
      await this.forceRefreshUserProgress();
      await this.refreshMongoDBServiceCache();
      await this.updateComponentProgressData();
      
      this.zone.run(() => {
        console.log('✅ Manual refresh completed - change detection triggered');
      });
      
      alert('Progress refreshed! Check the updated values.');
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      alert('Refresh failed: ' + error.message);
    }
  }

  // 🎯 CRITICAL: Test current form state
  testCurrentFormState() {
    if (!this.assessmentForm) {
      alert('No form available. Start an assessment first.');
      return;
    }

    console.log('🧪 TESTING CURRENT FORM STATE:');
    console.log('Form valid:', this.assessmentForm.valid);
    console.log('Form values:', this.assessmentForm.value);
    console.log('Form errors:', this.assessmentForm.errors);
    
    const formValues = this.assessmentForm.value;
    let answeredCount = 0;
    
    Object.keys(formValues).forEach(key => {
      const value = formValues[key];
      console.log(`${key}: "${value}" (${typeof value})`);
      if (value && value !== '') {
        answeredCount++;
      }
    });
    
    console.log(`Answered questions: ${answeredCount}/${this.currentQuestions.length}`);
    
    alert(`Form State:\nValid: ${this.assessmentForm.valid}\nAnswered: ${answeredCount}/${this.currentQuestions.length}\n\nCheck console for details.`);
  }

  // Load user progress
  private async loadUserProgress() {
    if (!this.currentUser?.email) {
      console.log('No user email available for loading progress');
      return;
    }

    try {
      console.log('📊 Loading user progress for:', this.currentUser.email);
      const progress = await this.mongoService.loadUserProgress(this.currentUser.email);
      console.log('✅ User progress loaded:', progress);
    } catch (error) {
      console.error('❌ Failed to load user progress:', error);
    }
  }

  goToDashboard() {
    console.log('📊 Navigating to dashboard...');
    this.router.navigate(['/dashboard']);
  }

  takeAnotherAssessment() {
    this.resetResults();
  }

  resetResults(): void {
    this.showResults = false;
    this.lastAssessmentResult = null;
    this.isAssessmentActive = false;
    this.currentQuestions = [];
    this.selectedCategory = null;
    this.selectedDifficulty = null;
    this.showCategorySelector = false;
    this.errorMessage = '';
    
    this.currentQuestionIndex = 0;
    this.answeredQuestions.clear();
    this.progressPercentage = 0;
    
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }
}