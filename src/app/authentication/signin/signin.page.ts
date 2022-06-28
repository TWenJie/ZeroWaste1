import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { Browser } from "@capacitor/browser";
import { LoadingController, ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { SigninRequest } from "src/app/interfaces/auth-request.interface";
import { SigninResponse } from "src/app/interfaces/auth-response.interface";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-signin',
    templateUrl: 'signin.page.html',
    styleUrls: ['signin.page.scss'],
})
export class SigninPage implements OnInit, OnDestroy{
    isLoading = false;
    private _authSub: Subscription;
    private _forgotPasswordURL="https://zerowaste.cs.usm.my/spebaweb/auth/forgot-password";

    constructor(
        private authService: AuthService,
        private router: Router,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
    ){}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        if(this._authSub){
            this._authSub.unsubscribe();
        }
    }
    
    onForgotPassword(){
        Browser.open({
            url: this._forgotPasswordURL,
        });
    }

    onSubmit(form:NgForm){
        if(!form.valid){
            return;
        }
        const {email,password} = form.value;
        this.authenticate(email.trim(),password.trim());
    }

    async authenticate(email:string,password:string){
        this.isLoading = true;
        await this.presentLoading('Login...');

        const signinCredentials: SigninRequest = {
            email,
            password
        };

        this._authSub = this.authService.login(signinCredentials).subscribe((response:SigninResponse)=>{
            this.loadingCtrl.dismiss();
            if(response.isEmailVerified){
                return this.router.navigateByUrl('/tabs',{replaceUrl:true});
            }
            return this.router.navigateByUrl('/profile-verify');
        },(error)=>{
            if(this.loadingCtrl.getTop()){
                this.loadingCtrl.dismiss();
            }
            const {message} = error.error;
            this.presentToast(message);

        })
    }

    async presentLoading(message:string){
        const loading = await this.loadingCtrl.create({
            message,
        })
        await loading.present();
    }

    async presentToast(message:string){
        const toast = await this.toastCtrl.create({
            message,
            duration: 5000,
        });
        await toast.present();
    }
}