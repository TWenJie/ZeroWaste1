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

  constructor(
    private cachingService: CachingService,
    private platform: Platform,
  ) {
    this.cachingService.initStorage();
    // this.initImageCacheDir();
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
