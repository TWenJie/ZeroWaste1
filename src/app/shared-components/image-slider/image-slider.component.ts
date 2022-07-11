import { Component, Input, OnInit } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ModalController } from "@ionic/angular";
import { ImageUploadResponse } from "src/app/interfaces/feeds.interface";
import { ImagePreviewModalComponent } from "../image-preview-modal/image-preview-modal.component";

@Component({
    selector: 'app-image-slider',
    templateUrl: 'image-slider.component.html',
    styleUrls: ['image-slider.component.scss']
})
export class ImageSliderComponent implements OnInit {
    
    slidesOpts= {
        
    }

    @Input() images : ImageUploadResponse[];
    sanitzedImagesURLs: SafeResourceUrl[] = [];
    constructor(
        private modalCtrl: ModalController,
        private sanitizer: DomSanitizer,
    ){}

    ngOnInit(): void {
        if(this.images.length > 0){
            console.log('images',this.images);

            this.images.forEach(image=>{
                const sanitized = this.sanitizer.bypassSecurityTrustResourceUrl(image.src);
                this.sanitzedImagesURLs.push(sanitized);
                console.log('sanatized:',sanitized);
            })
        }
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