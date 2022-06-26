import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { ContentCRUDModule } from "../content-crud/content-creation.module";
import { TabsPageRoutingModule } from "./tabs-rounting.module";
import { TabsPage } from "./tabs.page";

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        TabsPageRoutingModule,
        ContentCRUDModule,
    ],
    declarations: [TabsPage]
})
export class TabsPageModule {}