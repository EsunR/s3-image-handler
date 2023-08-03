import {
    decodeOpString,
    decodeOpStringInQuery,
    encodeOpString,
    getOpStringInQuerystring,
    parseUri,
    querStringIncludeOpString,
    uriIncludeOpString,
} from '@/common/utils';
import util from 'util';

export async function handler(event: CfViewerRequestEvent) {
    const request = event.Records[0].cf.request;
    const originUri = request.uri;
    console.log(`Reuqest uri: ${originUri}`);
    const originQuerystring = request.querystring;
    console.log(`Reuqest querystring: ${originQuerystring}`);

    let opStringInQuery: boolean;
    // 判断是否是有效 uri 或者 querystring
    // 如果 uri 和 querystring 都包含 opString，则优先使用 uri 中的 opString
    if (uriIncludeOpString(request.uri)) {
        opStringInQuery = false;
    } else if (querStringIncludeOpString(request.querystring)) {
        opStringInQuery = true;
    } else {
        return request;
    }

    console.log('Response event:\n', util.inspect(event, { depth: 8 }));

    // 判断是否需要自动转换格式
    if (opStringInQuery) {
        const requestAutoFormat =
            request.querystring.includes('/format,f_auto');
        if (requestAutoFormat) {
            const isSupportWebp =
                !!request.headers?.['accept'][0].value.includes('image/webp');
            if (isSupportWebp) {
                console.log(
                    'Support webp, replace "f_auto" with "f_webp" from querystring',
                );
                request.querystring = request.querystring.replace(
                    'f_auto',
                    'f_webp',
                );
            } else {
                console.log(
                    'Not support webp, remove "f_auto" from querystring',
                );
                request.querystring = request.querystring.replace(
                    '/format,f_auto',
                    '',
                );
            }
        }
    } else {
        const requestAutoFormat = request.uri.includes('__op__format,f_auto');
        if (requestAutoFormat) {
            const isSupportWebp =
                !!request.headers?.['accept'][0].value.includes('image/webp');
            if (isSupportWebp) {
                console.log(
                    'Support webp, replace "f_auto" with "f_webp" from uri',
                );
                request.uri = request.uri.replace('f_auto', 'f_webp');
            } else {
                console.log('Not support webp, remove "f_auto" from uri');
                request.uri = request.uri.replace('__op__format,f_auto', '');
            }
        }
    }

    // 处理完格式参数后，再次判断是否是有效 uri 或者 querystring
    if (opStringInQuery) {
        if (!querStringIncludeOpString(request.querystring)) {
            return request;
        }
    } else {
        if (!uriIncludeOpString(request.uri)) {
            return request;
        }
    }

    // 规范 uri，将 uri 中的 opString 排序，或提取 querystring 中的参数到 uri
    if (opStringInQuery) {
        const opString = getOpStringInQuerystring(request.querystring);
        const imageOpRecord = decodeOpStringInQuery(opString);
        const formattedOpString = encodeOpString(imageOpRecord);
        request.uri = `${request.uri}${formattedOpString}`;
    } else {
        const { opString } = parseUri(request.uri);
        const imageOpRecord = decodeOpString(opString);
        const formattedOpString = encodeOpString(imageOpRecord);
        request.uri = request.uri.replace(opString, formattedOpString);
    }

    console.log(`Transform uri: ${originUri} => ${request.uri}`);
    return request;
}
