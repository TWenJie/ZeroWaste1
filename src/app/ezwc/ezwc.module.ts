import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { EZWCContentDetailPage } from "./content-details/content-detail.page";
import { EZWCContentListPage } from "./content-list/content-list.page";
import { EZWCPageRoutingModule } from "./ezwc-routing.module";
import { EZWCWelcomePage } from "./welcome/welcome.page";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        EZWCPageRoutingModule
    ],
    declarations: [EZWCWelcomePage,EZWCContentListPage, EZWCContentDetailPage]
})
export class EZWCPageModule{}