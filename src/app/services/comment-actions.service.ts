import { Injectable, OnDestroy } from "@angular/core";
import { ActionSheetController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Comment } from "../interfaces/feeds.interface";
import { User } from "../interfaces/user.class";
import { AuthService } from "./auth.service";
import { ReactionsService } from "./reactions.service";

@Injectable({
    providedIn:'root'
})
export class CommentActionsService implements OnDestroy{
    private _subscriptions: Subscription [] = [];
    private _user: User;

    constructor(
        private authService: AuthService,
        private toastCtrl: ToastController,
        private reactionsService: ReactionsService,
        private actionsCtrl: ActionSheetController,
    ){
        this._subscriptions['user'] = this.authService.user.subscribe((user)=>{
            this._user = user;
        });
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('_service_unsubscribe_to',sub);
                sub.unsubscribe();
            }
        })
    }


    showActions(item:Comment,callback:CommentActionsCallback){
        const contentOwner = item.author;
        const ownerAndModeratorButtons = [
            {
                text: 'Delete',
                icon: 'trash',
                handler: () => {
                    //do something.
                    this.deleteActionsHandler(item,callback.delete);
                }
            },
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
            this.presentActions(ownerAndModeratorButtons);
        }else if (this._user.role != 'User'){
            this.presentActions(ownerAndModeratorButtons);
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

    private deleteActionsHandler(item:any,callback:Function =null){
        // console.log('Action_delete');
        this._subscriptions['removeComment'] = this.reactionsService.deleteComment(item.id)
        .subscribe({
            next: (response)=>{
                if(response){
                    // console.log('remove_response:',response);
                    this.presentToast("Comment, removed!");
                    if(typeof callback == 'function'){
                        callback(response,null);
                    }
                }
            },
            error: (error)=>{
                const message = error?.error?.message ?? 'Failed to remove comment!'
                this.presentToast(message);
                if(typeof callback == 'function'){
                    callback(null,error);
                }
            }
        })
    }
}


export interface CommentActionsCallback{
    delete: Function;
    report?: Function;
}