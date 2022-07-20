import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NavController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Comment, Post } from "src/app/interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { User } from "src/app/interfaces/user.class";
import { Role } from "src/app/interfaces/user.interface";
import { AnalyticsService, FeedEventTypes } from "src/app/services/analytics.service";
import { AuthService } from "src/app/services/auth.service";
import { EZWCActionsService } from "src/app/services/ezwc-actions.service";
import { ReactionsService } from "src/app/services/reactions.service";

@Component({
    selector: 'app-ezwc-content-detail',
    templateUrl: 'content-detail.page.html',
    styleUrls: ['content-detail.page.scss']
})
export class EZWCContentDetailPage implements OnInit, OnDestroy{
    private _subscriptions: Subscription[] = [];
    
    user:User;
    pagination: PaginationOptions;
    paginationResponse: PaginationResponse<Comment>;
    commentText:string;

    item: Post;

    @ViewChild('commentModal') createCommentModal : HTMLIonModalElement;
    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private reactionsService: ReactionsService,
        private reactionService: ReactionsService,
        private toastCtrl: ToastController,
        private ezwcActionService: EZWCActionsService,
        private analyticsService: AnalyticsService,

    ){}

    ngOnInit(): void {
        if(this.route.snapshot.data['post']){
            this.item = this.route.snapshot.data['post'];
        }
        console.log('router_snapshot:',this.route.snapshot);
    }

    ionViewWillEnter(){
        this.pagination = {
            limit: 10,
            page: 0,
        }
        this._subscriptions['user'] = this.authService.user.subscribe({
            next: (user:User)=>{
                this.user = user;
            },
            error: this.fetchErrorHandler.bind(this),
        });
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

    paginateComments(event=null){
        if(this.item){
            this._subscriptions['comments'] = this.reactionsService.paginateComments(this.item.id,this.pagination)
            .subscribe({
                next: (response: PaginationResponse<Comment>)=>{
                    this.paginationResponse = response;
                    if(event){
                        event.target.complete();
                    }
                },
                error: (error)=>{
                    const message = error?.error?.message ?? 'Error getting comments!';
                    this.presentToast(message);
                    if(event){
                        event.target.complete();
                    }
                }
            })
        }
    }

    onRefresh(event){
        this.paginateComments(event);
    }

    createComment(){
        this.createCommentModal.dismiss();

        //TODO, input NgModel (two way binding, refer old code)
        if(!this.commentText && this.commentText.length < 3) return;
        this._subscriptions['createComment'] = this.reactionService.createComment(
            this.item.id,
            this.commentText
        ).subscribe({
            next:(response)=>{
                console.log('Comment_response:',response);
                this.paginationResponse.results = response;
                this.commentText = null;
                this.presentToast('Comment created!');
                this.analyticsService.logEvent({
                    eventType: FeedEventTypes.CreateComment,
                    sourceId: this.item.id
                }).toPromise();
            },
            error: this.createCommentErrorHandler.bind(this),
        })
    }


    contentActionsHandler(item){
        if(this.user._role == Role.User) return;
        this.ezwcActionService.showActions(item);
    }

    createCommentErrorHandler(error){   
        const message = error?.error?.message ?? "Failed to create comment!";
        this.presentToast(message);
    }

    async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        })
    }

    fetchErrorHandler(error){
        let message = error.error.message ?? 'Unable to fetch posts';
        this.presentToast(message);
    }
}