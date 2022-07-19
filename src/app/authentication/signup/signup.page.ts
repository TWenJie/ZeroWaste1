import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { LoadingController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-signup',
    templateUrl: 'signup.page.html',
    styleUrls: ['signup.page.scss'],
})
export class SignupPage implements OnInit, OnDestroy{

    private _subscriptions: Subscription[] = [];
    constructor(
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private authService: AuthService,
        private router: Router,
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

    onSignUp(form: NgForm){
        if(!form.valid) return;

        const {username,email,password,cpassword} = form.value;
        if(password !== cpassword){
            this.presentToast("Password not matched!");
            return;
        }
        //try signup
        this._subscriptions['signup'] = this.authService.signup({
            username,
            email,
            password
        }).subscribe({
            next: (response)=>{
                this.presentToast("Signup success, please login!");
                this.router.navigateByUrl("/auth/signin");
            },
            error: (error)=>{
                const message = error?.error?.message ?? "Signup Failed!";
                this.presentToast(message);
            }
        })
    }

    async presentToast(message){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        })
        await toast.present();
    }

    // async presentLoading(){
    //     const loading = await this.loadingCtrl.create({
    //         message: "Please wait!",
    //     })
    //     await loading.present();
    // }
}