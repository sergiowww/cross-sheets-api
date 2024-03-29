import {JwtPayload} from "jwt-decode";

export interface CognitoJwtPayload extends JwtPayload {
    ['cognito:preferred_role']: string;
    ['cognito:username']: string;
    email: string;
}