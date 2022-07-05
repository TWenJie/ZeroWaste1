import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Device } from '@capacitor/device';


@Injectable({
    providedIn: 'root'
})
export class AnalyticsService{
    private _ANALYTICS_URL = environment.serviceURI+ '/analytics';

    constructor(
        private http: HttpClient,
    ){
    }

    profileCountsSummary(){
        return this.http.get<ActivityCountsResponse>(
            this._ANALYTICS_URL + '/counts-summary/profile',
        )
    }

    logEvent(newEvent:CreateEventLogDto){
        // const headers = this._headers;
        return this.http.post(
            this._ANALYTICS_URL + '/events/feed',
            {
                ...newEvent,
            },
        );
    }

    logSmartbinEvent(newEvent:CreateSmartbinEventLogDto){
        // const headers = this._headers;
        return this.http.post(
            this._ANALYTICS_URL + '/events/smartbin',
            {
                ...newEvent,
            },
        );
    }

    async createSession(){
        // const headers = this._headers;
        const {uuid} = await Device.getId();
        const {model,platform,...info} = await Device.getInfo();
        console.log('uuid:',uuid);
        // console.log('Device_info:',info);

        return this.http.post(
            this._ANALYTICS_URL + '/sessions',
            {
                uuid,
                deviceModel: model,
                devicePlatform: platform,
                ...info,
            },

        ).toPromise();
    }
}

export interface ActivityCountsResponse{
    profileContent:{
        likesCount: number;
        commentsCount: number;
        postsCount: number;
    },
    feedActivityEvents: any[];
    smartbinActivityEvents: any[];
}

export interface CreateEventLogDto{
    sourceId: number;
    value?:string;
    eventType: FeedEventTypes;
}

export interface CreateSmartbinEventLogDto{
    sourceId:string,
    value?:string;
    eventType: SmartBinEventTypes
}

export enum SmartBinEventTypes{
    ViewLocation = 'View Location',
    SearchLocation = 'Search Location',
    CreateComplain = 'Report Problems',
    PaginateList = 'Scroll List',
}

export enum FeedEventTypes{
    ViewAPost = "View Post",
    ViewEvent = "View Calendar",
    LikePost = "Like Post",
    ClickLink = "Click Links",
    CreatePost = "Create Post",
    CreateComment = "Comment",
    WatchVideo = "Watch Video",
    PaginateList = 'Scroll List',
}