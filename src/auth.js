import AWS from 'aws-sdk/global'

import {
	CognitoUserPool,
	CognitoUserAttribute,
	CognitoUser,
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';

import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"

import { awsConfiguration, authConfiguration } from "./env";

const poolData = {
    UserPoolId: authConfiguration.userPoolId,
    ClientId: authConfiguration.clientId,
}

const userPool = new CognitoUserPool(poolData);

export const register = (registerRequest) => {
    return new Promise((resolve, reject) => {
        userPool.signUp(
            registerRequest.email,
            registerRequest.password,
            [
                new CognitoUserAttribute({
                    Name: 'website',
                    Value: 'http://jkan.pl'
                })
            ],
            null,
            (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            }
        )
    })
}

export const confirmAccount = (confirmAccountRequest) => {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: confirmAccountRequest.email,
            Pool: userPool
        });
    
        cognitoUser.confirmRegistration(
            confirmAccountRequest.code,
            true,
            (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve();
            }
        )
    })
}

export const refreshSession = () => {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();

        if (cognitoUser == null) {
            reject("User is not authorized");
        }
        
        cognitoUser.getSession((err, session) => {
            if (err) {
                reject("User has invalid session");
            }

            const idJwtToken = session
                .getIdToken()
                .getJwtToken();
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: authConfiguration.identityPoolId,
                Logins: {
                    [authConfiguration.loginName]: idJwtToken,
                },
            });
    
            AWS.config.credentials.refresh(error => {
                if (error) {
                    reject("Can't refresh credentials")
                } else {
                    resolve(idJwtToken);
                }
            });
        });
    });
}

export const login = (loginRequest) => {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: loginRequest.email,
            Pool: userPool
        });
        cognitoUser.authenticateUser(new AuthenticationDetails({
            Username: loginRequest.email,
            Password: loginRequest.password,
        }), {
            onSuccess: (result) => {
                const accessToken = result.getIdToken().getJwtToken();
                
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: authConfiguration.identityPoolId,
                    Logins: {
                        [authConfiguration.loginName]: result
                            .getIdToken()
                            .getJwtToken(),
                    },
                });
    
                AWS.config.credentials.refresh(error => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Successfully logged!');
                    }
                });
                resolve(result);
            },
            onFailure: (err) => reject(err)
        })
    });
}

export const getCurrentUserId = () => {
    return refreshSession()
        .then(() => {
            return AWS.config.credentials.identityId;
        });
}

export const getCredentials = () => {
    return refreshSession()
    .then(token => createCognitoCredentials(token));
}

const createCognitoCredentials = (token) => {
    return fromCognitoIdentityPool({
        clientConfig: {region: awsConfiguration.region},
        identityPoolId: authConfiguration.identityPoolId,
        logins: {
            [authConfiguration.loginName]: token
        }
    })
}




