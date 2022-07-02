import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AnchorPreviewDirective } from "./anchor/anchor-preview.directive";

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [AnchorPreviewDirective],
    exports: [AnchorPreviewDirective]
})
export class SharedDirectivesModule{}