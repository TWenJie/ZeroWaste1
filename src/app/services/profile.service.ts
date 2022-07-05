import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root',
})
export class ProfileService{
    private _PROFILE_URL = environment.serviceURI+ '/profiles';
    constructor(
        private http:HttpClient,
    ){}

    update(info: UpdateProfile ){
        return this.http.patch(
            this._PROFILE_URL,
            {
                ...info
            }
        )
    }
}

export interface UpdateProfile{
    fullname?:string;
    matricId?:string;
    phone?:string;
    bio?:string;
    avatar?:string;
}