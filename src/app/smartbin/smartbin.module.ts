import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { SmartbinDetailComponent } from "./details/detail.component";
import { SmartbinListPage } from "./list/list.page";
import { SmartbinPageRoutingModule } from "./smartbin-routing.module";

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        SmartbinPageRoutingModule
    ],
    declarations: [
        SmartbinListPage,
        SmartbinDetailComponent,
    ]
})
export class SmartbinPageModule{}