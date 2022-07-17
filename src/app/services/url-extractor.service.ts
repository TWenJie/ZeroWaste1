import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Injectable({
    providedIn: 'root',
})
export class URLExtractorService {
    private _webPreviewServiceUrl = `https://api.linkpreview.net/?`;


    /**
     * Delcaring regex as global can cause match to return null bugs,
     * reasong because we not reset the regex internal pointer
     * refer: https://stackoverflow.com/questions/4724701/regexp-exec-returns-null-sporadically
     */

    private _videoIDRegex =  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    private _URLRegex = /(https?:\/\/[^ ]*)/g;
    private _IMGURLRegex=  /\.(jpeg|jpg|png)$/; //add $ add the end to accept only url end with these extension
    private _EXTIMGURLRegex=  /\.(jpeg|jpg|png)/; //add $ add the end to accept only url end with these extension

    // private _anchor_regex = /\[(?<text>\w+)\]\((?<url>https?:\/\/[^ ]*)\)/gm //in format: [text](https://url.com), text is group1, url is group 2.
    private _anchor_regex = /\[(?<text>(\w+\s?){1,})\]\((?<url>https?:\/\/[^ ]*)\)/gm
    
    private _data_studio_url_regex = /(https?:\/\/datastudio.google.com\/[^ ]*)/;
    constructor(
        private sanitizer: DomSanitizer,
    ){}

    // parseTextContent(texts:string) : ParsedTexts{
    //     let resourceType = ResourceType.Text;
    //     let url : string = '';
    //     let parsedTexts = texts;
        
    //     if(texts.match(this._URLRegex)?.length > 0){
    //         const matches = this._URLRegex.exec(texts);
    //         url = matches?.[0];
    //         console.log('matches',matches);
    //         resourceType = ResourceType.EXTURL;
    //         parsedTexts = texts.replace(url,`<a>links</a>`)
    //     }

    //     //check if parsed url is youtube or external url.
    //     if(url.match(this._videoIDRegex)?.length > 0){
    //         resourceType = ResourceType.YouTube;
    //         parsedTexts = texts.replace(url,`<a (click)="parsedTexts.resources.url ? onURLClicked(parsedTexts.resources.url) : undefined">${url}</a>`)
    //     }

    //     const textContent = this.sanitizer.bypassSecurityTrustHtml(parsedTexts);

    //     return {
    //         textContent,
    //         resources: {
    //             type: resourceType,
    //             url
    //         }
    //     }
    // }

    parseTextforAnchor(texts:string) : ParsedTexts{

        const _anchor_regex = /\[(?<text>(\w+\s?){1,})\]\((?<url>https?:\/\/[^ ]*)\)/gm

        let preParsedText = texts;
        let match : RegExpExecArray  = null;
        let resources : Resource [] = [];
        while((match = _anchor_regex.exec(preParsedText) as RegExpExecArray)){
            let resource = {
                anchor: match[0],
                text: match.groups.text,
                url: match.groups.url
            } as Resource
            resources.push(resource);
        }

        return {
            textContent: preParsedText,
            resources,
        }
    }

    async parseTextForYoutube(texts) : Promise<ParsedYoutubeContent> {
        const _videoIDRegex =  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const _URLRegex = /(https?:\/\/[^ ]*)/g;

        const matches = _URLRegex.exec(texts);
        let url = matches?.[0];
        if(!url){
            return;
        }
        if(url.match(_videoIDRegex)?.length > 0){
            //remove html tags from url;
            // console.log('video_id_found:',url.match(_videoIDRegex))
            const parsedUrl = url.replace(/<[^>]*>?/gm, '');
            let videoId = this.extractVideoID(parsedUrl);
            return {
                videoId,
                url: parsedUrl,
            };
        }
    }

    extractVideoID(url:string){
        const _videoIDRegex =  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        if(!url) return;
        const match = url.match(_videoIDRegex);
        return (match && match[2].length === 11) ? match[2] : null;
    }


    isDataStudioUrl(URL:string) : boolean{
        const _data_studio_url_regex = /(https?:\/\/datastudio.google.com\/[^ ]*)/;

        return _data_studio_url_regex.test(URL);
    }
}




export interface ParsedTexts{
    textContent: string;
    resources: Resource[];
}

export interface ParsedYoutubeContent{
    videoId: string;
    url: string;
}

export interface Resource {
    anchor: string;
    text: string;
    url: string;
}

export enum ResourceType{
    Text = "Text",
    Video = "Video",
    Image = "Image",
    EXTImage = "EXTImage",
    YouTube = "YouTube",
    EXTURL = "EXTURL",
}