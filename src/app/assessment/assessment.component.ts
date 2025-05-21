// src/app/assessment/assessment.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { 
  AssessmentService 
} from '../services/assessment.service';
import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  UserAssessmentProgress,
  AssessmentAttempt,
  AssessmentConfig
} from '../interfaces/assessment.interface';

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

  // Assessment state
  currentQuestions: Question[] = [];
  assessmentForm: FormGroup;
  timeRemaining: number = 0;
  currentDifficulty: DifficultyLevel = DifficultyLevel.BEGINNER;
  
  // Configuration and progress
  assessmentConfig: AssessmentConfig;
  userProgress: UserAssessmentProgress;

  // UI states
  isAssessmentActive = false;
  isSubmitting = false;
  
  constructor(
    private assessmentService: AssessmentService,
    private formBuilder: FormBuilder,
    private zone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    // Fetch assessment configuration
    this.assessmentService.getAssessmentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.assessmentConfig = config;
        console.log('Loaded assessment config:', this.assessmentConfig);
      });

    // Get user progress to determine difficulty
    this.assessmentService.userProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        if (progress) {
          this.userProgress = progress;
          this.currentDifficulty = this.assessmentService.calculateAdaptiveDifficulty(progress);
          console.log('Loaded user progress:', this.userProgress);
        }
      });
  }

  startAssessment() {
    console.log('Start button clicked!');
    
    // Force state change inside NgZone
    this.zone.run(() => {
      this.isAssessmentActive = true;
      console.log('Assessment active state forcibly set to:', this.isAssessmentActive);
    });
    
    // Continue with your questions logic
    this.assessmentService.getQuestions(
      this.currentDifficulty, 
      QuestionType.MULTIPLE_CHOICE
    ).pipe(takeUntil(this.destroy$))
    .subscribe(questions => {
      console.log('Received questions:', questions);
      this.currentQuestions = questions;
      this.initializeAssessmentForm();
      this.startTimer();
    });
  }

  private initializeAssessmentForm() {
    const formControls = {};
    this.currentQuestions.forEach((question, index) => {
      formControls[`question_${index}`] = [''];
    });
    this.assessmentForm = this.formBuilder.group(formControls);
    console.log('Assessment form initialized:', this.assessmentForm);
  }

  private startTimer() {
    if (!this.assessmentConfig) {
      console.error('Assessment configuration not loaded');
      this.timeRemaining = 300; // Default to 5 minutes
    } else {
      this.timeRemaining = this.assessmentConfig.timeLimit;
    }
    
    console.log('Timer started with', this.timeRemaining, 'seconds');
    const timer = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        clearInterval(timer);
        this.submitAssessment();
      }
    }, 1000);
  }

  submitAssessment() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    const formValues = this.assessmentForm.value;
    console.log('Form values on submit:', formValues);

    // Count answered questions
    const answeredQuestionsCount = this.countAnsweredQuestions(formValues);
    
    // Calculate score
    const score = this.calculateScore(formValues);
    
    // Calculate if passed
    const passed = score >= (this.assessmentConfig?.passingScore || 70);
    
    console.log(`Assessment results: Score ${score}, Passed: ${passed}, Answered: ${answeredQuestionsCount}`);
    
    // Create assessment attempt with correct types
    const assessmentAttempt: AssessmentAttempt = {
      id: null,
      userId: this.userProgress?.userId || '',
      date: new Date(),
      questions: this.currentQuestions,
      score: score,
      timeTaken: (this.assessmentConfig?.timeLimit || 300) - this.timeRemaining,
      difficulty: this.currentDifficulty,
      passed: passed,
      questionsAnswered: answeredQuestionsCount
    };

    this.assessmentService.submitAssessment(assessmentAttempt)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          // Handle successful submission
          console.log('Assessment submitted successfully:', progress);
          this.isAssessmentActive = false;
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Assessment submission failed', err);
          this.isSubmitting = false;
        }
      });
  }

  private countAnsweredQuestions(formValues: any): number {
    let count = 0;
    this.currentQuestions.forEach((_, index) => {
      const answer = formValues[`question_${index}`];
      if (answer !== null && answer !== undefined && answer !== '') {
        count++;
      }
    });
    return count;
  }

  private calculateScore(formValues: any): number {
    let score = 0;
    this.currentQuestions.forEach((question, index) => {
      const userAnswer = formValues[`question_${index}`];
      if (this.isAnswerCorrect(question, userAnswer)) {
        score += question.points;
      }
    });
    return score;
  }

  private isAnswerCorrect(question: Question, userAnswer: any): boolean {
    if (!userAnswer || !question.correctAnswer) return false;
    
    // Convert to strings for comparison to handle different types
    const userAnswerStr = String(userAnswer).trim().toLowerCase();
    return question.correctAnswer.some(correct => 
      String(correct).trim().toLowerCase() === userAnswerStr
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}