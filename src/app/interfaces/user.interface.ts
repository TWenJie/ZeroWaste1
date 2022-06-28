
export interface AuthedUser{
    id: number;
    email: string;
    _isEmailVerified: boolean;
    _role: string;
    _profile: UserProfile;
    _accessToken: string;
    _refreshToken?: string;
    _tokenExpiresIn? : Date;
}

export interface UserProfile {
    id: number;
    fullName: string;
    userName: string;
    bio?: string;
    matricId?: string;
    phone?: string;
    avatar: string;
}