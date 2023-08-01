import { IMAGE_OPERATION_SPLIT } from "@/common/constance";
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { loadEnv } from "../utils";
import { imageTransfer } from "../utils/image";
import { errorResponse as _errorResponse } from "../utils/response";

const { BUCKET } = loadEnv();

/**
 * CloudFront event handler
 */
export default async function cfHandler(
    event: CfOriginResponseEvent,
    s3Client: S3Client,
) {
    const cfEvent = event.Records[0].cf;
    const response = cfEvent.response;
    // 如果能够正确处理资源，或者请求的数据没有图片操作符，则正常返回数据
    if (response.status !== "403" || !cfEvent.request.uri.includes("__op__")) {
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "nothing-hanppened",
            },
        ];
        return response;
    }
    // 请求的文件 key
    let queryFileKey = cfEvent.request.uri;
    if (queryFileKey.startsWith("/")) {
        queryFileKey = queryFileKey.slice(1);
    }
    const errorResponse = (body: string, statusCode: number = 400) => {
        return _errorResponse({
            body,
            response,
            statusCode,
        });
    };
    // 获取查询的文件
    const fileName =
        queryFileKey.split("/")[queryFileKey.split("/").length - 1];
    if (!fileName) {
        return errorResponse("Missing file name");
    }
    if (fileName.split(IMAGE_OPERATION_SPLIT).length < 2) {
        return errorResponse("Missing image operation");
    }
    const operationString = fileName.slice(
        fileName.match(new RegExp(IMAGE_OPERATION_SPLIT))?.index,
    );
    console.log("operationString: ", operationString);
    const originFileName = fileName.split(IMAGE_OPERATION_SPLIT)[0];
    console.log("originFileName: ", originFileName);
    const originFilePath = queryFileKey.split(fileName)[0] + originFileName;
    console.log("originFilePath: ", originFilePath);

    const downloadStartTime = Date.now();
    try {
        const originImage = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET,
                Key: originFilePath,
            }),
        );
        const imageBuffer = await originImage.Body?.transformToByteArray();
        console.log("Download time: ", Date.now() - downloadStartTime, "ms");

        if (!imageBuffer) {
            throw new Error("Image buffer is empty");
        }

        const transStartTime = Date.now();
        const { buffer: transformedImageBuffer, contentType } =
            await imageTransfer(imageBuffer, operationString);
        console.log("Transform time: ", Date.now() - transStartTime, "ms");

        s3Client.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: queryFileKey,
                Body: transformedImageBuffer,
                ContentType: contentType,
            }),
        );

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
    } catch (e: any) {
        console.log("Download time: ", Date.now() - downloadStartTime, "ms");
        console.log("Image handler exception:\n", e);
        return errorResponse("File not exist", e?.statusCode || 404);
    }
}
