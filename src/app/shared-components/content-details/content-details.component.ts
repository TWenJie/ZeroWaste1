import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-content-details',
  templateUrl: 'content-details.component.html',
  styleUrls: ['content-details.component.scss'],
})
export class ContentDetailsComponent implements OnInit {
  @Input() item: any;

  isCreateCommentModalOpen = false;

  comments = [
    {
      textContent: 'Lorem ipsum something something',
    },
    {
        textContent: 'Hello World is about something something',
    },
    {
        textContent: 'its all about something',
    },
    {
        textContent: 'ありがとう、みんな',
    },
  ];

  @ViewChild('commentModal') createCommentModal : HTMLIonModalElement;
  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {}

  createComment(){
    // console.log(this.createCommentModal);
    this.createCommentModal.dismiss();
  }
}
