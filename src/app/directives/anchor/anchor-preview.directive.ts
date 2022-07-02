import {  Directive, ElementRef, Input, OnDestroy, OnInit, ViewContainerRef } from "@angular/core";
import {  ParsedYoutubeContent, URLExtractorService } from "src/app/services/url-extractor.service";

@Directive({
    selector: '[appAnchorPreview]',
})
export class AnchorPreviewDirective implements OnInit, OnDestroy{
    @Input('appAnchorPreview') passedTexts:string;

    videoComponentRef: any;
    constructor(
        private el: ElementRef,
        public viewContainer: ViewContainerRef,
        private URLExtractor: URLExtractorService,
    ){}

    ngOnInit(){
        this.el.nativeElement.style.backgroundColor = 'yellow';
    }

    play(){
        console.log('play:',this.videoComponentRef)
    }
    //check if texts contain youtube url;

    ngOnDestroy(): void {
        
    }
}