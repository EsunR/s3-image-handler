const {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} = require("@aws-sdk/client-s3");
const { errorResponse: _errorResponse } = require("../utils/response");
const { imageTransfer } = require("../utils/image");
const { IMAGE_OPERATION_SPLIT } = require("../utils/constance");

const { BUCKET } = process.env;

/**
 * CloudFront event handler
 * @param {Object} event
 * @param {S3Client} s3Client
 * @returns
 */
async function cfHandler(event, s3Client) {
    const cfEvent = event.Records[0].cf;
    const response = cfEvent.response;
    const errorResponse = async (body, statusCode = 400) => {
        return await _errorResponse(body, statusCode, {
            eventType: "cf",
            response,
        });
    };
    // 如果能够正确处理资源，则正常返回数据
    if (response.status !== "403") {
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "not-modified",
            },
        ];
        return response;
    }
    // 获取查询的文件
    let query = cfEvent.request.uri;
    if (query.startsWith("/")) {
        query = query.slice(1);
    }
    const fileName = query.split("/")[query.split("/").length - 1];
    if (!fileName) {
        return errorResponse("Missing file name");
    }
    if (fileName.split(IMAGE_OPERATION_SPLIT).length < 2) {
        return errorResponse("Missing image operation");
    }
    const operationString = fileName.slice(
        fileName.match(new RegExp(IMAGE_OPERATION_SPLIT)).index
    );
    console.log("operationString: ", operationString);
    const originFileName = fileName.split(IMAGE_OPERATION_SPLIT)[0];
    console.log("originFileName: ", originFileName);
    const originFilePath = query.split(fileName)[0] + originFileName;
    console.log("originFilePath: ", originFilePath);

    try {
        const downloadStart = Date.now();
        const originImage = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET,
                Key: originFilePath,
            })
        );
        const imageBuffer = await originImage.Body.transformToByteArray();
        console.log("Download time: ", Date.now() - downloadStart, "ms");

        const transStart = Date.now();
        const { buffer: transformedImageBuffer, contentType } =
            await imageTransfer(imageBuffer, operationString, {
                requestHeaders,
            });
        console.log("Transform time: ", Date.now() - transStart, "ms");

        s3Client.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: query,
                Body: transformedImageBuffer,
                ContentType: contentType,
            })
        );

        response.status = "200";
        response.statusDescription = "OK";
        response.body = transformedImageBuffer;
        response.headers["content-type"] = [
            {
                key: "Content-Type",
                value: contentType,
            },
        ];
        response.headers["content-length"] = [
            {
                key: "Content-Length",
                value: transformedImageBuffer.length.toString(),
            },
        ];
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "success",
            },
        ];
        return response;
    } catch (e) {
        console.log("Exception:\n", e);
        return errorResponse("Exception: " + e.message, e.statusCode || 400);
    }
}

module.exports = cfHandler;
