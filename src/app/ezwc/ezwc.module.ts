import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { EZWCContentDetailPage } from "./content-details/content-detail.page";
import { EZWCContentListPage } from "./content-list/content-list.page";
import { EZWCPageRoutingModule } from "./ezwc-routing.module";
import { EZWCWelcomePage } from "./welcome/welcome.page";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        EZWCPageRoutingModule,
        SharedComponentsModule,
    ],
    declarations: [EZWCWelcomePage,EZWCContentListPage, EZWCContentDetailPage]
})
export class EZWCPageModule{}