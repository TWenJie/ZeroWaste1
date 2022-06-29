import { Component, Input } from "@angular/core";

@Component({
    selector: 'app-avatar',
    templateUrl: 'avatar.component.html',
    styleUrls: ['avatar.component.scss']
})
export class AvatarComponent {
    @Input() height: number = 30;
    @Input() width: number = 30;
    @Input() image: string = "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50"
}