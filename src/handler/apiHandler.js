const {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} = require("@aws-sdk/client-s3");
const { errorResponse } = require("../utils/response");
const { imageTransfer } = require("../utils/image");
const { IMAGE_OPERATION_SPLIT } = require("../utils/constance");
const fs = require("fs");
const path = require("path");

const { BUCKET, FILE_TARGET, URL } = process.env;

/**
 * API event handler
 * @param {Object} event
 * @param {S3Client} s3Client
 * @returns
 */
async function apiHandler(event, s3Client) {
    /** @type {string} */
    const requestHeaders = event?.headers;
    const query = event?.queryStringParameters?.query;
    if (!query) {
        return errorResponse("Missing query parameter");
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

        // 开发模式，文件上传本地
        if (FILE_TARGET === "local") {
            // 判断有没有 output 文件，没有的话就创建
            const outPutPath = path.resolve(__dirname, "../output/");
            if (!fs.existsSync(outPutPath)) {
                fs.mkdirSync(outPutPath);
            }
            const fileExt = contentType.split("/")[1];
            fs.writeFileSync(
                path.join(
                    outPutPath,
                    fileExt ? `${fileName}.${fileExt}` : fileName
                ),
                transformedImageBuffer,
                "binary"
            );
            return {
                output: path.join(
                    outPutPath,
                    fileExt ? `${fileName}.${fileExt}` : fileName
                ),
            };
        }
        // 线上文件上传到 S3
        else {
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: query,
                    Body: transformedImageBuffer,
                    ContentType: contentType,
                })
            );
            return {
                statusCode: 301,
                headers: {
                    Location: `${URL}/${query}`,
                },
            };
        }
    } catch (e) {
        console.log("Exception:\n", e);
        return errorResponse("Exception: " + e.message, e.statusCode || 400);
    }
}

module.exports = apiHandler;
