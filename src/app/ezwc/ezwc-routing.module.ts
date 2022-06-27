import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EZWCContentListPage } from "./content-list/content-list.page";
import { EZWCWelcomePage } from "./welcome/welcome.page";

const routes : Routes = [
    {
        path: '',
        component: EZWCWelcomePage,
    },
    {
        path: 'lists',
        component: EZWCContentListPage,
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