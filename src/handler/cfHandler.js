const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { errorResponse: _errorResponse } = require("../utils/response");
const { imageTransfer } = require("../utils/image");
const { IMAGE_OPERATION_SPLIT } = require("../utils/constance");
const {
    transformCfEventRequestHeaders,
    logTime,
    requestHeadersKey2LowerCase,
} = require("../utils");

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
    const requestHeaders = requestHeadersKey2LowerCase(
        transformCfEventRequestHeaders(cfEvent.request.headers)
    );
    // 请求的文件 key
    let queryFileKey = cfEvent.request.uri;
    if (queryFileKey.startsWith("/")) {
        queryFileKey = queryFileKey.slice(1);
    }
    const isSupportWebp = requestHeaders.accept?.includes("webp");
    const isReuqestAutoResource = queryFileKey.includes("__op__format,f_auto");
    // 如果请求的是 auto 资源，但是不支持 webp，则重定向到原始资源
    if (!isSupportWebp && isReuqestAutoResource) {
        response.status = "307";
        response.statusDescription = "Temporary Redirect";
        response.headers["location"] = [
            {
                key: "Location",
                value: cfEvent.request.uri.replace("__op__format,f_auto", ""),
            },
        ];
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "redirect-unsupported-webp",
            },
        ];
        response.headers["cache-control"] = [
            {
                key: "Cache-Control",
                value: "no-cache, no-store, must-revalidate",
            },
        ];
        return response;
    }
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
    const fileName = queryFileKey.split("/")[queryFileKey.split("/").length - 1];
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
    const originFilePath = queryFileKey.split(fileName)[0] + originFileName;
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

        await logTime(async () => {
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: queryFileKey,
                    Body: transformedImageBuffer,
                    ContentType: contentType,
                })
            );
        }, "Upload time");

        // 直接复用图片处理结果
        response.status = "200";
        response.statusDescription = "OK";
        response.body = transformedImageBuffer.toString("base64");
        response.bodyEncoding = "base64";
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
        // 这次请求不让 CloudFront 缓存
        response.headers["cache-control"] = [
            {
                key: "Cache-Control",
                value: "no-cache, no-store, must-revalidate",
            },
        ];
        return response;
    } catch (e) {
        console.log("Exception:\n", e);
        return errorResponse("Exception: " + e.message, e.statusCode || 400);
    }
}

module.exports = cfHandler;
