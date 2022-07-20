import {  Component, ContentChild, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayer } from '@angular/youtube-player';
import { ToastController } from '@ionic/angular';
import { AnalyticsService, FeedEventTypes } from 'src/app/services/analytics.service';
import { ReactionsService } from 'src/app/services/reactions.service';
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
  @Output() onClickLike: EventEmitter<any> = new EventEmitter();

  private youtubeApiLoaded: boolean = false;

  safeDataStudioURL:SafeResourceUrl;
  parsedTexts: ParsedTexts;
  isCreateCommentModalOpen = false;
  videoId: string = null;


  @ViewChild(YouTubePlayer) youtubePlayer!: YouTubePlayer;
  private videoStartTime;
  private videoEndTime;
  private durationPlayed;

  constructor(
    private URLExtractor: URLExtractorService,
    private readonly reactionsService: ReactionsService,
    private readonly analyticsService: AnalyticsService,
    private readonly toastCtrl: ToastController,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.initYoutubeApi();
    // console.log('this.item',this.item)

    if(this.item.dataStudioURL && this.URLExtractor.isDataStudioUrl(this.item.dataStudioURL)){
      // console.log('this.item.dataStudioURL:',this.item.dataStudioURL)
      this.safeDataStudioURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.item.dataStudioURL);
      // console.log('this.item.dataStudioURL:',this.item.dataStudioURL)
    }
  }

  openDetailPage(){
    if(this.onClickContent){
      this.onClickContent.emit(this.item);
    }
  }

  openContentActions(){
    this.onClickContentActions.emit(this.item);
  }


  likePost(){
    // console.log('Liking:',this.item);
    const liked = this.item.liked;
    if(!liked) {
      this.item.liked = true;
      this.item.likesCount++;
      this.reactionsService.like(this.item.id).toPromise().catch(error=>{
        const message =  error?.error?.message ?? 'Failed to like,something went wrong!';
      });

      this.analyticsService.logEvent({
        eventType: FeedEventTypes.LikePost,
        sourceId: this.item.id
      }).toPromise().then(response=>{
        console.log('Event logged:',response)
      }).catch(error=>{
          console.error(error);
      });
      
    }else{
      this.item.liked = null;
      this.item.likesCount--;
      this.reactionsService.unlike(this.item.id).toPromise();
    }
  }

  async presentToast(message:string){
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000
    });
    await toast.present();
  }


  /**
   * For YouTube PLayer
   */

  async initYoutubeApi(){

    const videoContent: ParsedYoutubeContent = await this.URLExtractor.parseTextForYoutube(this.item.textContent);
    // console.log('Video_content:',videoContent);
    if(videoContent){
      this.videoId = videoContent.videoId;
    }
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
      this.logVideoEvent(threshold);
      // console.log('Trheshold_played:',threshold);


    }
    if(playerState == YT.PlayerState.ENDED){
      this.videoEndTime = new Date();
      const threshold = this.calculatePlayedDuration(this.videoStartTime,this.videoEndTime);
      this.logVideoEvent(threshold);
      // console.log('Trheshold_played:',threshold);
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

  private logVideoEvent(playedThreshold){
    if(playedThreshold > 50){
      //create new event
      console.log('New Video Event');
      this.analyticsService.logEvent({
        eventType: FeedEventTypes.WatchVideo,
        sourceId: this.item.id,
      }).toPromise().then(response=>{
        console.log('Event logged:',response)
      }).catch(error=>{
          console.error(error);
      });
    }
  }
}
