import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { SigninPage } from "./signin/signin.page";
import { SignupPage } from "./signup/signup.page";


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