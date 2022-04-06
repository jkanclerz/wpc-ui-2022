
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { awsConfiguration } from "./env";
import {getCredentials} from './auth';
import { uuid } from 'uuidv4';
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const getAuthenticatedS3 = async () => {
    const credentials = await getCredentials();

    const s3 = new S3Client({
        region: awsConfiguration.region,
        credentials: credentials
    });

    return s3;
}

export const uploadToS3 = async (userId, file) => {
    const s3 = await getAuthenticatedS3();

    const uniqueFileKek = `uek-krakow/${userId}/uploaded/${uuid()}/${file.name}`;

    const params = {
        Body: file,
        Bucket: awsConfiguration.bucket,
        Key: uniqueFileKek
    };
    const putObjectCommand = new PutObjectCommand(params);

    return s3.send(putObjectCommand)
        .then(response => {
            return {...response, uniqueKey: uniqueFileKek}
        })
}

export const listS3Content = async () => {
    const s3 = await getAuthenticatedS3();
    const command = new ListObjectsV2Command({
        Bucket: awsConfiguration.bucket
    })

    return s3.send(command);
}

export const generatePresignedUrl = async (key) => {
    const s3 = await getAuthenticatedS3();
    const getObject = new GetObjectCommand({
        Bucket: awsConfiguration.bucket,
        Key: key
    });

    return await getSignedUrl(s3, getObject, {expiresIn: 3600 });
}
