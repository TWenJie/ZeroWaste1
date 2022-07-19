import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChildren } from "@angular/core";
import { Post } from "src/app/interfaces/feeds.interface";
import { ContentDetailsComponent } from "../content-details/content-details.component";

@Component({
    selector: 'app-content-list',
    templateUrl: 'content-list.component.html',
    styleUrls: ['content-list.component.scss'],
})
export class ContentListComponent implements OnInit{

    @Input() items: any [];
    @Output() onRefreshList: EventEmitter<null> = new EventEmitter();
    @Output() onLoadMoreList: EventEmitter<null> = new EventEmitter();
    @Output() contentActionsHandler: EventEmitter<null> = new EventEmitter();
    @Output() openDetailPageHandler: EventEmitter<any> = new EventEmitter();

    /**
     * These view children are use in /feeds/content-list.page/ 
     * to determine the element position in screen durin scroll event.
     * if this element in in screen, then we can auto play/pause video.
     */
    @ViewChildren('contentDetail') contentDetailComp;
    @ViewChildren('contentDetail',{read:ElementRef}) contentDetailRef : ElementRef<ContentDetailsComponent> []; 
    constructor(
    ){}

    ngOnInit(): void {
        // console.log('Content_list:',this.items)
    }

    openDetailPage(item:Post){
        // this.router.navigate(['tabs','feeds',item.id]);
        this.openDetailPageHandler.emit(item);
    }

    onRefresh(event){
        event.target.complete();
        this.onRefreshList.emit();
    }

    onLoadMore(event){
        this.onLoadMoreList.emit(event)
    }

    handleContentActions(item){
        this.contentActionsHandler.emit(item);
    }
}