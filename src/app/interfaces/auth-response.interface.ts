import { UserProfile } from "./user.interface";

export interface SigninResponse {
    id:number;
    email:string;
    isEmailVerified:boolean;
    role: string;
    profile: UserProfile;
    accessToken: string;
    refreshToken: string;
    tokenExpiresIn:Date;
}

export interface SignupResponse{
    id: number;
    email: string;
    isEmailVerified: boolean;
    role: string;
    profile: UserProfile;
    accessToken: string;
    tokenExpiresIn:Date;
}