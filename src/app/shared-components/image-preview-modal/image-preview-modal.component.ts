import { Component, Input } from "@angular/core";
import { ModalController } from "@ionic/angular";


@Component({
    selector: 'app-image-preview-modal',
    templateUrl: 'image-preview-modal.component.html',
    styleUrls: ['image-preview-modal.component.scss']
})
export class ImagePreviewModalComponent{
    slidesOpts = {
        zoom: true,
    }
    @Input() image:string;

    constructor(private modalCtrl: ModalController){}
}