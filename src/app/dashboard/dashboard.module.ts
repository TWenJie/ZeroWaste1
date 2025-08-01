// src/app/dashboard/dashboard.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';

// Import your backend services
import { AssessmentService } from '../services/assessment.service';
import { MongoDBService } from '../services/mongodb.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    DashboardPageRoutingModule
  ],
  declarations: [DashboardPage],
  providers: [
    AssessmentService,
    MongoDBService
  ]
})
export class DashboardPageModule {}
