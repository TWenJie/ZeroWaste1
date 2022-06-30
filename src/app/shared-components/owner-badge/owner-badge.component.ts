import { Component, Input, OnInit } from "@angular/core";
import { UserProfile } from "src/app/interfaces/user.interface";

@Component({
    selector: 'app-owner-badge',
    templateUrl: 'owner-badge.component.html',
    styleUrls: ['owner-badge.component.scss']
})
export class OwnerBadgeComponent implements OnInit {
    fallbackImage: string = "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50"
    @Input() userProfile: UserProfile;
    constructor(){}

    ngOnInit(): void {
    }

}