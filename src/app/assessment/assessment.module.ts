// src/app/assessment/assessment.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AssessmentRoutingModule } from './assessment-routing.module';
import { AssessmentComponent } from './assessment.component';
import { BadgesComponent } from './badges.component';
import { LeaderboardComponent } from './leaderboard.component';

@NgModule({
  declarations: [
    AssessmentComponent,
    BadgesComponent,
    LeaderboardComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AssessmentRoutingModule
  ]
})
export class AssessmentModule { }