import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { ToastController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { User } from "src/app/interfaces/user.class";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-verify-page',
    templateUrl: 'verify.page.html',
    styleUrls: ['verify.page.scss']
})
export class VerifyPage implements OnInit,OnDestroy{
    user:User;
    private _authSub: Subscription;
    constructor(
        private router: Router,
        private authService: AuthService,
        private toastCtrl: ToastController,
    ){}

    ngOnInit(): void {
        
    }

    ionViewWillEnter(){
        this._authSub = this.authService.user.subscribe(user=>{
          console.log('User:',user);
          this.user = user;
        })
      }
    
      ngOnDestroy(): void {
          if(this._authSub) this._authSub.unsubscribe();
      }
    
      sendOOB(){
        if(this.user?.email && !this.user?.isEmailVerified){
          // if(this._authSub) this._authSub.unsubscribe();
          this.authService.getCode().subscribe(response=>{
            if(!response) return;
            this.showToast('Sent, Please check your email!');
          }
            ,error=>{
            console.log(error);
            const message = error?.error?.message || 'Request Code Failed!';
            this.showToast(message);
          });
        }
      }
    
      verifyOOB(form:NgForm){
        if(!form.valid) return;
        const {code} = form.value;
        // if(this._authSub) this._authSub.unsubscribe();
        if(code){
          this.authService.verifyCode({code}).subscribe((response)=>{
            if(response){
              this.showToast('Account verified!');
              this.router.navigateByUrl('tabs');
            }
          },error=>{
            const message = error?.error?.message || 'Verification Failed!';
            this.showToast(message);
          })
        }
      }
    
      async showToast(message:string){
        const toast = await this.toastCtrl.create({
          message,
          duration: 2000
        });
        toast.present();
      }
}