import { getReduceModValue, isNumberString } from './utils';

export const IMAGE_OP_STRING_SPLIT = '__op__';

export const IMAGE_OP_STRING_IN_QUERY__KEY = 'x-bce-process';

export const IMAGE_OP_STRING_IN_QUERY__PERFIX = 'image';

export const IMAGE_OP_STRING_IN_QUERY__SPLIT = '/';

export const CLIENT_ERROR_PREFIX = '[client]';

export const VALID_ACTION: Record<
    ImageActionName,
    {
        [key: string]: {
            required?: boolean;
            /** 对数值进行校验，在 origin response 阶段 */
            validator?: (value: any) => boolean;
            /** 对数值进行格式化（在 viewer request 阶段） */
            formater?: (value: any) => any;
        };
    }
> = {
    resize: {
        m: {
            required: true,
            validator: (value: any) =>
                ['lfit', 'mfit', 'fixed' /** "fill", "pad" */].includes(value),
        },
        w: {
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 100 &&
                Number(value) <= 4096,
            formater: (value: any) => getReduceModValue(value, 100),
        },
        h: {
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 100 &&
                Number(value) <= 4096,
            formater: (value: any) => getReduceModValue(value, 100),
        },
        limit: {
            validator: (value: string) => ['0', '1'].includes(value),
            formater: (value: any) => {
                if (value === '0') {
                    // 返回 undefined 后，会移除该参数
                    return undefined;
                }
                return value;
            },
        },
    },
    quality: {
        q: {
            required: true,
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 20 &&
                Number(value) <= 100,
            formater: (value: any) => getReduceModValue(value, 20),
        },
    },
    format: {
        /**
         * 支持的格式
         * 实际上 Sharp 支持：heic, heif, avif, jpeg, jpg, jpe, tile, dz, png, raw, tiff, tif, webp, gif, jp2, jpx, j2k, j2c, jxl
         * Bos 支持：jpg, png, bmp, webp, heic, gif, auto
         * 这里为了兼容 BOS，取交集（移除对 bmp 的支持）
         */
        f: {
            required: true,
            validator: (value: any) =>
                ['jpg', 'png', 'webp', 'heic', 'gif', 'auto'].includes(value),
        },
    },
};

export const VALID_ACTION_NAMES = Object.keys(VALID_ACTION);

export const IMAGE_OPERATION_SORT = Object.entries(VALID_ACTION).map(
    ([actionName, action]) => ({
        op: actionName as ImageActionName,
        args: Object.keys(action),
    }),
);
