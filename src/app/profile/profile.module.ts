import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { ProfileAboutComponent } from "./about/about.component";
import { ProfileComplainsComponent } from "./complains/complains.component";
import { ProfilePageRoutingModule } from "./profile-routing.module";
import { ProfilePage } from "./profile.page";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ProfilePageRoutingModule,
        SharedComponentsModule,
    ],
    declarations: [
        ProfilePage,
        ProfileComplainsComponent,
        ProfileAboutComponent,
    ]
})
export class ProgilePageModule{}