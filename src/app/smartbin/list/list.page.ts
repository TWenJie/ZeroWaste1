import { Component, OnDestroy, OnInit } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { LoadingController, ModalController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { Smartbin } from "src/app/interfaces/smartbin.interface";
import { SmartbinService } from "src/app/services/smartbin.service";
import { SmartbinDetailComponent } from "../details/detail.component";


enum SearchModes {
    ALL,
    NEAR,
    LOCAL,
    REMOTE,
}

@Component({
    selector: 'app-smartbin-list',
    templateUrl: 'list.page.html',
    styleUrls: ['list.page.scss']
})
export class SmartbinListPage implements OnInit, OnDestroy {

    pagination: PaginationOptions;
    paginationResponse : PaginationResponse<Smartbin>;
    items = [1,2,3,4,5];

    searchMode: SearchModes = SearchModes.ALL;
    searchString: string = '';
    loadingOverlay : HTMLIonLoadingElement = null;

    

    private _subscriptions: Subscription[] = [];
    constructor(
        private modalCtrl: ModalController,
        private smartbinService: SmartbinService,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
    ){}

    ngOnInit(): void {
    }

    ionViewWillEnter(){
        this.pagination = {
            limit: 5,
            page: 0
        }
        this.searchMode = SearchModes.ALL;
        this.paginateLocations();
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('unsubscribe',sub);
                sub.unsubscribe();
            }
        })
    }

    findNearMe(){
        if(!Capacitor.isPluginAvailable('Geolocation')){
            this.presentToast('Geolocation plugin not available!');
            return;
        }
        this.searchMode = SearchModes.NEAR;
        this.pagination.page = 0;
        this.paginateLocations();
    }

    async  paginateLocations(){    
        if(this.searchMode == SearchModes.REMOTE){
          this.remoteSearch();
        }else if (this.searchMode == SearchModes.NEAR){
            this.isPending = true;
            this._subscriptions['nearme'] = this.smartbinService.findNearMyLocation(this.pagination).subscribe((response:PaginationResponse<Smartbin>)=>{
                this.paginationResponse = response;
            },error=>{
                const message = error.error.message ?? 'Unable to locate your location, please enable location in settings';
                this.presentToast(message);
            },()=>{
                this.isPending = false;
            })
        }else{
            this.isPending = true;
            this._subscriptions['paginate'] = this.smartbinService.paginateLocations(this.pagination).subscribe((response:PaginationResponse<Smartbin>)=>{
                this.paginationResponse = response;

            },error=>{
                const message = error.error.message ?? 'Unable to fetch data';
                this.presentToast(message);
            },()=>{
                this.isPending = false;
            })
        }    
    }

    paginateNext(event){
        const {totalPages} = this.paginationResponse;
        if(event) event.target.complete()
    
        if(this.pagination.page >= (totalPages-1)){
          return;
        }
    
        this.pagination.page = this.pagination.page + 1;
        this.paginateLocations()
      }    

    localSearch(event){
        const keyword = event.target.value.toLowerCase();
        const searchRegex = new RegExp(`(?=.*${keyword})`,"gi");
        const locations = this.paginationResponse.results;
        this.paginationResponse.results = locations.filter(item=>item.properties.name.match(searchRegex));
    }
    
    async remoteSearch(event?){
        this.searchMode = SearchModes.REMOTE;
        if(event){
          this.pagination.page = 0;
          this.searchString = event.target.value.toLowerCase();
        }
        this.isPending = true;
        this._subscriptions['searchByName'] = this.smartbinService.searchByName(this.searchString,this.pagination).subscribe((response: PaginationResponse<Smartbin>)=>{
            this.paginationResponse = response;
        },error=>{
            const message = error.error.message ?? 'Unable to fetch data';
            this.presentToast(message);
        },()=>{
            this.isPending = false;
        })
    }

    async openLocationModal(location:any){
        const modal = await this.modalCtrl.create({
            component: SmartbinDetailComponent,
            componentProps: {
                location
            }
        });
        await modal.present();
    }

    set isPending(status:boolean){
        console.log('pending:',status);
        if(status){
            this.presentLoading();
        }else{
            if(this.loadingOverlay){
                this.loadingOverlay.dismiss()
            }
        }
    }

    async presentLoading(message: string = 'Loading'){
        this.loadingOverlay = await this.loadingCtrl.create({
            message,
            id: 'fetching',
            backdropDismiss​: true,
        })
        await this.loadingOverlay.present();
    }

    async presentToast(message:string = 'unable to fetch data'){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        })
        await toast.present();
    }
}