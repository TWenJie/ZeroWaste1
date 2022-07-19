import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { QuillModule } from "ngx-quill";
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { CreateComplainComponent } from "./create-complain/create-complain.component";
import { CreateEventComponent } from "./create-event/create-event.component";
import { CreateEZWCComponent } from "./create-ezwc/create-ezwc.component";
import { CreateFeedComponent } from "./create-feed/create-feed.component";
import { UpdateEZWCComponent } from "./update-ezwc/update-ezwc.component";


@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        QuillModule,
        SharedComponentsModule,
    ],

    declarations: [
        CreateEventComponent,
        CreateFeedComponent,
        CreateComplainComponent,
        CreateEZWCComponent,
        UpdateEZWCComponent,
    ]
})
export class ContentCRUDModule{}