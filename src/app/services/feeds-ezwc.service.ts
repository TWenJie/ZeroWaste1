import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, from, Observable, of } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { EZWCFeed, UpdateEZWCFeedDto } from "../interfaces/feeds.interface";
import { PaginationOptions, PaginationResponse } from "../interfaces/pagination.interface";
import { CachingService } from "./caching.service";

@Injectable({
    providedIn: 'root'
})
export class FeedsEZWCService{
    private _API_URL = environment.serviceURI + '/posts/ezwc';

    protected _feeds$: BehaviorSubject<any[]> = new BehaviorSubject([]);
    
    constructor(
        protected http: HttpClient,
        protected cachingService: CachingService,
    ){}

    get feeds() {
        return this._feeds$.asObservable();
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
        const url = `${this._API_URL}/${namespace}?limit=${options.limit}&page=${options.page}`;
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
        let tempResponse: PaginationResponse<EZWCFeed>;
        const url = this.genPaginationURL('',options);
        return this.getData(url,forceRefresh).pipe(
        switchMap((response)=>{
            tempResponse = response;
            return this.feeds;
        }),
        take(1),
        map((ezwcFeed:EZWCFeed[])=>{
            if(options.page == 0){
            ezwcFeed = [];
            }
            ezwcFeed = (tempResponse.results.length > 0)? ezwcFeed.concat(tempResponse.results) : ezwcFeed;
            tempResponse.results = ezwcFeed;
            return tempResponse;
        }),
        tap((response:PaginationResponse<EZWCFeed>)=>{
            this._feeds$.next(response.results);
        })
        )
    }

    create(feeds: Partial<EZWCFeed>): Observable<EZWCFeed[]> {
        let newFeed: EZWCFeed;
        return this.http.post(this._API_URL,feeds).pipe(
            switchMap((response:EZWCFeed)=>{
                newFeed = response;
                return this.feeds;
            }),
            take(1),
            map((feeds:EZWCFeed[])=>{
                feeds = feeds.concat(newFeed);
                return feeds;
            }),
            tap((feeds:EZWCFeed[])=>{
                this._feeds$.next(feeds);
            })
        )
    }


    update(id:number, values: UpdateEZWCFeedDto): Observable<EZWCFeed[]>{
        return this.http.patch(
            `${this._API_URL}/${id}`,
            values
        ).pipe(
            switchMap((response:any)=>{
                if(response?.affected < 1){
                    throw new Error("Update feeds failed!");
                }
                return this.feeds;
            }),
            map((feeds:EZWCFeed[])=>{
                const feedIndex = feeds.findIndex(f=>f.id==id);
                const oldFeed = feeds[feedIndex];
                Object.assign(oldFeed,values);
                feeds[feedIndex] = oldFeed;
                return feeds;
            }),
            take(1),
            tap((feeds: EZWCFeed[])=>{
                this._feeds$.next(feeds);
            })
        );
    }
}