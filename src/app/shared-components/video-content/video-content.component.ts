import { Component, Input, OnInit } from "@angular/core";
import {  ParsedYoutubeContent } from "src/app/services/url-extractor.service";
import { YouTubePlayer } from '@angular/youtube-player';

@Component({
    selector: 'app-video-component',
    templateUrl: 'video-content.component.html',
    styleUrls: ['video-content.component.scss']
})
export class VideoContentComponent implements OnInit{
    @Input() videoContent: ParsedYoutubeContent;
    constructor(){}
    ngOnInit(): void {
        
    }
}