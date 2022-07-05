import {  Component, ContentChild, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { ParsedTexts, ParsedYoutubeContent, URLExtractorService} from 'src/app/services/url-extractor.service';

@Component({
  selector: 'app-content-details',
  templateUrl: 'content-details.component.html',
  styleUrls: ['content-details.component.scss'],
})
export class ContentDetailsComponent implements OnInit{
  @Input() item: any;
  @Output() onClickContent: EventEmitter<any> = new EventEmitter();
  @Output() onClickContentActions: EventEmitter<any> = new EventEmitter();

  private youtubeApiLoaded: boolean = false;

  parsedTexts: ParsedTexts;
  isCreateCommentModalOpen = false;
  videoContent: ParsedYoutubeContent;



  @ViewChild(YouTubePlayer) youtubePlayer!: YouTubePlayer;
  private videoStartTime;
  private videoEndTime;
  private durationPlayed;

  constructor(
    private URLExtractor: URLExtractorService,
  ) {}

  ngOnInit(): void {
    this.initYoutubeApi();
  }

  

  openDetailPage(){
    if(this.onClickContent){
      this.onClickContent.emit(this.item);
    }
  }

  openContentActions(){
    this.onClickContentActions.emit(this.item);
  }


  /**
   * For YouTube PLayer
   */

  initYoutubeApi(){
    this.videoContent = this.URLExtractor.parseTextForYoutube(this.item.textContent);
    // if(!this.youtubeApiLoaded){
    //   const tag = document.createElement('script');
    //   tag.src = 'https://www.youtube.com/iframe_api';
    //   document.body.appendChild(tag);
    //   this.youtubeApiLoaded = true;
    // }
  }
  play(){
    this.youtubePlayer.playVideo();
  }

  pause(){
    this.youtubePlayer.pauseVideo();
  }

  onVideoStateChange(event){
    const playerState = event.data;
    if(playerState == YT.PlayerState.PLAYING){
      // console.log('Video is PLaying');
      if(this.videoEndTime){
        // console.log('resuming');
        this.videoStartTime = this.videoEndTime;
        return;
      }
      this.videoStartTime = new Date();
    }
    if(playerState == YT.PlayerState.PAUSED){
      // console.log('Video Paused');
      this.videoEndTime = new Date();
      const threshold = this.calculatePlayedDuration(this.videoStartTime,this.videoEndTime);
      // this.logVideoEvent(threshold);
      console.log('Trheshold_played:',threshold);


    }
    if(playerState == YT.PlayerState.ENDED){
      this.videoEndTime = new Date();
      const threshold = this.calculatePlayedDuration(this.videoStartTime,this.videoEndTime);
      // this.logVideoEvent(threshold);
      console.log('Trheshold_played:',threshold);
    }
  }
  
  private calculatePlayedDuration(startTime,endTime){
    let duration = endTime - startTime;
    duration /= 1000; //remove ms;
    duration = Math.round(duration); //get in second;
    const videoDuration = this.youtubePlayer.getDuration();
    let playedThreshold = Math.round((duration * 100)/videoDuration)
    this.durationPlayed = duration;
    return playedThreshold;
  }
}
