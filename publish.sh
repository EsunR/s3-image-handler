runtime="nodejs18.x"
role_arn="arn:aws:iam::$AWS_ACCOUNT_ID:role/Lambda_S3ImageHandler"
fucntion_hander="index.handler"

aws lambda create-function \
    --function-name S3ImageHandler_OriginResponse \
    --zip-file fileb://dist/origin-response.zip \
    --handler $fucntion_hander \
    --runtime $runtime \
    --timeout 20 \
    --memory-size 1024 \
    --role $role_arn

aws lambda create-function \
    --function-name S3ImageHandler_ViewerRequest \
    --zip-file fileb://dist/viewer-request.zip \
    --handler $fucntion_hander \
    --runtime $runtime \
    --timeout 5 \
    --memory-size 128 \
    --role $role_arn