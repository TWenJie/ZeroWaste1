import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FeedDetailPage } from "./content-detail/feed-detail.page";
import { FeedsListPage } from "./content-list/feeds-list.page";

const routes: Routes = [
    {
        path: '',
        component: FeedsListPage,
    },
    {
        path: ':id',
        component: FeedDetailPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class FeedsPageRoutingModule{}