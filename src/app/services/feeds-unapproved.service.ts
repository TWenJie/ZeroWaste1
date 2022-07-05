import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Observable} from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { Post } from "../interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "../interfaces/pagination.interface";
import { CachingService } from "./caching.service";
import { FeedsService } from "./feeds.service";

@Injectable({
    providedIn: 'root',
})
export class FeedsUnapprovedService extends FeedsService implements OnInit, OnDestroy
{
    constructor(
        http:HttpClient,
        cachingService: CachingService,
    ){
        super(http,cachingService);
    }

    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        
    }

    paginate(options: PaginationOptions, forceRefresh?: boolean): Observable<any> {
        let tempResponse: PaginationResponse<Post>;
        const url = this.genPaginationURL('unapproved',options);
        return this.getData(url,forceRefresh).pipe(
        switchMap((response)=>{
            tempResponse = response;
            return this.posts;
        }),
        take(1),
        map((unposts:Post[])=>{
            if(options.page == 0){
            unposts = [];
            }
            unposts = (tempResponse.results.length > 0)? unposts.concat(tempResponse.results) : unposts;
            tempResponse.results = unposts;
            return tempResponse;
        }),
        tap((response:PaginationResponse<Post>)=>{
            this._posts$.next(response.results);
        })
        )
    }
    
}