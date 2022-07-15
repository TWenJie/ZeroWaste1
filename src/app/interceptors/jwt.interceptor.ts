import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, filter, finalize, switchMap, take } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { AuthService } from "../services/auth.service";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    private _token$ : BehaviorSubject<string> = new BehaviorSubject<string>(null);
    counter = 0;
    isRefreshing = false;
    constructor(
        private authService: AuthService,
        private toastCtrl: ToastController,
    ){}
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        
        /* 
         check if public URL, if public url, then we return the req, nothing to modify.
         else, add JWT token to header, if the request return an error of
         401 - authorized, then we call authService.refreshAccessToken, to get new token.
         if still cannot, so it means our rf token is invalid, we simply logout our user.
        */
        //  console.log('inside_interceptor');
         if(this.isPublicRoutes(req.url)){
            return next.handle(req);
        }

        return next.handle(this.attachTokenToHeader(req)).pipe(
            catchError(err=>{
                if(err instanceof HttpErrorResponse){
                    switch(err.status){
                        case 400:
                            return this.error400Handler(err);
                        case 401:
                            return this.error401Handler(req,next);
                        default:
                            return throwError(err);
                    }
                }
                return throwError(err);
            })
        );
    }

    private isPublicRoutes(url:string): Boolean {
        if( url == `${environment.serviceURI}/auth/signin` || 
            url == `${environment.serviceURI}/auth/signup` ||
            url == `${environment.serviceURI}/auth/refresh`

        ){
            return true;
        }
        return false;
    }

    private attachTokenToHeader(req: HttpRequest<any>): HttpRequest<any>{

        if(this.authService.token){
            // console.log('token_to_attach:',this.authService.token)
            const headers = new HttpHeaders({
                'Accept':'application/json',
                'Authorization' : 'Bearer ' + this.authService.token
            })
            return req.clone({
                headers: headers,
            });
        }
        return req;
    }

    private async  error400Handler(err){
        const toast = await this.toastCtrl.create({
            message: err.message ?? '400 - Bad Request',
            duration: 5000,
        });
        toast.present();
        return of(null);
    }

    private error401Handler(req: HttpRequest<any>,next:HttpHandler){
        //if access token expired, we get a new token. 
        if(!this.isRefreshing) {
            this._token$.next(null);
            // this.authService.token = null;
            this.isRefreshing = true; //block refreshing;

            return this.authService.getNewAccessToken().pipe(
                switchMap((response)=>{
                    const accessToken = response?.accessToken;
                    // console.log('received_newToken:',accessToken);
                    if(accessToken) {
                        return this.authService.setAccessToken(accessToken).pipe(
                            switchMap(_=>{
                                this._token$.next(accessToken);
                                return next.handle(this.attachTokenToHeader(req));
                            })
                        );
                    }
                    //we cannot get new token;
                   this.authService.logout();
                   return of(null)
                }),
                catchError(err=>{
                    // console.log('Get new token Error:',err);
                    if( err instanceof HttpErrorResponse){
                        if( err.status == 401){
                            this.authService.logout();
                        }
                    }
                    return of('unable to refresh');
                }),
                finalize(()=>{
                    // console.log('finalized...');
                    this.isRefreshing = false;
                })
            );
        }
        // console.log('not refreshing')
        return this._token$.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token=>{
                // console.log('_token__++',token)
                return next.handle(this.attachTokenToHeader(req));
            }),catchError(err=>{
                // console.error('erro_waitr',err);
                return throwError(err);
            }),
            finalize(()=>{
                this.isRefreshing = false;
            })
        )
    }
    
}