import { Component, OnDestroy, OnInit } from "@angular/core";

@Component({
    selector: 'app-ezwc-content-list',
    templateUrl: 'content-list.page.html',
    styleUrls: ['content-list.page.scss']
})
export class EZWCContentListPage implements OnInit, OnDestroy{

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