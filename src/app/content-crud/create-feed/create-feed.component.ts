import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'app-create-feed',
    templateUrl: 'create-feed.component.html',
    styleUrls: ['create-feed.component.scss'],
})
export class CreateFeedComponent implements OnInit, OnDestroy {
    constructor(
        private modalCtrl: ModalController,
    ){}
    ngOnInit(): void {
        
    }
    ngOnDestroy(): void {
        
    }

    createPost(){
        console.log('Saving..');
        this.closeModal();
    }

    async closeModal(){
        const modal = await this.modalCtrl.getTop();

        if(modal){
            modal.dismiss();
        }
    }

}