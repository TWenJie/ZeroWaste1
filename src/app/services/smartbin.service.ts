import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PaginationOptions, PaginationResponse } from '../interfaces/pagination.interface';
import { Smartbin } from '../interfaces/smartbin.interface';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root'
})
export class SmartbinService {

  private _isAgreedLocation  = false;
  private _API_URL = environment.serviceURI + '/smartbin';

  private _locations$: BehaviorSubject<Smartbin[]> = new BehaviorSubject<Smartbin[]>([]);

  constructor(
    private http: HttpClient,
    private cachingService: CachingService,
  ) { }

  get locations(){
    return this._locations$.asObservable();
  }

  get isAgree(){
    return this._isAgreedLocation;
  }

  set isAgree(confirmation: boolean){
    this._isAgreedLocation = confirmation;
  }

  getData(url:string,forceRefresh:boolean = false): Observable<any>{
    if(forceRefresh){
      return this.requestAndCache(url);
    }else{
      const storedValue =  from(this.cachingService.getCachedRequest(url));
      return storedValue.pipe(
        switchMap(result=>{
          if(!result) return this.requestAndCache(url);
          // console.log('Using Cached Data..');
          return of(result);
        })
      );
    } 
  }

  genPaginationURL(namespace,options):string{
    const url = `${this._API_URL}/${namespace}limit=${options.limit}&page=${options.page}`;
    return url;
  }

  requestAndCache(url):Observable<any>{
    return this.http.get(url).pipe(
      tap(res=>{
        this.cachingService.cacheRequests(url,res);
      })
    );
  }

  paginateLocations(options:PaginationOptions){
    let temptResponse: PaginationResponse <Smartbin>;
    const url = this.genPaginationURL('?',options);
    return this.getData(url).pipe(
        switchMap((response)=>{
            temptResponse = response;
            return this.locations;
        }),
        take(1),
        map((locations:Smartbin[])=>{
            if(options.page == 0){
                return temptResponse;
            }
            locations = (temptResponse.results.length > 0)? locations.concat(temptResponse.results) : locations ;
            temptResponse.results = locations;
            return temptResponse;
        }),
        tap((response)=>{
            this._locations$.next(response.results);
        })
    )
  }

  nearMe(coords:{lng:number,lat:number}, options:PaginationOptions){
    let temptResponse: PaginationResponse<Smartbin>;
    const url = this.genPaginationURL(`near?lng=${coords.lng}&lat=${coords.lat}&`,options);
    return this.getData(url).pipe(
        switchMap((response)=>{
            temptResponse = response;
            return this.locations;
        }),
        take(1),
        map((locations:Smartbin[])=>{
            if(options.page == 0){
                return temptResponse;
            }
            locations = (temptResponse.results.length > 0)? locations.concat(temptResponse.results) : locations ;
            temptResponse.results = locations;
            return temptResponse;
        }),
        tap((response)=>{
            this._locations$.next(response.results);
        })
    )
  }

  findNearMyLocation(options:PaginationOptions){
    return from (Geolocation.getCurrentPosition()).pipe(
      switchMap((geoData: Position)=>{
        const {longitude,latitude} = geoData.coords;
        return this.nearMe({lng:longitude,lat:latitude},options);
      })
    );
  }

  searchByName(name:string,options:PaginationOptions){
    let temptResponse: PaginationResponse<Smartbin>;
    const url = this.genPaginationURL(`places/?name=${name}&`,options);
    return this.getData(url).pipe(
        switchMap((response)=>{
            temptResponse = response;
            return this.locations;
        }),
        take(1),
        map((locations:Smartbin[])=>{
            if(options.page == 0){
                return temptResponse;
            }
            locations = (temptResponse.results.length > 0)? locations.concat(temptResponse.results) : locations ;
            temptResponse.results = locations;
            return temptResponse;
        }),
        tap((response)=>{
            this._locations$.next(response.results);
        })
    )
  }
}
