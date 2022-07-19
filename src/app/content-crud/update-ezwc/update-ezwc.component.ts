import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ModalController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { EZWCFeed } from "src/app/interfaces/feeds.interface";
import { FeedsEZWCService } from "src/app/services/feeds-ezwc.service";

@Component({
    selector: 'app-update-ezwc',
    templateUrl: 'update-ezwc.component.html',
    styleUrls: ['update-ezwc.component.scss'],
})
export class UpdateEZWCComponent implements OnInit, OnDestroy{
    @Input() item: EZWCFeed;
    form: FormGroup;

    private _subscriptions: Subscription[] = [];

    constructor(
        private ezwcService: FeedsEZWCService,
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
    ){}

    ngOnInit(): void {
        this.form = new FormGroup({
            textContent: new FormControl(this.item.textContent,{
                validators: [Validators.required],
            }),
            dataformURL: new FormControl(this.item.dataStudioURL,{
                validators: [Validators.pattern(/(https?:\/\/datastudio.google.com\/[^ ]*)/)]
            }),
        })
    }

    update(){
        if(!this.form.valid) return;
        this._subscriptions['updateFeed'] = this.ezwcService.update(this.item.id,{
            textContent: this.form.get('textContent').value,
            dataStudioURL: this.form.get('dataformURL').value
        }).subscribe({
            next: (response)=>{
                this.presentToast("Feed updated!");
                this.modalCtrl.dismiss();
            },
            error: (error)=>{
                const message = error?.error?.message ?? "Update feed failed!";
                this.presentToast(message);
                this.modalCtrl.dismiss();
            }
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

    async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        });
        await toast.present();
    }
}