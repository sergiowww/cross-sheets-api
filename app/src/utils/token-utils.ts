import {APIGatewayEventDefaultAuthorizerContext, APIGatewayProxyEventBase} from "aws-lambda";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";
import {jwtDecode} from "jwt-decode";

export function getBearerToken(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>): string {
    const [, bearerContent] = (event.headers['Authorization'] as string).split(' ');
    return bearerContent;
}

export function getJwtPayload(bearerContent: string): CognitoJwtPayload {
    return jwtDecode<CognitoJwtPayload>(bearerContent);
}

export function getJwtPayloadFromEvent(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>) {
    const bearerToken = getBearerToken(event);
    return getJwtPayload(bearerToken);
}