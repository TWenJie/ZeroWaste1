import { Component, Input, OnInit } from "@angular/core";

@Component({
    selector: 'app-text-content',
    templateUrl: 'text-content.component.html',
    styleUrls: ['text-content.component.scss']
})
export class TextContentComponent implements OnInit{
    @Input() textContent: string;
    constructor(){}
    ngOnInit(): void {
        
    }
}