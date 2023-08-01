import { IMAGE_OPERATION_SORT, IMAGE_OPERATION_SPLIT } from "./constance";

type ImageOpRecord = Record<string, Record<string, any>>;

/**
 * uri 中是否包含 __op__ 字符串
 */
export function uriIncludeOpString(uri: string) {
    return typeof uri === "string"
        ? uri.includes(IMAGE_OPERATION_SPLIT)
        : false;
}

export function parseUri(uri: string) {
    const fileKey = (uri.startsWith("/") ? uri.slice(1) : uri).split("?")[0];
    const originFileKey = fileKey.split("__op__")[0];
    const splitUri = fileKey.split("/");
    const fileName = splitUri[splitUri.length - 1];
    const originFileName = fileName.split("__op__")[0];
    const opStringStartIndex = fileName.match(new RegExp(IMAGE_OPERATION_SPLIT))
        ?.index;
    const opString =
        typeof opStringStartIndex === "number"
            ? fileName.slice(opStringStartIndex)
            : "";

    return {
        fileKey,
        originFileKey,
        fileName,
        originFileName,
        opString,
    };
}

export function decodeOpString(opString: string) {
    const actionsString = opString
        .split(IMAGE_OPERATION_SPLIT)
        .filter((item) => !!item);
    const result: ImageOpRecord = {};
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(",");
        result[actionName] = {};
        args.forEach((arg) => {
            const kvSplitIndex = arg.indexOf("_");
            const argKey = arg.slice(0, kvSplitIndex);
            const argValue = arg.slice(kvSplitIndex + 1).trim();
            Object.assign(result[actionName], { [argKey]: argValue });
        });
    }
    return result;
}

export function encodeOpString(imageOpRecord: ImageOpRecord) {
    let result = "";
    IMAGE_OPERATION_SORT.forEach((opSort) => {
        const { op, args } = opSort;
        if (imageOpRecord[op]) {
            result += `${IMAGE_OPERATION_SPLIT}${op}`;
            // 此处会过滤掉无用参数
            args.forEach((arg) => {
                if (imageOpRecord[op][arg] !== undefined) {
                    result += `,${arg}_${imageOpRecord[op][arg]}`;
                }
            });
        }
    });
    return result;
}
