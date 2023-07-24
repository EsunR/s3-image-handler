aws lambda update-function-code \
    --function-name S3ImageHandler_OriginResponse \
    --zip-file fileb://dist/origin-response.zip

aws lambda update-function-code \
    --function-name S3ImageHandler_ViewerRequest \
    --zip-file fileb://dist/viewer-request.zip
