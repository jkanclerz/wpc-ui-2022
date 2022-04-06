import {hello} from './hello'

import AWS from 'aws-sdk/global'

import {awsConfiguration} from './env.js'

import {register, confirmAccount, refreshSession, login, getCurrentUserId} from './auth.js'

import {listS3Content, uploadToS3, generatePresignedUrl} from './storage'
import {registerRequest, loginRequest, confirmAccountRequest} from './fixtures'

AWS.config.region = awsConfiguration.region;

var photos = [];

const addToOrder = (photoKey) => {
    photos = [...photos, photoKey];
    return photoKey;
}

const placeAnOrder = (orderRequest) => {
    return fetch(
        '/api/place-an-order',
        {
            method: 'POST',
            body: orderRequest
        });
}

const createHtmlEl = (templateAsString) => {
    var div = document.createElement('div');
    div.innerHTML = templateAsString.trim();
    return div.firstChild;
}

const addToPreview = (listEl, url) => {
    const template = `<li><img src="${url}" height="50"/></li>`;
    const liEl = createHtmlEl(template);
    listEl.appendChild(liEl);
}

const clearPreview = (listEl) => {
    listEl.innerHTML = '';
}

const listMyBucketContentBtn = document.querySelector('button.listMyBucketContent');
listMyBucketContentBtn.addEventListener('click', () => {
    listS3Content()
        .then(items => console.log(items))
        .catch(err => console.log(err));
});

const uploadBtn = document.querySelector('button.uploadBtn');
const filesInput = document.querySelector('.upload input[name="files"]');
const previewList = document.querySelector('.preview ul');
uploadBtn.addEventListener('click', () => {
    if (filesInput.files.length == 0) {
        return;
    }
    
    const filesToBeUploaded = [...filesInput.files];
    filesToBeUploaded.forEach((file, index) => {
        getCurrentUserId()
            .then(userId => uploadToS3(userId, file))
            .then(fileData => addToOrder(fileData.uniqueKey))
            .then(key => generatePresignedUrl(key))
            .then(url => addToPreview(previewList, url))
        ;
    });
});

const orderBtb = document.querySelector('button.orderAnimation');
orderBtb.addEventListener('click', () => {
    placeAnOrder({photos: photos, email: loginRequest.email})
        .then(() => console.log("you will receive it soon"))
        .catch(err => console.log('try again later'))
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
        .finally(() => {
            clearPreview(previewList);
        })
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