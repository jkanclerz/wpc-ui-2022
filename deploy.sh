#!/bin/bash

npx webpack --mode production

aws s3 sync ./dist s3://${MY_BUCKET} --acl=public-read