import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve } from "@angular/router";
import { Post } from "../interfaces/feeds.interface";
import { FeedsService } from "./feeds.service";

@Injectable({
    providedIn: 'root',
})
export class PostResolverService implements Resolve<Post>{
    constructor(
        private feedsService: FeedsService
    ){}

    resolve(route: ActivatedRouteSnapshot){
        let id = route.paramMap.get('id');
        return this.feedsService.post(+id);
    }
}