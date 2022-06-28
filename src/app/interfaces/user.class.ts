import { AuthedUser, UserProfile } from "./user.interface";

export class User implements AuthedUser{
    constructor(
        public id :number,
        public email :string,
        public _isEmailVerified: boolean,
        public _role : string,
        public _profile : UserProfile,
        public _accessToken: string,
        public _refreshToken: string,
        public _tokenExpiresIn: Date
    ){}

    get accessToken(){
        if(!this._tokenExpiresIn || this._tokenExpiresIn <= new Date()) return null;
        return this._accessToken;
    }

    get refreshToken(){
        return this._refreshToken;
    }

    get isEmailVerified(){
        return this._isEmailVerified;
    }

    get role(){
        return this._role;
    }

    get profile(){
        return this._profile;
    }

    get tokenExpiresIn(){
        if(!this._tokenExpiresIn) return 0;
        return new Date(this._tokenExpiresIn).getTime() - new Date().getTime();
    }

    set accessToken(token){
        this._accessToken = token;
    }

    set tokenExpiresIn(time:any){
        this._tokenExpiresIn = time;
    }
}