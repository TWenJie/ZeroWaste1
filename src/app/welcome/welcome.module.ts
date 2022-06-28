import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { WelcomeRoutingModule } from "./welcome-routing.module";
import { WelcomePage } from "./welcome.page";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        WelcomeRoutingModule,

    ],
    declarations: [
        WelcomePage,
    ]
})
export class WelcomePageModule{}