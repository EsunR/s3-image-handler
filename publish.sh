runtime="nodejs18.x"
timeout=10
memory_size=1024
role_arn="arn:aws:iam::$AWS_ACCOUNT_ID:role/Lambda_S3ImageReize"
fucntion_hander="index.handler"

aws lambda create-function \
    --function-name S3ImageHandler_OriginResponse \
    --zip-file fileb://dist/origin-response.zip \
    --handler $fucntion_hander \
    --runtime $runtime \
    --timeout $timeout \
    --memory-size $memory_size \
    --role $role_arn

aws lambda create-function \
    --function-name S3ImageHandler_ViewerRequest \
    --zip-file fileb://dist/viewer-request.zip \
    --handler $fucntion_hander \
    --runtime $runtime \
    --timeout $timeout \
    --memory-size $memory_size \
    --role $role_arn