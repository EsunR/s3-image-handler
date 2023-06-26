const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { errorResponse } = require("./utils/response");
const { imageTransfer } = require("./utils/image");
const { IMAGE_OPERATION_SPLIT } = require("./utils/constance");
const fs = require("fs");
const path = require("path");

const { BUCKET = "esunr-webapp" } = process.env;
const s3Client = new S3Client({
    credentials: {
        accessKeyId: "AKIAT4HJ6ISPJSSIQJWF",
        secretAccessKey: "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",
    },
    region: "ap-east-1",
});

exports.handler = async (event) => {
    /** @type {string} */
    const query = event?.queryStringParameters?.query;
    if (!query) {
        errorResponse("Missing query parameter");
    }
    const fileName = query.split("/")[query.split("/").length - 1];
    if (!fileName) {
        errorResponse("Missing file name");
    }
    if (fileName.split(IMAGE_OPERATION_SPLIT).length < 2) {
        errorResponse("Missing image operation");
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
        const originImage = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET,
                Key: originFilePath,
            })
        );
        const imageBuffer = await originImage.Body.transformToByteArray();
        const transformedImageBuffer = await imageTransfer(
            imageBuffer,
            operationString
        );
        console.log("transformedImageBuffer: ", transformedImageBuffer);
        // 将文件写到 output 文件夹下
        const outPutPath = path.resolve(__dirname, "./output/");
        fs.writeFileSync(
            path.join(outPutPath, fileName),
            transformedImageBuffer,
            "binary"
        );
    } catch (e) {
        console.log("Exception:\n", e);
        return errorResponse("Exception: " + e.message, e.statusCode || 400);
    }
};
