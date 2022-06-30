import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import { Post } from "src/app/interfaces/feeds.interface";

@Component({
    selector: 'app-content-list',
    templateUrl: 'content-list.component.html',
    styleUrls: ['content-list.component.scss'],
})
export class ContentListComponent implements OnInit{

    @Input() items: any [];
    @Output() onRefreshList: EventEmitter<null> = new EventEmitter();
    @Output() onLoadMoreList: EventEmitter<null> = new EventEmitter();
    constructor(
        private router : Router,
    ){}

    ngOnInit(): void {
        console.log('Content_list:',this.items)
    }

    openDetailPage(item:Post){
        this.router.navigate(['tabs','feeds',item.id]);
    }

    onRefresh(event){
        event.target.complete();
        this.onRefreshList.emit();
    }

    onLoadMore(event){
        this.onLoadMoreList.emit(event)
    }
}