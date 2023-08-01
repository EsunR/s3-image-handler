import { parseUri, uriIncludeOpString } from "@/common/utils";
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { loadEnv } from "../utils";
import { imageTransfer } from "../utils/image";
import { errorResponse as _errorResponse } from "../utils/response";
import { CLIENT_ERROR_PREFIX } from "@/common/constance";

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
    if (response.status !== "403" || !uriIncludeOpString(cfEvent.request.uri)) {
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "nothing-hanppened",
            },
        ];
        return response;
    }
    const parsedUri = parseUri(cfEvent.request.uri);
    const { fileKey, originFileKey, opString } = parsedUri;
    console.log("parsedUri: ", parsedUri);
    const errorResponse = (body: string, statusCode: number = 400) => {
        return _errorResponse({
            body,
            response,
            statusCode,
        });
    };

    const downloadStartTime = Date.now();
    try {
        const originImage = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET,
                Key: originFileKey,
            }),
        );
        const imageBuffer = await originImage.Body?.transformToByteArray();
        console.log("Download time: ", Date.now() - downloadStartTime, "ms");

        if (!imageBuffer) {
            throw new Error("Image buffer is empty");
        }

        const transStartTime = Date.now();
        const { buffer: transformedImageBuffer, contentType } =
            await imageTransfer(imageBuffer, opString);
        console.log("Transform time: ", Date.now() - transStartTime, "ms");

        s3Client.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: fileKey,
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
        // 只有 validator 的消息才能暴露出去
        const shouldShowErrorMsg = e?.message?.includes(CLIENT_ERROR_PREFIX);
        return errorResponse(
            shouldShowErrorMsg
                ? (e.message as string).replace(CLIENT_ERROR_PREFIX, "").trim()
                : "File not exist",
            shouldShowErrorMsg ? 400 : e?.statusCode || 404,
        );
    }
}
