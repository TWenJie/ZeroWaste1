import { UserProfile } from "./user.interface";

export interface Complain {
    id?: number;
    createdAt?:Date;
    smartbinId: string;
    smartbinName:string,
    content?: string;
    status: ComplainStatus;
    complainType:ComplainTypes;
    author: UserProfile;
}

export enum ComplainStatus {
    Pending = 'Pending',
    Resolved = 'Resolved',
}

export enum ComplainTypes {
    Broken = 'Broken',
    Dirty = 'Dirty',
    Full = 'Full',
}