import {
    IMAGE_OPERATION_SORT,
    IMAGE_OP_STRING_IN_QUERY__KEY,
    IMAGE_OP_STRING_IN_QUERY__SPLIT,
    IMAGE_OP_STRING_IN_QUERY__PERFIX,
    IMAGE_OP_STRING_SPLIT,
    VALID_ACTION,
} from './constance';

type ImageOpRecord = Record<string, Record<string, any>>;

/**
 * 判断 querystring 中是否包含 opString
 */
export function querStringIncludeOpString(querystring: string) {
    return typeof querystring === 'string'
        ? querystring.includes(
              `${IMAGE_OP_STRING_IN_QUERY__KEY}=${IMAGE_OP_STRING_IN_QUERY__PERFIX}${IMAGE_OP_STRING_IN_QUERY__SPLIT}`,
          )
        : false;
}

/**
 * uri 中是否包含 opString
 */
export function uriIncludeOpString(uri: string) {
    return typeof uri === 'string'
        ? uri.includes(IMAGE_OP_STRING_SPLIT)
        : false;
}

export function parseUri(uri: string) {
    const fileKey = (uri.startsWith('/') ? uri.slice(1) : uri).split('?')[0];
    const originFileKey = fileKey.split('__op__')[0];
    const splitUri = fileKey.split('/');
    const fileName = splitUri[splitUri.length - 1];
    const originFileName = fileName.split('__op__')[0];
    const opStringStartIndex = fileName.match(new RegExp(IMAGE_OP_STRING_SPLIT))
        ?.index;
    const opString =
        typeof opStringStartIndex === 'number'
            ? fileName.slice(opStringStartIndex)
            : '';

    return {
        fileKey,
        originFileKey,
        fileName,
        originFileName,
        opString,
    };
}

/**
 * 提取 querystring 中的 opString 部分
 * 注：querystring 中的 opString 遵循 BOS 图像处理 2.0 的规范
 * x-bce-process=image/format,f_auto/quality,q_90 => /format,f_auto/quality,q_90
 * @doc https://cloud.baidu.com/doc/BOS/s/7ldh5wpk6#1-%E5%91%BD%E4%BB%A4%E6%96%B9%E5%BC%8F
 */
export function getOpStringInQuerystring(querystring: string) {
    const queryValue =
        parseQuerystring(querystring)?.[IMAGE_OP_STRING_IN_QUERY__KEY];
    if (!queryValue) {
        return '';
    }
    const startString = `${IMAGE_OP_STRING_IN_QUERY__PERFIX}${IMAGE_OP_STRING_IN_QUERY__SPLIT}`;
    if (queryValue.startsWith(startString)) {
        return queryValue.replace(IMAGE_OP_STRING_IN_QUERY__PERFIX, '');
    }
    return '';
}

/**
 * 解析 opString 为 ImageOpRecord
 * opString: __op__format,f_auto__op__quality,q_90
 */
export function decodeOpString(opString: string) {
    const actionsString = opString
        .split(IMAGE_OP_STRING_SPLIT)
        .filter((item) => !!item);
    const result: ImageOpRecord = {};
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(',');
        result[actionName] = {};
        args.forEach((arg) => {
            const kvSplitIndex = arg.indexOf('_');
            const argKey = arg.slice(0, kvSplitIndex);
            const argValue = arg.slice(kvSplitIndex + 1).trim();
            Object.assign(result[actionName], { [argKey]: argValue });
        });
    }
    return result;
}

/**
 * 解析 querystring 中的 opString 为 ImageOpRecord
 * opStringInQuerystring: /format,f_auto/quality,q_90
 */
export function decodeOpStringInQuery(opStringInQuerystring: string) {
    const actionsString = opStringInQuerystring
        .split(IMAGE_OP_STRING_IN_QUERY__SPLIT)
        .filter((item) => !!item);
    const result: ImageOpRecord = {};
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(',');
        result[actionName] = {};
        args.forEach((arg) => {
            const kvSplitIndex = arg.indexOf('_');
            const argKey = arg.slice(0, kvSplitIndex);
            const argValue = arg.slice(kvSplitIndex + 1).trim();
            Object.assign(result[actionName], { [argKey]: argValue });
        });
    }
    return result;
}

/**
 * 根据 ImageOpRecord 生成 opString
 * 这个过程中会对 opString 进行排序，过滤无效参数，并对数值进行格式化
 */
export function encodeOpString(imageOpRecord: ImageOpRecord) {
    let result = '';
    IMAGE_OPERATION_SORT.forEach((opSort) => {
        const { op, args } = opSort;
        if (imageOpRecord[op]) {
            result += `${IMAGE_OP_STRING_SPLIT}${op}`;
            // 此处会过滤掉无用参数
            args.forEach((arg) => {
                if (imageOpRecord[op][arg] !== undefined) {
                    let argValue = imageOpRecord[op][arg];
                    const argValueFormater = VALID_ACTION[op]?.[arg]?.formater;
                    if (typeof argValueFormater === 'function') {
                        argValue = argValueFormater(argValue);
                    }
                    if (argValue !== undefined) {
                        result += `,${arg}_${argValue}`;
                    }
                }
            });
        }
    });
    return result;
}

/**
 * 判断是否是数字字符串
 */
export function isNumberString(value: any) {
    const isValidString = typeof value === 'string' && value;
    return isValidString ? !isNaN(Number(value)) : false;
}

/**
 * 获取除模运算后的值
 */
export function getReduceModValue(value: any, mod: number) {
    if (isNumberString(value)) {
        if (Number(value) <= 0) {
            return value;
        }
        return `${parseInt(`${Number(value) - (Number(value) % mod)}`)}`;
    }
    return value;
}

export function parseQuerystring(querystring: string) {
    const result: Record<string, string> = {};
    querystring.split('&').forEach((item) => {
        const [key, value] = item.split('=');
        result[key] = value;
    });
    return result;
}
