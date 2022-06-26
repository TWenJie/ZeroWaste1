import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EZWCWelcomePage } from "./welcome/welcome.page";

const routes : Routes = [
    {
        path: '',
        component: EZWCWelcomePage,
    },
]

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class EZWCPageRoutingModule{}