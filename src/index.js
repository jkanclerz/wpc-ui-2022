import {hello} from './hello'

import AWS from 'aws-sdk/global'

import {awsConfiguration} from './env.js'

import {register, confirmAccount, refreshSession, login, getCurrentUserId} from './auth.js'

import {listS3Content, uploadToS3, generatePresignedUrl} from './storage'
import {registerRequest, loginRequest, confirmAccountRequest} from './fixtures'

AWS.config.region = awsConfiguration.region;


const listMyBucketContentBtn = document.querySelector('button.listMyBucketContent');
listMyBucketContentBtn.addEventListener('click', () => {
    listS3Content()
        .then(items => console.log(items))
        .catch(err => console.log(err));
});

const uploadBtn = document.querySelector('button.uploadBtn');
const filesInput = document.querySelector('.upload input[name="files"]');
uploadBtn.addEventListener('click', () => {
    if (filesInput.files.length == 0) {
        return;
    }
    
    const filesToBeUploaded = [...filesInput.files];
    filesToBeUploaded.forEach((file, index) => {
        getCurrentUserId()
            .then(userId => uploadToS3(userId, file))
            .then(fileData => fileData.uniqueKey)
            .then(key => generatePresignedUrl(key))
            .then(url => console.log(url))
        ;
    });
});


const registerBtn = document.querySelector('button.registerBtn');
registerBtn.addEventListener('click', () => {
    register(registerRequest)
        .then(result => console.log(result))
        .catch(err => console.log(err))
});


const confirmBtn = document.querySelector('button.confirmBtn');
confirmBtn.addEventListener('click', () => {
    confirmAccount(confirmAccountRequest)
        .then(result => console.log('account confirmed'))
        .catch(err => console.log(err));
});

const loginBtn = document.querySelector('button.loginBtn');
loginBtn.addEventListener('click', () => {
    login(loginRequest)
        .then(result => console.log('Hello'))
        .catch(err => console.log(err));
});


/////   MAIN STAYS AS IT IS 
const showErrorToolTip = (message) => {
    console.log(message);
}

(() => {
    refreshSession()
        .then(() => console.log('session refreshed'))
        .catch((message) => showErrorToolTip(message));

    
    getCurrentUserId()
        .then(userId => console.log(`current userId: ${userId}`));
})();