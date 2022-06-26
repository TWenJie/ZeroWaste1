import { Component, OnDestroy, OnInit } from "@angular/core";

@Component({
    selector: 'app-feeds-list',
    templateUrl: 'feeds-list.page.html',
    styleUrls: ['feeds-list.page.scss']
})
export class FeedsListPage implements OnInit, OnDestroy {
    title = 'Feeds';
    items = [
        {
            images: [
                "/assets/img/ezwc_banner.png",
                "/assets/img/environment_iaus.png",
            ]
        },
        {
            images: [
                "/assets/img/ezwc_banner.png",
                "/assets/img/environment_iaus.png",
            ]
        },
        {
            images: [
                "/assets/img/ezwc_banner.png",
                "/assets/img/environment_iaus.png",
            ]
        },
        {
            images: [
                "/assets/img/ezwc_banner.png",
                "/assets/img/environment_iaus.png",
            ]
        },
        {
            images: [
                "/assets/img/ezwc_banner.png",
                "/assets/img/environment_iaus.png",
            ]
        }
    ];

    constructor(){}

    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        
    }
}