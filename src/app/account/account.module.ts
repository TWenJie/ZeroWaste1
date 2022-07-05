import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { AccountPageRoutingModule } from "./account-routing.module";
import { AccountPage } from "./account.page";
import { ChangePasswordModalComponent } from "./change-password-modal/change-password.component";
import { EditInputModalComponent } from "./edit-input-modal/edit-input.component";

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        AccountPageRoutingModule,
    ],
    exports: [],
    declarations: [
        AccountPage,
        ChangePasswordModalComponent,
        EditInputModalComponent,
    ]
})
export class AccountPageModule{}