import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PostResolverService } from "../services/post-resolver.service";
import { EZWCContentDetailPage } from "./content-details/content-detail.page";
import { EZWCContentListPage } from "./content-list/content-list.page";
import { EZWCWelcomePage } from "./welcome/welcome.page";

const routes : Routes = [
    {
        path: '',
        component: EZWCWelcomePage,
    },
    {
        path: 'feeds',
        component: EZWCContentListPage,
    },
    {
        path: 'feeds/:id',
        component: EZWCContentDetailPage,
        resolve: {
            post: PostResolverService,
        }
    }
]

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class EZWCPageRoutingModule{}