import { UserProfile } from "./user.interface";

export interface Post {
    id:number;
    createdAt:Date,
    textContent: string;
    resourceURL?:string [];
    approved:boolean;
    edited: boolean;
    likesCount: number;
    commentsCount: number;
    author: UserProfile;
    liked?: any;
    title?: string;
    startTime?: string;
    endTime?:string;
}

export interface Event extends Post{
    eventType: string;
    isExpired: boolean;
}

export interface CreateFeed {
    textContent:string;
}

export interface CreatePost extends CreateFeed {
    resourceURL? :string [];
}

export interface CreateEvent extends CreateFeed{
    title: string;
    eventType: string;
    startTime: Date;
    endTime?: Date;
    resourceURL? :string [];
}


export interface UpdateFeedValue {
    textContent: string;
}

export interface Comment {
    id:number;
    createdAt: Date;
    textContent: Date;
    isEdited: boolean;
    author: UserProfile;
    post : Post;
}

export interface Like{
    authorId:number;
    postId: number;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    post?: Post;
    author?: UserProfile;
}


export interface ErrorResponse {
    statusCode: number;
    message ?: string;
    error? : any;
}


/*
 *Need to change this when we done create multi upload function. 
*/
export interface ImageUploadResponse {
    id: number;
    url: string;
    ogname: string;
    filename: string;
    owner: UserProfile;
}

export interface ImagesUploadResponse {
    resourcesURL: string[];
}