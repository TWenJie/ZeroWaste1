import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Comment } from 'src/app/interfaces/feeds.interface';
import { ReactionsService } from 'src/app/services/reactions.service';

@Component({
  selector: 'app-content-details',
  templateUrl: 'content-details.component.html',
  styleUrls: ['content-details.component.scss'],
})
export class ContentDetailsComponent implements OnInit {
  @Input() item: any;
  isCreateCommentModalOpen = false;

  @ViewChild('commentModal') createCommentModal : HTMLIonModalElement;
  constructor() {}

  ngOnInit(): void {

  }

  createComment(){
    // console.log(this.createCommentModal);
    this.createCommentModal.dismiss();
  }
}
