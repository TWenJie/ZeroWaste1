import { Component, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ModalController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { Smartbin } from "src/app/interfaces/smartbin.interface";
import { AnalyticsService, SmartBinEventTypes } from "src/app/services/analytics.service";
import { ComplainsService } from "src/app/services/complains.service";

@Component({
    selector: 'app-create-complain',
    templateUrl: 'create-complain.component.html',
    styleUrls: ['create-complain.component.scss'],
})
export class CreateComplainComponent implements OnInit, OnDestroy {
    form:FormGroup;
    complainTypes: ComplainTypes [] = [
        ComplainTypes.Broken,
        ComplainTypes.Dirty,
        ComplainTypes.Full
    ];

    @Input() smartbin: Smartbin;

    private _subscriptions: Subscription[] = [];
    constructor(
        private modalCtrl: ModalController,
        private complainsService: ComplainsService,
        private analyticsService: AnalyticsService,
        private toastCtrl: ToastController,
    ){}

    ngOnInit(): void {
        console.log('Complaining:',this.smartbin);
        this.form = new FormGroup({
            content: new FormControl(null),
            complainTypes: new FormControl(null,{
              validators: [Validators.required]
            }),
        })
    }
    ngOnDestroy(): void {
        this._subscriptions.forEach((sub) => {
            if (sub) {
              console.log('unsubscribe', sub);
              sub.unsubscribe();
            }
        });
    }

    createComplain(){
        if(!this.form.valid) return;
        this._subscriptions['complain'] = this.complainsService.create({
            smartbinId: this.smartbin._id,
            smartbinName: this.smartbin.properties.name,
            content: this.form.get('content').value,
            complainType: this.form.get('complainTypes').value,
        }).subscribe({
            next: (response)=>{
                this.form.reset();
                this.presentToast('Complain submitted!');
                this.dismissModal();
                //analytics service here. use promise instead, because we don't care about the response.
                this.analyticsService.logSmartbinEvent({
                    eventType: SmartBinEventTypes.CreateComplain,
                    sourceId: this.smartbin._id,
                }).toPromise().then(response=>{
                    console.log('Event logged:',response)
                }).catch(error=>{
                    console.error(error);
                });
            },
            error: (error)=>{
                this.form.reset();
                const message = error?.error?.message ?? 'Create complain failed!';
                this.presentToast(message);
                this.dismissModal();

            }
        })
    }

    dismissModal(){
        if(this.modalCtrl.getTop()){
            this.modalCtrl.dismiss();
        }
    }

    async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        })
        await toast.present();
    }
}


export enum ComplainTypes {
    Broken = 'Broken',
    Dirty = 'Dirty',
    Full = 'Full',
}