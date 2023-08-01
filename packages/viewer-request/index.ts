import {
    decodeOpString,
    encodeOpString,
    parseUri,
    uriIncludeOpString,
} from "@/common/utils";
import util from "util";

export async function handler(event: CfViewerRequestEvent) {
    const request = event.Records[0].cf.request;
    // 判断是否是有效 uri
    if (!uriIncludeOpString(request.uri)) {
        return request;
    }

    if (typeof jest === "undefined") {
        console.log("Response event:\n", util.inspect(event, { depth: 8 }));
    }

    // 判断是否需要自动转换格式
    const requestAutoFormat = request.uri.includes("__op__format,f_auto");
    if (requestAutoFormat) {
        const isSupportWebp =
            !!request.headers?.["accept"][0].value.includes("image/webp");
        if (isSupportWebp) {
            console.log(
                'Support webp, replace "f_auto" with "f_webp" from uri',
            );
            request.uri = request.uri.replace(
                "__op__format,f_auto",
                "__op__format,f_webp",
            );
        } else {
            console.log('Not support webp, remove "f_auto" from uri');
            request.uri = request.uri.replace("__op__format,f_auto", "");
        }
    }

    // 判断是否还包含 image op 字符串
    if (!uriIncludeOpString(request.uri)) {
        return request;
    }

    // 规范 uri，防止参数重复
    const { opString } = parseUri(request.uri);
    const imageOpRecord = decodeOpString(opString);
    const formattedOpString = encodeOpString(imageOpRecord);
    request.uri = request.uri.replace(opString, formattedOpString);
    console.log(
        `Formatted image operation string: ${opString} => ${formattedOpString}`,
    );

    // 对 uri 参数进行差异值合并

    return request;
}
