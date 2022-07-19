import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { ActionSheetController, ModalController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { UpdateEZWCComponent } from "../content-crud/update-ezwc/update-ezwc.component";
import { User } from "../interfaces/user.class";
import { Role } from "../interfaces/user.interface";
import { AuthService } from "./auth.service";
import { FeedsService } from "./feeds.service";

@Injectable({
    providedIn:'root',
})
export class EZWCActionsService implements OnDestroy{
    protected _user: User;

    protected _subscriptions: Subscription [] = [];
    constructor(
        private authService: AuthService,
        private actionsCtrl: ActionSheetController,
        private feedsService: FeedsService,
        private toastCtrl: ToastController,
        private modalCtrl: ModalController,
    ){
        this._subscriptions['user'] = this.authService.user.subscribe((user)=>{
            this._user = user;
        });
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach(sub=>{
            if(sub){
                console.log('_contentService_unsubscribe_to',sub);
                sub.unsubscribe();
            }
        })
    }

    async showActions(item:any){
        console.log('this>user:',this._user);
        if(this._user.role == Role.User) return;
        const buttons = [
            {
                text: 'Delete',
                icon: 'trash',
                handler: () => {
                    this.deleteActionsHandler(item)
                }
            },
            {
                text: 'Edit',
                icon: 'create',
                handler: () => {
                    this.editActionsHandler(item)
                }
            }
        ];

        const actions = await this.actionsCtrl.create({
            animated: true,
            backdropDismiss: true,
            keyboardClose: false,
            buttons
        })

        await actions.present();
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

    private async editActionsHandler(item:any){
        console.log('edit_action');
        const modal = await this.modalCtrl.create({
            component: UpdateEZWCComponent,
            componentProps: {
                item,
            }
        })
        await modal.present();
    }

    private async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        });
        await toast.present();
    }
}