import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
    selector: 'app-smartbin-detail',
    templateUrl: 'detail.component.html',
    styleUrls: ['detail.component.scss'],
})
export class SmartbinDetailComponent implements OnInit{

    @Input() location:any;

    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
        
    }
}