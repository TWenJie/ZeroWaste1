import {  Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ParsedTexts} from 'src/app/services/url-extractor.service';

@Component({
  selector: 'app-content-details',
  templateUrl: 'content-details.component.html',
  styleUrls: ['content-details.component.scss'],
})
export class ContentDetailsComponent implements OnInit{
  @Input() item: any;
  @Output() onClickContent: EventEmitter<any> = new EventEmitter();

  private youtubeApiLoaded: boolean = false;
  parsedTexts: ParsedTexts;
  isCreateCommentModalOpen = false;

  constructor(
  ) {}

  ngOnInit(): void {
    this.initYoutubeApi();
  }

  initYoutubeApi(){
    if(!this.youtubeApiLoaded){
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.youtubeApiLoaded = true;
    }
  }

  openDetailPage(){
    if(this.onClickContent){
      this.onClickContent.emit(this.item);
    }
  }

  
}
