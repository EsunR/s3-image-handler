import { CLIENT_ERROR_PREFIX } from '@/common/constance';
import { ImageAction, ImageActionName } from '../types';

const VALID_ACTION: Record<
    ImageActionName,
    {
        [key: string]: {
            required?: boolean;
            validator?: (value: any) => boolean;
        };
    }
> = {
    resize: {
        m: {
            required: true,
            validator: (value: any) =>
                ['lfit', 'mfit' /** "fill", "pad", "fixed" */].includes(value),
        },
        w: {
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 1 &&
                Number(value) <= 4096,
        },
        h: {
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 1 &&
                Number(value) <= 4096,
        },
        limit: {
            validator: (value: string) => ['0', '1'].includes(value),
        },
    },
    quality: {
        q: {
            required: true,
            validator: (value: any) =>
                isNumberString(value) &&
                Number(value) >= 1 &&
                Number(value) <= 100,
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

const VALID_ACTION_NAMES = Object.keys(VALID_ACTION);

export function isNumberString(value: any) {
    return !isNaN(Number(value));
}

export function validImageAction(action: ImageAction) {
    const { actionName, args } = action;
    if (!VALID_ACTION_NAMES.includes(actionName)) {
        throw new Error(
            `${CLIENT_ERROR_PREFIX} Invalid action name: ${actionName}`,
        );
    }
    const validAction = VALID_ACTION[actionName];
    for (const argName in validAction) {
        const arg = validAction[argName];
        const argValue = (args as any)[argName];
        // 检验 arg 是否是必填参数
        if (arg.required && !argValue) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: ${argName}`,
            );
        }
        // argValue 有值再进行检验
        else if (argValue) {
            if (arg.validator && !arg.validator(argValue)) {
                throw new Error(
                    `${CLIENT_ERROR_PREFIX} Invalid ${actionName} action argument key: ${argName}, value: ${argValue}`,
                );
            }
        }
    }
}
