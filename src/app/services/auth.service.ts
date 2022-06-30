import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { environment } from "src/environments/environment";
import { map, switchMap, tap } from 'rxjs/operators';

import {Storage} from '@capacitor/storage';
import { User } from "../interfaces/user.class";
import { SigninRequest, SignupRequest, VerifycodeRequest } from "../interfaces/auth-request.interface";
import { SigninResponse, SignupResponse } from "../interfaces/auth-response.interface";

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {

    private _AUTH_URI = `${environment.serviceURI}/auth`;
    private _isAuthed$ : BehaviorSubject <boolean> = new BehaviorSubject<boolean>(false);
    private _user$ : BehaviorSubject<User> = new BehaviorSubject<User>(null);
    private _token: string = null; 
    private _activeLogoutTimer: any;


    constructor(
        private http: HttpClient,
        private router: Router
    ) {

    }

    /**
     * Basic Setters and Getters
     */

    get user() : Observable<User>{
        return this._user$.asObservable();
    }

    get token() : string{
        return this._token
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

    /**
     * Basic signin, signout and signup
     */
    login(credentials:SigninRequest):Observable<SigninResponse>{
        return this.http.post<SigninResponse>(this._AUTH_URI+'/signin',credentials)
        .pipe(
          tap(this.setUserData.bind(this))
        );
    }

    signup(credentials:SignupRequest): Observable<SignupResponse>{
        return this.http.post<SignupResponse>(
          this._AUTH_URI+'/signup',
          credentials
        ).pipe(
          tap(this.setUserData.bind(this))
        );
    }
    
    logout(){
        // console.log('Log out...:')
        if(this._activeLogoutTimer){
          clearTimeout(this._activeLogoutTimer);
        }
        this._user$.next(null);
        this._isAuthed$.next(false);
        this._token=null;
    
        Storage.remove({key:'AUTH_USER'}); 
        Storage.remove({key:'ACCESS_TOKEN'});
        Storage.remove({key:'REFRESH_TOKEN'});
        return this.router.navigateByUrl('welcome');
    }

    /**
     * Auto Login, get stored cookies, containing user object,
     * then load into this._user$ and this._token;
     */

    autoLogin() : Observable<boolean>{
        return from(Storage.get({
            key: 'AUTH_USER'
        })).pipe(
            map((storedData)=>{
                if(!storedData || !storedData.value){
                    this._user$.next(null);
                    return false;
                }
                //else create user and return true;
                const storedUser = JSON.parse(storedData.value) as User;
                const user = new User(
                    storedUser.id,
                    storedUser.email,
                    storedUser._isEmailVerified,
                    storedUser._role,
                    storedUser._profile,
                    storedUser._accessToken,
                    storedUser._refreshToken,
                    storedUser._tokenExpiresIn
                );
                const expiredIn = user.tokenExpiresIn;
                this._user$.next(user);
                this._token=user.accessToken;
                return !!user;
            })
        )
    }

    /**
     * Log user out after certain period of time.
     * make use of tokenExpiresIn value to auto logout user.
     * @param duration 
     */


    autoLogout(duration:number){
        if(this._activeLogoutTimer){
          clearTimeout(this._activeLogoutTimer);
        }
        this._activeLogoutTimer = setTimeout(()=>{
          this.logout();
        },duration)
    }

    /**
     * Account verification process, request verification code to email, 
     * and verify it.
     */
    getCode():Observable<boolean>{
        // console.log('token:',this.token);
    
        // const headers = this.httpHeader
        // console.log('Get_code_header:',headers);
        return this.http.post(
          this._AUTH_URI+'/getCode',
          {},
          {
            observe:'response',
            // headers
          }
        ).pipe(
          map((response)=>{
            const responseStatus = response.status;
            if(responseStatus == 200){
              return true;
            }
            return false;
          })
        )
    }
    
    verifyCode(credentials:VerifycodeRequest):Observable<boolean>{
        //200 == success
        // const headers = this.httpHeader;
        return this.http.post(
          this._AUTH_URI+'/verifyCode',
          {
            ...credentials,
          },
          {
            observe: 'response',
            // headers
          }
        ).pipe(
          map((response)=>{
            const responseStatus = response.status;
            if(responseStatus == 200){
              return true;
            }
            return false;
          })
        )
    }

    /**
     * 
     * Token management, refresh and set new accessToken
     */

    getNewAccessToken(){
        return from (Storage.get({
            key: 'REFRESH_TOKEN'
        })).pipe(
            switchMap((storedToken)=>{
                if(storedToken && storedToken.value){
                    return this.http.post<{
                        accessToken:string,
                        tokenExpiresIn: string
                    }>(`${this._AUTH_URI}/refresh`,{refresh_token: storedToken.value});
                }else {
                    return of(null);
                }
            })
        );
    }


    setAccessToken(token:string){
        return this._user$.pipe(
            tap(user=>{
                if(user){
                    user.accessToken = token;
                    this._token=token;
                    return from (Storage.set({key:'ACCESS_TOKEN',value: token}));
                }
            })
        );
    }

    /**
     * Storage Management, stored, data to local storage.
     */

    setUserData(responseData:SigninResponse){
        const expiredTime = responseData.tokenExpiresIn;
        const expirationTime = new Date(new Date().getTime()+ +expiredTime *1000);
        
        const user = new User(
            responseData.id,
            responseData.email,
            responseData.isEmailVerified,
            responseData.role,
            responseData.profile,
            responseData.accessToken,
            responseData?.refreshToken,
            expirationTime
          );

        const jsonUser = JSON.stringify(user);
        Storage.set({key:'AUTH_USER',value:jsonUser})
        Storage.set({key:'ACCESS_TOKEN',value:user.accessToken});
        Storage.set({key:'REFRESH_TOKEN',value:user.refreshToken});

        const expiredIn = user.tokenExpiresIn;
        this._user$.next(user);
    }



    ngOnDestroy(): void {
        if(this._activeLogoutTimer){
            clearTimeout(this._activeLogoutTimer);
        }
    }
}