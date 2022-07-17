import { Component, OnDestroy, OnInit } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { EZWCFeed } from "src/app/interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { User } from "src/app/interfaces/user.class";
import { AuthService } from "src/app/services/auth.service";
import { FeedsEZWCService } from "src/app/services/feeds-ezwc.service";

@Component({
    selector: 'app-ezwc-content-list',
    templateUrl: 'content-list.page.html',
    styleUrls: ['content-list.page.scss']
})
export class EZWCContentListPage implements OnInit, OnDestroy{

    private _subscriptions: Subscription [] = [];

    user:User;
    title = 'EZWC';
    feeds: EZWCFeed [];

    pagination: PaginationOptions;
    paginationResponse: PaginationResponse<EZWCFeed>;


    constructor(
        private authService: AuthService,
        private feedsEZWCService: FeedsEZWCService,
        private toastCtrl: ToastController,
        // private ezwcActionService: EZWCActionsService 
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
        this.pagination = {
            limit: 100,
            page: 0,
        }
        this._subscriptions['user'] = this.authService.user.subscribe({
            next: (user:User)=>{
                this.user = user;
            },
            error: this.fetchErrorHandler.bind(this),
        });
        this.fetchFeeds();
    }

    fetchFeeds(event=null){
        this._subscriptions['feeds'] = this.feedsEZWCService.paginate(this.pagination)
        .subscribe({
            next: (response)=>{
                this.paginationResponse = response;
                console.log('response:',response.results)
                if(event){
                    event.target.complete();
                }
            },
            error: this.fetchErrorHandler.bind(this)
        })
    }

    fetchNext(event){
        let {totalPages} = this.paginationResponse;
        if(this.pagination.page >= (totalPages -1)){
            if(event) event.target.complete();
            return;
        }
        this.pagination.page +=1;
        this.fetchFeeds(event);
    }

    onRefreshList(){
        this.pagination.page = 0;
        this.fetchFeeds();
    }

    async presentToast(message){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000
        })
        await toast.present();
    }

    fetchErrorHandler(error){
        let message = error.error.message ?? 'Unable to fetch posts';
    }
}