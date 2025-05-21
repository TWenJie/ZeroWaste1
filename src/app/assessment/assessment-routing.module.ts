// src/app/assessment/assessment-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssessmentComponent } from './assessment.component';
import { LeaderboardComponent } from './leaderboard.component';
import { BadgesComponent } from './badges.component';

const routes: Routes = [
  {
    path: '',
    component: AssessmentComponent
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent
  },
  {
    path: 'badges',
    component: BadgesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssessmentRoutingModule { }