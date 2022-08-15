import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Browser } from "@capacitor/browser";
import { ModalController } from "@ionic/angular";
import { latLng, Map, marker, Marker, tileLayer } from "leaflet";
import { CreateComplainComponent } from "src/app/content-crud/create-complain/create-complain.component";
import { Smartbin } from "src/app/interfaces/smartbin.interface";
import { AnalyticsService, SmartBinEventTypes } from "src/app/services/analytics.service";

@Component({
    selector: 'app-smartbin-detail',
    templateUrl: 'detail.component.html',
    styleUrls: ['detail.component.scss'],
})
export class SmartbinDetailComponent implements OnInit, OnDestroy{
    @Input() location:Smartbin;

    /**
     * Options for @asymmetrik/ngx-leaflet,
     */
    options: {
      layers: any[],
      zoom: number,
      center: any,
    } = {
        layers: [
          tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
          { maxZoom: 18, minZoom: 3,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
          }),
        ],
        zoom: 18,
        center: latLng(0, 0),
    }

    constructor(
        private modalCtrl: ModalController,
        private sanitizer: DomSanitizer,
        private analyticsService: AnalyticsService,

    ){}

    ngOnInit(): void {
        this.initMap();
        window.dispatchEvent(new Event('resize'));
        if(this.location){
          this.analyticsService.logSmartbinEvent({
            eventType: SmartBinEventTypes.ViewLocation,
            sourceId: this.location._id,
          }).toPromise().then(response=>{
            console.log('Event logged:',response)
          }).catch(error=>{
              console.error(error);
          });
        }
        
    }

    ngOnDestroy(): void {
    }

    /**
     * To fix leaflet layer not showing proeprly I decided to resolve with installing
     * @asymmetrik/ngx-leaflet , package, Below is the code on how to use it.
     */
    private initMap(){
      const myCoordinate = this.location.location.coordinates;
      this.options.layers.push(marker([myCoordinate[1],myCoordinate[0]]));
      this.options.center = latLng(myCoordinate[1],myCoordinate[0]);
      
    }
      
      sanitizeURL(url:string){
        if(!url) return false;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    
      async openExternal(url:string){
        if(!url) return;
        await Browser.open({url});
      }
    
      async createComplain(){
        console.log('Create_complain:',this.location);

        const modal = await this.modalCtrl.create({
          component: CreateComplainComponent,
          componentProps: {
            smartbin: this.location,
          }
        });

        await modal.present();
    
      }
    
      dismissComplainModal(event){
        if(this.modalCtrl.getTop()){
          this.modalCtrl.dismiss();
        }
      }
}