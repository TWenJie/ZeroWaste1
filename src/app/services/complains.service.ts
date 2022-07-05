import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { switchMap, take, map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Complain } from "../interfaces/complain.interface";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class ComplainsService {
    
    private _COMPLAIN_URL = environment.serviceURI+'/complains';
    private _complains$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

    constructor(
        private http: HttpClient,
    ){

    }

    get complains(){
        return this._complains$.asObservable();
    }

    paginate(options:PaginationOptions){
        // const headers = this._headers;
        let temptResponse ;
        return this.http.get(this._COMPLAIN_URL,{
            params:{
                ...options
            },
        }).pipe(
            switchMap((response)=>{
                temptResponse = response;
                return this.complains;
            }),
            take(1),
            map((complains)=>{
                if(temptResponse.results.length > 0){
                    if(options.page == 0){
                        complains = [];
                    }
                    complains = complains.concat(temptResponse.results);
                }
                temptResponse.results = complains;
                return temptResponse;
            }),
            tap((response)=>{
                this._complains$.next(response.results);
            })
        )
    }

    create(complain: Partial<Complain>){
        let newComplain: Complain;
        return this.http.post(this._COMPLAIN_URL,complain,
        )
        .pipe(
            switchMap((response:Complain)=>{
                newComplain = response;
                return this.complains;
            }),
            take(1),
            map((complains:Complain[])=>{
                complains = complains.concat(newComplain);
                return complains;
            }),
            tap((complains:Complain[])=>{
                this._complains$.next(complains);
            })
        );
    }
}