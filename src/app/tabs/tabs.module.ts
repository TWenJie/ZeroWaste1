import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ContentCRUDModule } from "../content-crud/content-creation.module";
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { TabsPageRoutingModule } from "./tabs-rounting.module";
import { TabsPage } from "./tabs.page";

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        TabsPageRoutingModule,
        ContentCRUDModule,
        RouterModule,
        SharedComponentsModule
    ],
    declarations: [TabsPage]
})
export class TabsPageModule {}