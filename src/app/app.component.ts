import { Component } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { CachingService } from './services/caching.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  private youtubeApiLoaded: boolean = false;
  constructor(
    private cachingService: CachingService,
    private platform: Platform,
  ) {
    this.cachingService.initStorage();
    this.initYoutubeApi();
    // this.initImageCacheDir();
  }

  initYoutubeApi(){
    if(!this.youtubeApiLoaded){
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.youtubeApiLoaded = true;
    }
  }

  async initImageCacheDir(){
    try{
      await Filesystem.mkdir({
        directory: Directory.Cache,
        path: 'CACHED-IMG',
      });
    }catch(error){
      console.log('Error:',error);
    }
  }
}
