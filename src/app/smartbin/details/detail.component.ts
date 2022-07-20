import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Browser } from "@capacitor/browser";
import { ModalController } from "@ionic/angular";
import { Map, marker, Marker, tileLayer } from "leaflet";
import { CreateComplainComponent } from "src/app/content-crud/create-complain/create-complain.component";
import { Smartbin } from "src/app/interfaces/smartbin.interface";
import { AnalyticsService, SmartBinEventTypes } from "src/app/services/analytics.service";

@Component({
    selector: 'app-smartbin-detail',
    templateUrl: 'detail.component.html',
    styleUrls: ['detail.component.scss'],
})
export class SmartbinDetailComponent implements OnInit, OnDestroy{
    map:Map;
    myMarker : Marker;
    @Input() location:Smartbin;

    constructor(
        private modalCtrl: ModalController,
        private sanitizer: DomSanitizer,
        private analyticsService: AnalyticsService,

    ){}

    ngOnInit(): void {
        this.loadMap();
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
        this.map.remove();
    }

    private loadMap():void{
        const myCoordinate = this.location.location.coordinates;
        this.map = new Map("mapId").setView([myCoordinate[1],myCoordinate[0]],20);
    
        // add tile layer to our map
        // tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        //   { 
        //     attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY- SA</a>'
        //   }
        // ).addTo(this.map);
        tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        }).addTo(this.map);
    
        //add marker to our map and enable popup with location name
        marker([myCoordinate[1],myCoordinate[0]])
        .addTo(this.map)
        .bindPopup(this.location.properties.name);
    
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