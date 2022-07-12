import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
    selector: 'app-engagement-buttons',
    templateUrl: 'engagement-buttons.component.html',
    styleUrls: ['engagement-buttons.component.scss'],
})
export class EngagementButtonsComponent implements OnInit{
    @Input() liked: boolean = null;
    @Input() commentsCount: number = 0;
    @Input() likesCount: number = 0;
    @Output() commentClickHandler : EventEmitter<any> = new EventEmitter();
    @Output() likeClickHandler: EventEmitter<any> = new EventEmitter();
    constructor(){}

    ngOnInit(): void {
        
    }
}