import { IMAGE_OPERATION_SORT, IMAGE_OPERATION_SPLIT } from "./constance";

type ImageOpRecord = Record<string, Record<string, any>>;

export function isImageOpUri(uri: string) {
    debugger;
    return uri.includes(IMAGE_OPERATION_SPLIT);
}

export function getUriOpString(uri: string) {
    debugger;
    const splitUri = uri.split("/");
    const fileKey = splitUri[splitUri.length - 1].split("?")[0];
    const opStringStartIndex = fileKey.match(new RegExp(IMAGE_OPERATION_SPLIT))
        ?.index;
    if (opStringStartIndex === undefined) {
        return "";
    }
    const operationString = fileKey.slice(opStringStartIndex);
    return operationString;
}

export function decodeImageOpString(operationString: string) {
    const actionsString = operationString
        .split(IMAGE_OPERATION_SPLIT)
        .filter((item) => !!item);
    const result: ImageOpRecord = {};
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(",");
        result[actionName] = {};
        args.forEach((arg) => {
            const argKey = arg.split("_")[0];
            const argValue = arg.split("_")[1].trim();
            Object.assign(result[actionName], { [argKey]: argValue });
        });
    }
    return result;
}

export function encodeImageOpString(imageOpRecord: ImageOpRecord) {
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
