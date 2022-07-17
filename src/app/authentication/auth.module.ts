import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { AuthRoutingModule } from "./auth-routing.module";
import { SigninPage } from "./signin/signin.page";
import { SignupPage } from "./signup/signup.page";
import { VerifyPage } from "./verify/verify.page";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        AuthRoutingModule,
    ],
    declarations: [SigninPage,SignupPage,VerifyPage]
})
export class AuthPageModule{}