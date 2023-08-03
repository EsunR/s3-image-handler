import { parseUri, uriIncludeOpString } from '@/common/utils';
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import util from 'util';
import { loadEnv, logTime, opString2ImageActions } from '../utils';
import { imageTransfer } from '../utils/image';

const { BUCKET } = loadEnv();

/**
 * CloudFront event handler
 */
export default async function cfHandler(
    event: CfOriginResponseEvent,
    s3Client: S3Client,
) {
    const cfEvent = event?.Records[0]?.cf;
    const response = cfEvent?.response;
    // 如果能够正确处理资源，或者请求的数据没有图片操作符，则正常返回数据
    if (
        !response ||
        response.status !== '403' ||
        !uriIncludeOpString(cfEvent.request.uri)
    ) {
        response.headers['lambda-edge'] = [
            {
                key: 'Lambda-Edge',
                value: 'nothing-hanppened',
            },
        ];
        return response;
    }

    // ========== 触发图片处理逻辑 ==========
    console.log('Response event:\n', util.inspect(event, { depth: 8 }));
    const parsedUri = parseUri(cfEvent.request.uri);
    const { fileKey, originFileKey, opString } = parsedUri;
    console.log('parsedUri: ', parsedUri);

    // 转换 & 校验 opString
    const actions = opString2ImageActions(opString);

    // 下载图片
    const originImage = await logTime(
        () =>
            s3Client.send(
                new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: originFileKey,
                }),
            ),
        'Download time',
    );
    const imageBuffer = await originImage.Body?.transformToByteArray();

    if (!imageBuffer) {
        throw new Error('Image buffer is empty');
    }

    const { buffer: transformedImageBuffer, contentType } = await logTime(
        () => imageTransfer(imageBuffer, actions),
        'Image transform total time',
    );

    // 请求结果禁止让 CloudFront 缓存
    response.headers['cache-control'] = [
        {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
        },
    ];

    logTime(
        () =>
            s3Client.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: transformedImageBuffer,
                    ContentType: contentType,
                }),
            ),
        `Upload time (${fileKey})`,
    );

    // 判断 buffer 是否超过 1.3MB，如果超过则等待图片上传并重定向到原请求
    if (transformedImageBuffer.length > 1.3 * 1024 * 1024) {
        console.log('Image size is too large, redirect to origin request');
        // 需要将 CloudFront 最小 TTL 设置为 0，否则会导致重复重定向
        response.status = '302';
        response.statusDescription = 'Found';
        response.headers.location = [
            {
                key: 'Location',
                value: `/${fileKey}`,
            },
        ];
        response.headers['lambda-edge'] = [
            {
                key: 'Lambda-Edge',
                value: 'redirect',
            },
        ];
        return response;
    }

    // 直接复用图片处理结果
    response.status = '200';
    response.statusDescription = 'OK';
    response.body = transformedImageBuffer.toString('base64');
    response.bodyEncoding = 'base64';
    response.headers['content-type'] = [
        {
            key: 'Content-Type',
            value: contentType,
        },
    ];
    response.headers['content-length'] = [
        {
            key: 'Content-Length',
            value: transformedImageBuffer.length.toString(),
        },
    ];
    response.headers['lambda-edge'] = [
        {
            key: 'Lambda-Edge',
            value: 'success',
        },
    ];
    return response;
}
