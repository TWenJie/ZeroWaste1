import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { ActionSheetController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { User } from "../interfaces/user.class";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root',
})
export class ContentActionsService implements OnDestroy{
    private _user: User;

    private _subscriptions: Subscription [] = [];
    constructor(
        private authService: AuthService,
        private actionsCtrl: ActionSheetController,
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
                    console.log('Action_delete');
                }
            },
            {
                text: 'Edit',
                icon: 'create',
                handler: () => {
                    //do something.
                    console.log('Action_edit');
                }
            },
        ];

        const moderatorButtons = [
            {
                text: 'Delete',
                icon: 'trash',
                handler: ()=>{
                    // this.removePost(post.id)
                }
            },
            {
                text: 'Approve',
                icon: 'checkbox',
                handler: ()=>{
                    // this.approvePost(post.id)
                }
            }
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

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('_contentService_unsubscribe_to',sub);
                sub.unsubscribe();
            }
        })
    }
}