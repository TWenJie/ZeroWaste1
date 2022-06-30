import { Component, OnDestroy, OnInit } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Post } from "src/app/interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { User } from "src/app/interfaces/user.class";
import { AuthService } from "src/app/services/auth.service";
import { FeedsService } from "src/app/services/feeds.service";

@Component({
    selector: 'app-feeds-list',
    templateUrl: 'feeds-list.page.html',
    styleUrls: ['feeds-list.page.scss']
})
export class FeedsListPage implements OnInit, OnDestroy {

    private _subscriptions: Subscription [] = [];

    user:User;
    title = 'Feeds';
    posts: Post[];

    pagination: PaginationOptions;
    paginationResponse : PaginationResponse<Post>;

    constructor(
        private authService: AuthService,
        private feedsService: FeedsService,
        private toastCtrl: ToastController,
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
            limit: 5,
            page: 0,
        }
        this._subscriptions['user'] = this.authService.user.subscribe((user:User)=>{
            this.user = user;
        },error=>{
            this.fetchErrorHandler(error);
        });
        this.fetchPosts();
    }

    fetchPosts(){
        this._subscriptions['posts'] = this.feedsService.paginate(this.pagination).subscribe((response: PaginationResponse<Post>)=>{
            this.paginationResponse = response;
            console.log(this.paginationResponse)
        },error=>{
            this.fetchErrorHandler(error);
        })
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
        this.presentToast(message);
    }
}