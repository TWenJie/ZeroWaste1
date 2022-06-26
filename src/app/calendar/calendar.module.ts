import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { IonicModule } from "@ionic/angular";
import { CalendarPageRoutingModule } from "./calendar-routing.module";
import { CalendarPage } from "./calendar.page";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        CalendarPageRoutingModule,
    ],
    declarations: [
        CalendarPage,
    ]
})
export class CalendarPageModule {}