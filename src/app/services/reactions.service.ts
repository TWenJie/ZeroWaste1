import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Comment, Like } from '../interfaces/feeds.interface';
import { PaginationOptions, PaginationResponse } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class ReactionsService {
  private _REACTION_URL = environment.serviceURI+ '/reactions';

  private _comments$: BehaviorSubject<Comment[]> = new BehaviorSubject<Comment[]>([]);
  private _likes$: BehaviorSubject<Like[]> = new BehaviorSubject<Like[]>([]);
  
  constructor(
    private http: HttpClient,
  ) { }

  like(postID:number){
    return this.http.post(
      `${this._REACTION_URL}/posts/${postID}/likes`,
      {},
    );
  }

  //status Code 202 Accepted
  unlike(postID:number){
    return this.http.delete(
      `${this._REACTION_URL}/posts/${postID}/likes`,
    );
  }

  get comments(){
    return this._comments$.asObservable();
  }

  paginateUserLikes(profileId:number,options:PaginationOptions){
    return this.http.get(
      this._REACTION_URL+`/profiles/${profileId}/likes`,{
        params: {
          ...options
        }
      }
    ).pipe(
      take(1),
      tap((response: PaginationResponse<Like>)=>{
        const {results} = response;
        this._likes$.next(results);
      })
    )
  }

  //get comments for the post
  paginateComments(postId:number,options:PaginationOptions){
    let tempComments: PaginationResponse<Comment>;
    return this.http.get<PaginationResponse<Comment>>(`${this._REACTION_URL}/posts/${postId}/comments`,
      {params: {
        ...options
      },
      // headers
    }
    ).pipe(
      switchMap((response:PaginationResponse<Comment>)=>{
        tempComments = response;
        return this.comments;
      }),
      take(1),
      map((comments:Comment[])=>{
       
          if(options.page == 0){
            comments = [];
          }
          comments = comments.concat(tempComments.results);
      
        tempComments.results = comments;
        return tempComments;
      }),
      tap((response:PaginationResponse<Comment>)=>{
        this._comments$.next(response.results);
      })
    );
  }

  createComment(postId:number,textContent:string){
    let tempComments: Comment;
    return this.http.post(
      `${this._REACTION_URL}/posts/${postId}/comments`,
      {
        textContent,
      },
    ).pipe(
      switchMap((response:Comment)=>{
        tempComments = response;
        return this.comments;
      }),
      take(1),
      map((comments:Comment[])=>{
        comments = comments.concat(tempComments);
        return comments;
      }),
      // take(1),
      tap((comments:Comment[])=>{
        this._comments$.next(comments);
      })
    )
  }

  deleteComment(commentId:number){
    return this.http.delete(
      `${this._REACTION_URL}/comments/${commentId}`,
    ).pipe(
      switchMap(response=>{
        return this.comments;
      }),
      take(1),
      map((comments:Comment[])=>{
        comments = comments.filter(f=>f.id !== commentId);
        return comments;
      }),
      // take(1),
      tap(posts=>{
        this._comments$.next(posts);
      })
    );
  }
  
}
