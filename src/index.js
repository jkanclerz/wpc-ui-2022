import {hello} from './hello'

import S3 from 'aws-sdk/clients/s3'
import AWS from 'aws-sdk/global'
import {CognitoIdentityCredentials} from 'aws-sdk/global'
import { uuid } from 'uuidv4';

import {authConfiguration, awsConfiguration} from './env.js'
import {
	CognitoUserPool,
	CognitoUserAttribute,
	CognitoUser,
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';




AWS.config.region = awsConfiguration.region;




const listMyBucketContentBtn = document.querySelector('button.listMyBucketContent');

listMyBucketContentBtn.addEventListener('click', () => {
    const s3 = new S3();
    s3.listObjectsV2({Bucket: 'wpc-kanclerj'}, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(data);
    })
});

const actionBtn = document.querySelector('button.myFirstActionBtn');
actionBtn.addEventListener('click', () => {
    hello('Kuba');
});


// User Registration




const poolData = {
    UserPoolId: authConfiguration.userPoolId,
    ClientId: authConfiguration.clientId,
}

const userPool = new CognitoUserPool(poolData);

const registerRequest = {
    email: 'glwdcfcicjwqwdgfdk@bvhrs.com',
    password: '1234qwer'
}

const confirAccountRequest = {
    code: '925206',
    email: registerRequest.email,
}

const loginRequest = {...registerRequest}

const registerBtn = document.querySelector('button.registerBtn');
registerBtn.addEventListener('click', () => {
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
                alert(err.message || JSON.stringify(err));
                return;
            }
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
        }
    )
});


const confirmBtn = document.querySelector('button.confirmBtn');
confirmBtn.addEventListener('click', () => {
    const cognitoUser = new CognitoUser({
        Username: confirAccountRequest.email,
        Pool: userPool
    });

    cognitoUser.confirmRegistration(
        confirAccountRequest.code,
        true,
        (err, result) => {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            console.log('call result: ' + result);
        }
    )
});

const loginBtn = document.querySelector('button.loginBtn');
loginBtn.addEventListener('click', () => {
    const cognitoUser = new CognitoUser({
        Username: confirAccountRequest.email,
        Pool: userPool
    });
    console.log(loginRequest);
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
        },
        onFailure: (err) => {
            alert(err.message || JSON.stringify(err));
        },
    })
});


const uploadBtn = document.querySelector('button.uploadBtn');
const filesInput = document.querySelector('.upload input[name="files"]');

const uploadToS3 = (userId, file) => {
    return new Promise((resolve, reject) => {
        const s3 = new S3();
        const uniqueFileKek = `uek-krakow/${userId}/uploaded/${uuid()}/${file.name}`;
        const params = {
            Body: file,
            Bucket: awsConfiguration.bucket,
            Key: uniqueFileKek
        };

        s3.putObject(params, (err, data) => {
            if (err) {
                reject(err);
            }
    
            resolve(uniqueFileKek);
        });
    });
}

uploadBtn.addEventListener('click', () => {
    if (filesInput.files.length == 0) {
        return;
    }
    
    const filesToBeUploaded = [...filesInput.files];
    filesToBeUploaded.forEach((file, index) => {
        getCurrentUserId()
            .then(userId => uploadToS3(userId, file))
            .then(myFilePath => console.log(myFilePath))
        ;
    });
});


const refreshSession = () => {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();

        if (cognitoUser == null) {
            reject("User is not authorized");
        }
        
        cognitoUser.getSession((err, session) => {
            if (err) {
                reject("User has invalid session");
            }
    
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: authConfiguration.identityPoolId,
                Logins: {
                    [authConfiguration.loginName]: session
                        .getIdToken()
                        .getJwtToken(),
                },
            });
    
            AWS.config.credentials.refresh(error => {
                if (error) {
                    reject("Can't refresh credentials")
                } else {
                    resolve();
                }
            });
        });
    });
}

const showErrorToolTip = (message) => {
    console.log(message);
}

const getCurrentUserId = () => {
    return refreshSession()
        .then(() => {
            return AWS.config.credentials.identityId;
        });
}

(() => {
    refreshSession()
        .then(() => console.log('session refreshed'))
        .catch((message) => showErrorToolTip(message));

    
    getCurrentUserId()
        .then(userId => console.log(`current userId: ${userId}`));
})();