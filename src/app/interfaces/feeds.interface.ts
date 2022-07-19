import { UserProfile } from "./user.interface";

export interface Post {
    id:number;
    createdAt:Date,
    textContent: string;
    resources?: ImageUploadResponse[];
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

export interface EventFeed extends Post{
    eventType: string;
    isExpired: boolean;
}

export interface CreateFeed {
    textContent:string;
}

export interface EZWCFeed{
    id:number;
    createdAt:Date;
    textContent:string;
    resources?: ImageUploadResponse[];
    likesCount: number;
    commentsCount: number;
    author: UserProfile;
    liked?: any;
    dataStudioURL:string;
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

export interface UpdateEZWCFeedDto extends UpdateFeedValue{
    dataStudioURL:string;
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
    alt: string;
    // filename: string;
    // path: string;
    src: string;
}

export interface ImagesUploadResponse {
    savedResources: ImageUploadResponse[];
    errors: any[];
}