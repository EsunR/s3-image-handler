ZIP_FILE="dist/function.zip"
FUNCTION_NAMES="S3ImageResize_RequestHandler S3ImageResize_ResponseHandler"

for FUNCTION_NAME in $FUNCTION_NAMES; do
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$ZIP_FILE
done
