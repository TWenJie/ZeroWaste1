export interface SignupRequest{
    email:string;
    username: string;
    password: string;
}

export interface SigninRequest{
    email:string;
    password:string;
}

export interface VerifycodeRequest{
    code:string;
}