import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'app-create-complain',
    templateUrl: 'create-complain.component.html',
    styleUrls: ['create-complain.component.scss'],
})
export class CreateComplainComponent implements OnInit, OnDestroy {
    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
        
    }
    ngOnDestroy(): void {
        
    }
}