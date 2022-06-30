import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NavController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Comment, Post } from "src/app/interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { ReactionsService } from "src/app/services/reactions.service";

@Component({
    selector: 'app-feed-detail',
    templateUrl: 'feed-detail.page.html',
    styleUrls: ['feed-detail.page.scss']
})
export class FeedDetailPage implements OnInit, OnDestroy {
    private _subscriptions: Subscription[] = [];

    pagination: PaginationOptions;
    paginationResponse: PaginationResponse<Comment>;

    item: Post;

    @ViewChild('commentModal') createCommentModal : HTMLIonModalElement;
    constructor(
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private reactionsService: ReactionsService,
    ){}

    ngOnInit(): void {
        if(this.route.snapshot.data['post']){
            this.item = this.route.snapshot.data['post'];
        }
    }

    ionViewWillEnter(){
        this.pagination = {
            limit: 10,
            page: 0,
        }
        this.paginateComments();
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('unsubscribe',sub);
                sub.unsubscribe();
            }
        })
    }

    goBack(){
        this.navCtrl.navigateBack('/tabs/feeds');
    }

    paginateComments(){
        if(this.item){
            this._subscriptions['comments'] = this.reactionsService.paginateComments(this.item.id,this.pagination)
            .subscribe((response: PaginationResponse<Comment>)=>{
                this.paginationResponse = response;
            })
        }
    }

    createComment(){
        this.createCommentModal.dismiss();
    }
}