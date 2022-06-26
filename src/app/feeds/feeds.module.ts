import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { FeedDetailPage } from "./content-detail/feed-detail.page";
import { FeedsListPage } from "./content-list/feeds-list.page";
import { FeedsPageRoutingModule } from "./feeds-routing.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        FeedsPageRoutingModule,
        SharedComponentsModule,
    ],
    declarations: [FeedsListPage,FeedDetailPage],
})
export class FeedsPageModule {}