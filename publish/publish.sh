zip_file="fileb://dist/function.zip"
runtime="nodejs16.x"
timeout=10
memory_size=1024
role_arn="arn:aws:iam::$AWS_ACCOUNT_ID:role/Lambda_S3ImageReize"

aws lambda create-function \
    --function-name S3ImageResize_RequestHandler \
    --zip-file $zip_file \
    --handler request.handler \
    --runtime $runtime \
    --timeout $timeout \
    --memory-size $memory_size \
    --role $role_arn

aws lambda create-function \
    --function-name S3ImageResize_ResponseHandler \
    --zip-file $zip_file \
    --handler response.handler \
    --runtime $runtime \
    --timeout $timeout \
    --memory-size $memory_size \
    --role $role_arn