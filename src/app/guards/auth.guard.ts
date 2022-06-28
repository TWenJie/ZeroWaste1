import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {

  constructor(
    private authService: AuthService,
    private router:Router,
  ){}

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      
      // check if loggedin
      return this.authService.isAuthed.pipe(
        take(1),
        switchMap((isAuthed:boolean)=>{
          //else try load local user using autologin
          if(!isAuthed) return this.authService.autoLogin();
          return of(isAuthed);
        }),
        map((isAuthed:boolean)=>{
          if(!isAuthed){
            this.router.navigateByUrl('welcome');
            return false;
          }
          return true;
        })
      )
  }
}