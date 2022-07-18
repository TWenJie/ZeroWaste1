import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, from, Observable, of } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { EventFeed } from "../interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "../interfaces/pagination.interface";
import { CachingService } from "./caching.service";

@Injectable({
    providedIn: 'root',
})
export class FeedsEventService implements OnInit, OnDestroy{
    protected _POST_URL = environment.serviceURI+'/posts/events';

    protected _posts$: BehaviorSubject<EventFeed[]> = new BehaviorSubject([]);

    constructor(
        protected http:HttpClient,
        protected cachingService: CachingService,
    ){

    }
    ngOnInit(): void {
        
    }

    ngOnDestroy(): void {
        
    }

    get posts() {
        return this._posts$.asObservable();
    }

    getData(url:string,forceRefresh:boolean = false): Observable<any>{
        if(forceRefresh){
          return this.requestAndCache(url);
        }else{
          const storedValue =  from(this.cachingService.getCachedRequest(url));
          return storedValue.pipe(
            switchMap(result=>{
              if(!result) return this.requestAndCache(url);
              return of(result);
            })
          );
        } 
    }
    
    genPaginationURL(namespace,options):string{
        const url = `${this._POST_URL}/${namespace}?limit=${options.limit}&page=${options.page}`;
        return url;
    }

    requestAndCache(url):Observable<any>{
        return this.http.get(url).pipe(
          tap(res=>{
            this.cachingService.cacheRequests(url,res);
          })
        );
    }

    paginate(options: PaginationOptions, forceRefresh?: boolean): Observable<any> {
        let tempResponse: PaginationResponse<EventFeed>;
        const url = this.genPaginationURL('',options);
        return this.getData(url,forceRefresh).pipe(
        switchMap((response)=>{
            tempResponse = response;
            return this.posts;
        }),
        take(1),
        map((events:EventFeed[])=>{
            if(options.page == 0){
            events = [];
            }
            events = (tempResponse.results.length > 0)? events.concat(tempResponse.results) : events;
            tempResponse.results = events;
            return tempResponse;
        }),
        tap((response:PaginationResponse<EventFeed>)=>{
            this._posts$.next(response.results);
        })
        )
    }

    create(event: Partial<EventFeed>): Observable<EventFeed[]> {
        let newEvent: EventFeed;
        return this.http.post(this._POST_URL,event).pipe(
            switchMap((response:EventFeed)=>{
                newEvent = response;
                return this.posts;
            }),
            take(1),
            map((events:EventFeed[])=>{
                events = events.concat(newEvent);
                return events;
            }),
            tap((events:EventFeed[])=>{
                this._posts$.next(events);
            })
        )
    }
}