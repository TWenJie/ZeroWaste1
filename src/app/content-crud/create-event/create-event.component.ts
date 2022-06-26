import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'app-create-event',
    templateUrl: 'create-event.component.html',
    styleUrls: ['create-event.component.scss'],
})
export class CreateEventComponent implements OnInit, OnDestroy {
    constructor(
        private modalCtrl: ModalController,
    ){}
    
    ngOnInit(): void {
        
    }
    ngOnDestroy(): void {
        
    }
}