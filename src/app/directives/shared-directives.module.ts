import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AnchorPreviewDirective } from "./anchor/anchor-preview.directive";
import { HasRoleDirective } from "./role/has-role.directive";

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [AnchorPreviewDirective, HasRoleDirective],
    exports: [AnchorPreviewDirective, HasRoleDirective],
    providers: [
        AnchorPreviewDirective,
        HasRoleDirective,
    ]
})
export class SharedDirectivesModule{}