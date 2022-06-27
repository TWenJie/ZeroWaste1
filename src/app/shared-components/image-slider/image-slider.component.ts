import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { ImagePreviewModalComponent } from "../image-preview-modal/image-preview-modal.component";

@Component({
    selector: 'app-image-slider',
    templateUrl: 'image-slider.component.html',
    styleUrls: ['image-slider.component.scss']
})
export class ImageSliderComponent implements OnInit {
    
    slidesOpts= {
        
    }

    @Input() images : string[];
    
    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
    }

    async previewImage(image:string){
        const modal = await this.modalCtrl.create({
            component: ImagePreviewModalComponent,
            componentProps: {
                image,
            },
            cssClass: ['transparent-modal']
        })

        await modal.present();
    }
}