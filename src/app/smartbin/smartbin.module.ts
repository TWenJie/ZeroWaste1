import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { IonicModule } from "@ionic/angular";
import { ContentCRUDModule } from "../content-crud/content-creation.module";
import { SmartbinDetailComponent } from "./details/detail.component";
import { SmartbinListPage } from "./list/list.page";
import { SmartbinPageRoutingModule } from "./smartbin-routing.module";

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        SmartbinPageRoutingModule,
        ContentCRUDModule,
        LeafletModule,
    ],
    declarations: [
        SmartbinListPage,
        SmartbinDetailComponent,
    ]
})
export class SmartbinPageModule{}