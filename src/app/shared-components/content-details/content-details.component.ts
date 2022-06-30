import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-content-details',
  templateUrl: 'content-details.component.html',
  styleUrls: ['content-details.component.scss'],
})
export class ContentDetailsComponent implements OnInit {
  @Input() item: any;
  @Output() onClickContent: EventEmitter<any> = new EventEmitter();

  isCreateCommentModalOpen = false;

  constructor() {}

  ngOnInit(): void {

  }

  openDetailPage(){
    if(this.onClickContent){
      this.onClickContent.emit(this.item);
    }
  }

  
}
