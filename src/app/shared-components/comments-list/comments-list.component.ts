import { Component, Input, OnInit } from "@angular/core";
import { Comment } from "src/app/interfaces/feeds.interface";
import { CommentActionsService } from "src/app/services/comment-actions.service";

@Component({
    selector: 'app-comments-list',
    templateUrl: 'comments-list.component.html',
    styleUrls: ['comments-list.component.scss']
})
export class CommentsListComponent implements OnInit{
    
    @Input() comments: Comment [];

    constructor(
        private commentActionsService: CommentActionsService,
    ){}
    ngOnInit(): void {
        
    }

    openContentActions(item:Comment){
        // console.log("Comment_in_actions:",item);
        this.commentActionsService.showActions(item,{
            delete: (response,error)=>{
                if(response){
                    this.comments = response
                }
            }
        });
    }
}