import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ImagesUploadResponse, ImageUploadResponse, Post, UpdateFeedValue } from '../interfaces/feeds.interface';
import { PaginationOptions, PaginationResponse } from '../interfaces/pagination.interface';
import { CachingService } from './caching.service';

@Injectable({
  providedIn: 'root'
})
export class FeedsService {
  protected _POST_URL = environment.serviceURI+'/posts';
  protected _IMGUPLOAD_URL = environment.serviceURI + '/media';

  protected _posts$ : BehaviorSubject<Post[]> = new BehaviorSubject<Post[]>([]);
  constructor(
    private http: HttpClient,
    private cachingService: CachingService,
  ) { }


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

  paginate(options: PaginationOptions, forceRefresh: boolean = false) : Observable<any> {
    let tempResponse: PaginationResponse<Post>;
    const url = this.genPaginationURL('',options);
    return this.getData(url,forceRefresh).pipe(
      switchMap((response: PaginationResponse<Post>)=>{
        tempResponse = response;
        return this.posts;
      }),
      take(1),
      map((posts:Post[])=>{
        if(options.page == 0){
          posts = [];
        }
        posts = (tempResponse.results.length > 0)? posts.concat(tempResponse.results) : posts;
        tempResponse.results = posts;
        return tempResponse;
      }),
      tap((response: PaginationResponse<Post>)=>{
        this._posts$.next(response.results); //unessesary but jut do it incase need.
      })
    )
  }

  post(id:number){
    return this.posts.pipe(
      map((posts:Post[])=>{
        return {
          ...posts.find(p=>p.id==id)
        }
      })
    )
  }

  uploadImage(image:File){
    const formData = new FormData();
    formData.append('image',image);
    // const headers = this._headers;
    return this.http.post<ImageUploadResponse>(
      this._IMGUPLOAD_URL+'/upload/images/posts',
      formData,
      // {headers}
    )
  }

  uploadImages(images:File[]){
    const formData = new FormData();
    // formData.append('image',image);
    for(let i = 0; i < images.length; i++){
      formData.append(images[i].name,images[i]);
    }

    return this.http.post<ImagesUploadResponse>(
      this._IMGUPLOAD_URL+'/upload/images/posts',
      formData,
    )
  }

  create(post:Partial<Post>){
    let newPost: Post;
    return this.http.post(this._POST_URL,post,)
    .pipe(
      switchMap((response:Post)=>{
        newPost = response;
        return this.posts;
      }),
      take(1),
      map((posts:Post[])=>{
        posts = posts.concat(newPost);
        // this._posts$.next(posts);
        return posts;
      }),
      // take(1),
      tap(posts=>{
        this._posts$.next(posts);
      })
    );
  }

  edit(id:number,updateValue: UpdateFeedValue){
    return this.http.patch(
      `${this._POST_URL}/${id}`,updateValue)
      .pipe(
        switchMap((response:any)=>{
          if(response?.affected < 1){
            throw new Error('Failed to update!');
          }
          return this.posts;
        }),
        // take(1),
        map((posts:Post[])=>{
          const postIndex = posts.findIndex(f=>f.id==id);
          const oldPost = posts[postIndex];
          Object.assign(oldPost,updateValue);
          posts[postIndex] = oldPost;
          // this._posts$.next(posts);
          return posts;
        }),
        take(1),
        tap(posts=>{
          this._posts$.next(posts);
        }
      )
    );
  }

  approve(id:number){
    return this.http.patch(
      `${this._POST_URL}/${id}/approve`,{approved:true},
    ).pipe(
      switchMap((response:any)=>{
        if(response?.affected < 1){
          throw new Error('Failed to approve post!');
        }
        return this.posts;
      }),
      // take(1),
      //what we receive here is in context of unapproved posts
      map((posts:Post[])=>{
        //we simple remove the approved post from this list of unapproved posts
        posts = posts.filter(p=>p.id !== id);
        return posts;
      }),
      take(1),
      tap(posts=>{
        this._posts$.next(posts);
      })

    );
  }

  remove(id:number){
    return this.http.delete(
      `${this._POST_URL}/${id}`,
    ).pipe(
      switchMap(response=>{

        return this.posts;
      }),
      // take(1),
      map((posts:Post[])=>{
        posts = posts.filter(f=>f.id !== id);
        return posts;
      }),
      take(1),
      tap(posts=>{
        this._posts$.next(posts);
      })
    );
  }
}
