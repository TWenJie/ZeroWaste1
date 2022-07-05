
import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import {  BehaviorSubject, Observable, Subscription } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { Post } from "../interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "../interfaces/pagination.interface";
import { User } from "../interfaces/user.class";
import { AuthService } from "./auth.service";
import { CachingService } from "./caching.service";

import { FeedsService } from "./feeds.service";

@Injectable({
    providedIn: 'root',
})
export class ProfileFeedsService extends FeedsService implements OnInit, OnDestroy{

    private _unposts$: BehaviorSubject<Post[]> = new BehaviorSubject<Post[]>([]);

    user: User;
    private _userSub: Subscription;

    constructor(
        http:HttpClient,
        cachingService: CachingService,
        authService: AuthService,
    ){
        super(http,cachingService);
        this._userSub = authService.user.subscribe(user=>{
            this.user = user;
        });
    }

    ngOnInit(){
        
    }

    ngOnDestroy(): void {
        if(this._userSub){
            this._userSub.unsubscribe();
        }
    }

    get unposts(){
        return this._unposts$.asObservable();
    }

    paginate(options: PaginationOptions, forceRefresh?: boolean): Observable<any> {
        let tempResponse: PaginationResponse<Post>;
        console.log('Profile:user:',this.user);
        const url = this.genPaginationURL(`users/${this.user?.profile?.id}`,options);
        return this.getData(url,forceRefresh).pipe(
        switchMap((response: PaginationResponse<Post>)=>{
            tempResponse = response;
            return this.posts;
        }),
        take(1),
        map((posts:Post[])=>{
            if(options.page == 0){
            posts = [];
            }
            posts = (tempResponse.results.length > 0)? posts.concat(tempResponse.results) : posts;
            tempResponse.results = posts;
            return tempResponse;
        }),
        tap((response: PaginationResponse<Post>)=>{
            this._posts$.next(response.results); //unessesary but jut do it incase need.
        })
        )
    }


    paginateUnapproved(options: PaginationOptions, forceRefresh?: boolean): Observable<any> {
        let tempResponse: PaginationResponse<Post>;
        const url = this.genPaginationURL(`users/${this.user?.profile?.id}/unapproved`,options);
        return this.getData(url,forceRefresh).pipe(
        switchMap((response)=>{
            tempResponse = response;
            return this.unposts;
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
            this._unposts$.next(response.results);
        })
        )
    }
}