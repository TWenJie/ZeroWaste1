import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { ActionSheetController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Post } from "../interfaces/feeds.interface";
import { User } from "../interfaces/user.class";
import { AuthService } from "./auth.service";
import { FeedsService } from "./feeds.service";

@Injectable({
    providedIn: 'root',
})
export class ContentActionsService implements OnDestroy{
    protected _user: User;

    protected _subscriptions: Subscription [] = [];
    constructor(
        private authService: AuthService,
        private actionsCtrl: ActionSheetController,
        private feedsService: FeedsService,
        private toastCtrl : ToastController,
    ){
        this._subscriptions['user'] = this.authService.user.subscribe((user)=>{
            this._user = user;
        });
    }

    showActions(item:any){
        const contentOwner = item.author;
        const ownerButtons = [
            {
                text: 'Delete',
                icon: 'trash',
                handler: () => {
                    //do something.
                    this.deleteActionsHandler(item);
                }
            },
            {
                text: 'Edit',
                icon: 'create',
                handler: () => {
                    //do something.
                    
                }
            },
        ];

        const moderatorButtons = [
            {
                text: 'Delete',
                icon: 'trash',
                handler: ()=>{
                    // this.removePost(post.id)
                    this.deleteActionsHandler(item);
                }
            },
            // {
            //     text: 'Approve',
            //     icon: 'checkbox',
            //     handler: ()=>{
            //         // this.approvePost(post.id)
            //     }
            // }
        ];

        const normalButtons = [
            {
                text: 'Report',
                icon: 'flag',
                handler: ()=>{
                    // this.reportPost(post.id)
                }
            }
        ];

        if(contentOwner.id == this._user.profile.id){
            this.presentActions(ownerButtons);
        }else if (this._user.role != 'User'){
            this.presentActions(moderatorButtons);
        }else {
            this.presentActions(normalButtons);
        }

    }

    private async presentActions(buttons){
        const actions = await this.actionsCtrl.create({
            animated: true,
            backdropDismiss: true,
            keyboardClose: false,
            buttons,
        });
        await actions.present();
    }

    private async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        });
        await toast.present();
    }

    private deleteActionsHandler(item:any){
        console.log('Action_delete');
        this._subscriptions['removeFeed'] = this.feedsService.remove(item.id)
        .subscribe({
            next: (response)=>{
                if(response){
                    console.log('remove_response:',response);
                    this.presentToast("Feeds, removed!");
                }
            },
            error: (error)=>{
                const message = error?.error?.message ?? 'Failed to remove feed!'
                this.presentToast(message);
            }
        })
    }

    private editActionsHandler(item:any){   
        //open edit page.
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('_contentService_unsubscribe_to',sub);
                sub.unsubscribe();
            }
        })
    }
}