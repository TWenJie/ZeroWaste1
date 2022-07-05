import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Complain } from "src/app/interfaces/complain.interface";

@Component({
    selector: 'app-profile-complains',
    templateUrl: 'complains.component.html',
    styleUrls: ['complains.component.scss']
})
export class ProfileComplainsComponent implements OnInit{
    @Input() lists: Complain[];
    @Output() fetchNext = new EventEmitter();
    @Output() refreshNext = new EventEmitter();
    constructor(){}
    ngOnInit(): void {
        
    }
}