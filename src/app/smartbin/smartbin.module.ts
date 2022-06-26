import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
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
    ]
})
export class SmartbinPageModule{}