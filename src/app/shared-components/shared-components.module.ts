import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { IonicModule } from '@ionic/angular';
import { SharedDirectivesModule } from '../directives/shared-directives.module';
import { AvatarComponent } from './avatar/avatar.component';
import { CommentsListComponent } from './comments-list/comments-list.component';
import { ContentDetailsComponent } from './content-details/content-details.component';
import { ContentListComponent } from './content-list/content-list.component';
import { EngagementButtonsComponent } from './engagement-buttons/engagement-buttons.component';
import { ImagePreviewModalComponent } from './image-preview-modal/image-preview-modal.component';
import { ImageSliderComponent } from './image-slider/image-slider.component';
import { OwnerBadgeComponent } from './owner-badge/owner-badge.component';
import { TextContentComponent } from './text-content/text-content.component';
import { VideoContentComponent } from './video-content/video-content.component';

@NgModule({
  imports: [CommonModule, IonicModule,SharedDirectivesModule,YouTubePlayerModule],
  declarations: [
    OwnerBadgeComponent,
    AvatarComponent,
    EngagementButtonsComponent,
    ImagePreviewModalComponent,
    ImageSliderComponent,
    TextContentComponent,
    VideoContentComponent,
    ContentListComponent,
    ContentDetailsComponent,
    CommentsListComponent,
  ],
  exports: [
    OwnerBadgeComponent,
    AvatarComponent,
    EngagementButtonsComponent,
    ImagePreviewModalComponent,
    ImageSliderComponent,
    TextContentComponent,
    VideoContentComponent,
    ContentListComponent,
    ContentDetailsComponent,
    CommentsListComponent,
  ],
})
export class SharedComponentsModule {}
