import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { ContentDetailsComponent } from "../content-details/content-details.component";

@Component({
    selector: 'app-content-list',
    templateUrl: 'content-list.component.html',
    styleUrls: ['content-list.component.scss'],
})
export class ContentListComponent implements OnInit{

    @Input() items: any [];

    texts = `USM is committed to mainstream sustainable development
    principles in the university's core areas to produce graduates
    and staff with first-class skills and thinking, research par
    excellence, <a target="_blank" href="https://www.google.com">community</a> engagement and best practices that will
    make USM a <span class="highlighted">sustainability-led university</span> of world-class
    standing.`;

    constructor(
        private modalCtrl: ModalController,
    ){}

    ngOnInit(): void {
        console.log('Content_list:',this.items)
    }

    clickContentHandler(item:any){
        console.log('Content clicked:',item);
        this.openCommentsModal(item);
    }

    async openCommentsModal(item:any){
        const modal = await this.modalCtrl.create({
            component: ContentDetailsComponent,
            componentProps: {
                item,
            }
        })

        await modal.present();
    }
}