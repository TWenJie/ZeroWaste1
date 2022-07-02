import {  Directive, ElementRef, Input, OnDestroy, OnInit, ViewContainerRef } from "@angular/core";
import {  ParsedYoutubeContent, URLExtractorService } from "src/app/services/url-extractor.service";
import { VideoContentComponent } from "src/app/shared-components/video-content/video-content.component";

@Directive({
    selector: '[appAnchorPreview]'
})
export class AnchorPreviewDirective implements OnInit, OnDestroy{
    @Input('appAnchorPreview') passedTexts:string;

    constructor(
        private el: ElementRef,
        public viewContainer: ViewContainerRef,
        private URLExtractor: URLExtractorService,
    ){}

    ngOnInit(){
        this.el.nativeElement.style.backgroundColor = 'yellow';
        console.log('passedTexts:',this.passedTexts);
        console.log('viewContainer:',this.viewContainer);
        let videoContent: ParsedYoutubeContent = this.URLExtractor.parseTextForYoutube(this.passedTexts);
        if(videoContent){
            let componentRef = this.viewContainer.createComponent(VideoContentComponent);
            componentRef.instance.videoContent = videoContent;
        }
    }

    //check if texts contain youtube url;

    ngOnDestroy(): void {
        
    }
}