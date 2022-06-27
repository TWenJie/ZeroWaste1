import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { map } from 'rxjs/operators';

import {Storage} from '@capacitor/storage';

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {

    private _AUTH_URI = `${environment.serviceURI}/auth`;
    private _isAuthed$ : BehaviorSubject <boolean> = new BehaviorSubject<boolean>(false);
    private _user$ : BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private _token: string; 
    private _activeLogoutTimer: any;


    constructor(
        private http: HttpClient,
        private router: Router
    ) {

    }

    /**
     * Basic Setters and Getters
     */

    get user(){
        return this._user$.asObservable();
    }

    get isAuthed(): Observable<boolean> {
        return this._user$.asObservable().pipe(
            map((user:any)=>{
                if(!user) return false;
                const accessToken = user.accessToken;
                this._token = accessToken;
                return !!accessToken; //cast to boolean
            })
        )
    }

    get token() {
        return this._token;
    }

    set token(accessToken:string){
        this._token = accessToken;
    }

    /**
     * Auto Login, get stored cookies, containing user object,
     * then load into this._user$ and this._token;
     */

    // autoLogin() : Observable<boolean>{
    //     // return from (Sto)
    //     // return true;
    // }

    ngOnDestroy(): void {
        
    }
}