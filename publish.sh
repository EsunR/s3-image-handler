aws lambda create-function --function-name S3ImageResize \
    --zip-file fileb://dist/function.zip --handler index.handler --runtime nodejs16.x \
    --timeout 10 --memory-size 1024 \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/Lambda_S3ImageReize
