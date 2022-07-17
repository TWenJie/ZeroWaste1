import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SigninPage } from "./signin/signin.page";
import { SignupPage } from "./signup/signup.page";
import { VerifyPage } from "./verify/verify.page";


const routes: Routes = [
    {
        path: 'signin',
        component: SigninPage,
    },
    {
        path: 'signup',
        component: SignupPage,
    },
    {
        path: 'verify',
        component: VerifyPage,
    },
    {
        path: '',
        redirectTo: 'signin',
        pathMatch: 'full',
    }
]

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule,
    ]
})
export class AuthRoutingModule{}