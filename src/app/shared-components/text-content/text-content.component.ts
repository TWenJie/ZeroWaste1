import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Browser } from "@capacitor/browser";
import { AnchorPreviewDirective } from "src/app/directives/anchor/anchor-preview.directive";
import { ParsedTexts, URLExtractorService } from "src/app/services/url-extractor.service";

@Component({
    selector: 'app-text-content',
    templateUrl: 'text-content.component.html',
    styleUrls: ['text-content.component.scss']
})
export class TextContentComponent implements OnInit, AfterViewInit{
    @Input() textContent:string;
    parsedTexts: ParsedTexts;
    parsedTextContent: string | SafeHtml;

    @ViewChild(AnchorPreviewDirective,{static:true}) AnchorPreviewDirective: AnchorPreviewDirective;
    constructor(
        private elementRef: ElementRef,
        private URLExtractorService: URLExtractorService,
        private sanitizer: DomSanitizer,
    ){}
    ngOnInit(): void {
        this.parsedTexts = this.URLExtractorService.parseTextforAnchor(this.textContent);

        // console.log('inside_textContent:',this.parsedTexts);
        this.parsedTexts.resources.forEach(resource=>{
            this.parsedTexts.textContent = this.parsedTexts.textContent
            .replace(resource.anchor,`<a class="highlighted" data-name="${resource.text}">${resource.text}</a>`)
        })
        this.parsedTextContent = this.sanitizer.bypassSecurityTrustHtml(this.parsedTexts.textContent);
        // console.log('textContent',this.parsedTexts.textContent);
    }

    ngAfterViewInit(): void {
        // console.log('after view init')
        this.parsedTexts.resources.forEach(resource=>{
            if(this.elementRef.nativeElement.querySelector(`[data-name="${resource.text}"]`)){
                this.elementRef.nativeElement.querySelector(`[data-name="${resource.text}"]`).addEventListener('click',()=>{
                    this.onURLClicked(resource.url);
                })
            }
        })
        
    }

    async onURLClicked(url){
        // console.log('Testing OnClick:',url);
        await Browser.open({url});
    }
}