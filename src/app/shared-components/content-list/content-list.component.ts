import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ModalController } from "@ionic/angular";
import { Post } from "src/app/interfaces/feeds.interface";
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
        private router : Router,
    ){}

    ngOnInit(): void {
        console.log('Content_list:',this.items)
    }

    openDetailPage(item:Post){
        this.router.navigate(['tabs','feeds',item.id]);
    }

    // async openCommentsModal(item:any){
    //     const modal = await this.modalCtrl.create({
    //         component: ContentDetailsComponent,
    //         componentProps: {
    //             item,
    //         }
    //     })

    //     await modal.present();
    // }
}