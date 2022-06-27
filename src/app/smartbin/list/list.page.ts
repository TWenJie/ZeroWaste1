import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { SmartbinDetailComponent } from "../details/detail.component";

@Component({
    selector: 'app-smartbin-list',
    templateUrl: 'list.page.html',
    styleUrls: ['list.page.scss']
})
export class SmartbinListPage implements OnInit, OnDestroy {

    items = [1,2,3,4,5]

    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
        
    }
    ngOnDestroy(): void {
        
    }

    async openLocationModal(location:any){
        console.log('ClickOn:',location);
        const modal = await this.modalCtrl.create({
            component: SmartbinDetailComponent,
            componentProps: {
                location
            }
        });
        await modal.present();
    }
}