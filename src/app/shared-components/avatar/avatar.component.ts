import { Component, Input } from "@angular/core";

@Component({
    selector: 'app-avatar',
    templateUrl: 'avatar.component.html',
    styleUrls: ['avatar.component.scss']
})
export class AvatarComponent {
    @Input() height: number = 30;
    @Input() width: number = 30;
    @Input() image: string = "assets/img/fallback_profile.svg";
}