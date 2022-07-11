import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Post } from "src/app/interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "src/app/interfaces/pagination.interface";
import { User } from "src/app/interfaces/user.class";
import { AuthService } from "src/app/services/auth.service";
import { ContentActionsService } from "src/app/services/content-actions.service";
import { FeedsService } from "src/app/services/feeds.service";
import { ContentDetailsComponent } from "src/app/shared-components/content-details/content-details.component";

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

    //for video autoplay/stop when scrolling
    @ViewChild('feedsContentList') feedsContentList;
    private _currentPlayingVideoComp = null;
    private _currentPlayingVideoRef = null;

    constructor(
        private authService: AuthService,
        private feedsService: FeedsService,
        private toastCtrl: ToastController,
        private contentActionsService: ContentActionsService,
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
            limit:100,
            page: 0,
        }
        this._subscriptions['user'] = this.authService.user.subscribe((user:User)=>{
            this.user = user;
        },error=>{
            this.fetchErrorHandler(error);
        });
        this.fetchPosts();
    }

    fetchPosts(event=null){
        // console.log('Pagination:',this.pagination);
        this._subscriptions['posts'] = this.feedsService.paginate(this.pagination).subscribe((response: PaginationResponse<Post>)=>{
            this.paginationResponse = response;
            console.log(this.paginationResponse);
            console.log('Feeds:',response);
            if(event){
                event.target.complete();
            }
        },error=>{
            this.fetchErrorHandler(error);
        })
    }


    fetchNext(event){
        //switc case filter, then fetch;
        let {totalPages} = this.paginationResponse;
        if(this.pagination.page >= (totalPages -1)){
            if(event) event.target.complete();
            return;
        }
        this.pagination.page = this.pagination.page + 1;
        this.fetchPosts(event);
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

    onRefreshList(){
        //Switch on filters, then fetchpost
        this.pagination.page = 0;
        this.fetchPosts();
    }

    contentActionsHandler(item){
        this.contentActionsService.showActions(item);
    }

    /**
     * Handling scrolling events to tigger video auto play/paused
     * @param event 
     */
    listDidScroll(event){
        // console.log('Scrilling:',this.feedsContentList);
        if(this._currentPlayingVideoRef && this.isElementInView(this._currentPlayingVideoRef)) return;
        if(this._currentPlayingVideoComp && !this.isElementInView(this._currentPlayingVideoRef)){
            this._currentPlayingVideoComp.pause();
            this._currentPlayingVideoRef = null;
            this._currentPlayingVideoComp = null;

        }

        // console.log('Looping ....',this.feedsContentList);

        this.feedsContentList.contentDetailRef.forEach((element:ElementRef<ContentDetailsComponent>,index : number)=>{
            if(this._currentPlayingVideoComp) return;
            const contentDetailElement  = element.nativeElement;
            const isInView = this.isElementInView(contentDetailElement);
            
            if(!isInView) return;
            // console.log('CurrentVideoComp:',this._currentPlayingVideoComp);
            if(this.feedsContentList.contentDetailComp.get(index).youtubePlayer){
                // console.log('getting Youtube player');
                this._currentPlayingVideoRef = contentDetailElement;
                this._currentPlayingVideoComp = this.feedsContentList.contentDetailComp.get(index);
            }
        })

    }

    /**
     * Check if video element is in view or outside of view
     */
    isElementInView(element){
        const rec = element.getBoundingClientRect();
        return (
            rec.top >= 0 &&
            rec.left >= 0 &&
            rec.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rec.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}