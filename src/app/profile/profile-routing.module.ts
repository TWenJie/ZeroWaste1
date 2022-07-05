import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfilePage } from "./profile.page";

const routes : Routes = [
    {
        path: '',
        component: ProfilePage,
    }
]
@NgModule({
    imports: [RouterModule.forChild(routes)],
    declarations:[],
    exports: [
        RouterModule,
    ]
})
export class ProfilePageRoutingModule{}