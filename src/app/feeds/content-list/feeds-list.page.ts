import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { User } from "src/app/interfaces/user.class";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-feeds-list',
    templateUrl: 'feeds-list.page.html',
    styleUrls: ['feeds-list.page.scss']
})
export class FeedsListPage implements OnInit, OnDestroy {

    private _subscriptions: Subscription [] = [];

    user:User;
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

    constructor(
        private authService: AuthService,
    ){}

    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('unsubscribe',sub);
                sub.unsubscribe();
            }
        })
    }

    ionViewWillEnter(){
        this._subscriptions['user'] = this.authService.user.subscribe((user:User)=>{
            this.user = user;
        });
    }
}