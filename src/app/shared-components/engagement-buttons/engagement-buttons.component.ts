import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
    selector: 'app-engagement-buttons',
    templateUrl: 'engagement-buttons.component.html',
    styleUrls: ['engagement-buttons.component.scss'],
})
export class EngagementButtonsComponent implements OnInit{
    
    @Output() commentClickHandler : EventEmitter<any> = new EventEmitter();
    constructor(){}

    ngOnInit(): void {
        
    }
}