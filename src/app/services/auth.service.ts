// src/app/authentication/auth.service.ts - COMPLETE FIXED VERSION WITH SOLUTION 1

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
import { UpdatePasswordDto } from "../account/change-password-modal/change-password.component";

// ✅ ADD MONGODB SERVICE IMPORT
import { MongoDBService } from "../services/mongodb.service";

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
        private router: Router,
        // ✅ ADD MONGODB SERVICE INJECTION
        private mongoService: MongoDBService
    ) {
        console.log('🔐 AuthService initialized with MongoDB integration');
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
     * ✅ UPDATED LOGIN WITH MONGODB INTEGRATION
     */
    login(credentials:SigninRequest):Observable<SigninResponse>{
        console.log('🔐 Starting login process for:', credentials.email);
        
        return this.http.post<SigninResponse>(this._AUTH_URI+'/signin',credentials)
        .pipe(
          tap(async (response) => {
            // Original user data setting
            this.setUserData(response);
            
            // ✅ INTEGRATE WITH MONGODB - Set current user for assessments
            try {
              console.log('📊 Setting MongoDB user for assessments:', response.email);
              
              await this.mongoService.setCurrentUser({
                id: String(response.id), // ✅ Convert number to string
                email: response.email,
                username: response.profile?.userName || response.email.split('@')[0] // ✅ Use userName
              });
              
              console.log('✅ MongoDB user integration successful');
            } catch (error) {
              console.error('❌ MongoDB user integration failed:', error);
              // Don't fail the login if MongoDB integration fails
            }
          })
        );
    }

    /**
     * ✅ SOLUTION 1: COMPLETE SIGNUP FIX - No refreshToken assumptions
     */
    signup(credentials:SignupRequest): Observable<SignupResponse>{
        console.log('📝 Starting signup process for:', credentials.email);
        
        return this.http.post<SignupResponse>(
          this._AUTH_URI+'/signup',
          credentials
        ).pipe(
          tap(async (response) => {
            // ✅ SOLUTION 1: Handle signup response directly without setUserData
            try {
              console.log('📝 Processing signup response for:', response.email);
              
              // Calculate expiration time
              const tokenExpiresIn = response.tokenExpiresIn ? 
                new Date(new Date().getTime() + +response.tokenExpiresIn * 1000) : 
                new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
              
              // Create user directly from signup response
              const user = new User(
                response.id,
                response.email,
                response.isEmailVerified ?? false,
                response.role ?? 'user',
                response.profile ?? null,
                response.accessToken ?? '',
                '', // ✅ No refreshToken assumption - empty string
                tokenExpiresIn
              );

              // Store user data manually (same as setUserData but without refreshToken requirement)
              const jsonUser = JSON.stringify(user);
              await Storage.set({key:'AUTH_USER', value:jsonUser});
              await Storage.set({key:'ACCESS_TOKEN', value: user.accessToken});
              
              // ✅ Only set refresh token if it exists in response
              if ((response as any).refreshToken) {
                await Storage.set({key:'REFRESH_TOKEN', value: (response as any).refreshToken});
              }

              // Update reactive state
              this._user$.next(user);
              this._token = user.accessToken;
              
              console.log('✅ User signup data processed successfully');
              
            } catch (userError) {
              console.error('❌ Error processing user signup data:', userError);
            }
            
            // ✅ INTEGRATE WITH MONGODB - Register new user for assessments
            try {
              console.log('📊 Registering new MongoDB user for assessments:', response.email);
              
              await this.mongoService.registerUser(
                response.email,
                credentials.username || response.email.split('@')[0],
                credentials.password // Won't be stored in MongoDB, just for API consistency
              );
              
              console.log('✅ MongoDB user registration successful');
            } catch (mongoError) {
              console.error('❌ MongoDB user registration failed:', mongoError);
              // Don't fail the signup if MongoDB integration fails
            }
          })
        );
    }
    
    /**
     * ✅ UPDATED LOGOUT WITH MONGODB INTEGRATION
     */
    logout(){
        console.log('🔐 Starting logout process...');
        
        if(this._activeLogoutTimer){
          clearTimeout(this._activeLogoutTimer);
        }
        
        // Original logout logic
        this._user$.next(null);
        this._isAuthed$.next(false);
        this._token=null;
    
        Storage.remove({key:'AUTH_USER'}); 
        Storage.remove({key:'ACCESS_TOKEN'});
        Storage.remove({key:'REFRESH_TOKEN'});
        
        // ✅ INTEGRATE WITH MONGODB - Clear MongoDB user session
        try {
          this.mongoService.logout();
          console.log('✅ MongoDB user session cleared');
        } catch (error) {
          console.error('❌ MongoDB logout failed:', error);
        }
        
        return this.router.navigateByUrl('welcome');
    }

    /**
     * ✅ UPDATED AUTO LOGIN WITH MONGODB INTEGRATION - FIXED ASYNC ISSUE
     */
    autoLogin() : Observable<boolean>{
        console.log('🔐 Attempting auto login...');
        
        return from(Storage.get({
            key: 'AUTH_USER'
        })).pipe(
            switchMap(async (storedData) => { // ✅ Use switchMap for async operations
                if(!storedData || !storedData.value){
                    this._user$.next(null);
                    return false;
                }
                
                try {
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
                  
                  // ✅ INTEGRATE WITH MONGODB - Restore MongoDB user session
                  try {
                    console.log('📊 Restoring MongoDB user session for:', user.email);
                    
                    await this.mongoService.setCurrentUser({
                      id: String(user.id), // ✅ Convert number to string
                      email: user.email,
                      username: user.profile?.userName || user.email.split('@')[0] // ✅ Use userName
                    });
                    
                    console.log('✅ MongoDB user session restored');
                  } catch (error) {
                    console.error('❌ MongoDB session restoration failed:', error);
                  }
                  
                  return !!user;
                } catch (parseError) {
                  console.error('❌ Error parsing stored user data:', parseError);
                  this._user$.next(null);
                  return false;
                }
            })
        )
    }

    /**
     * ✅ NEW METHOD - Get current user info for MongoDB integration
     */
    getCurrentUserForMongoDB(): { id: string, email: string, username: string } | null {
        const currentUser = this._user$.value;
        if (!currentUser) {
            return null;
        }
        
        return {
            id: String(currentUser.id), // ✅ Convert number to string
            email: currentUser.email,
            username: currentUser.profile?.userName || currentUser.email.split('@')[0] // ✅ Use userName
        };
    }

    /**
     * ✅ NEW METHOD - Check if MongoDB integration is ready
     */
    isMongoDBIntegrationReady(): boolean {
        const currentUser = this._user$.value;
        const mongoUser = this.mongoService.getCurrentUser();
        
        return !!(currentUser && mongoUser && currentUser.email === mongoUser.email);
    }

    /**
     * ✅ NEW METHOD - Force MongoDB sync if needed
     */
    async syncWithMongoDB(): Promise<void> {
        const currentUser = this._user$.value;
        if (!currentUser) {
            console.log('⚠️ No current user to sync with MongoDB');
            return;
        }

        try {
            console.log('🔄 Force syncing with MongoDB for:', currentUser.email);
            
            await this.mongoService.setCurrentUser({
                id: String(currentUser.id), // ✅ Convert number to string
                email: currentUser.email,
                username: currentUser.profile?.userName || currentUser.email.split('@')[0] // ✅ Use userName
            });
            
            console.log('✅ MongoDB sync completed');
        } catch (error) {
            console.error('❌ MongoDB sync failed:', error);
            throw error;
        }
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
        return this.http.post(
          this._AUTH_URI+'/getCode',
          {},
          {
            observe:'response',
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
        return this.http.post(
          this._AUTH_URI+'/verifyCode',
          {
            ...credentials,
          },
          {
            observe: 'response',
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

    changePassword(credentials:UpdatePasswordDto): Observable<any>{
      return this.http.patch(
        this._AUTH_URI+'/password',
        credentials,
      )
    }

    /**
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
     * ✅ ORIGINAL setUserData - Used only for login (SigninResponse)
     */
    setUserData(responseData:SigninResponse){
        console.log('🔐 Setting user data for:', responseData.email);
        
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
        
        console.log('✅ User data set successfully');
    }

    ngOnDestroy(): void {
        console.log('🧹 AuthService cleanup...');
        if(this._activeLogoutTimer){
            clearTimeout(this._activeLogoutTimer);
        }
    }
}