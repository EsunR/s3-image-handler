const VALID_ACTION = {
    resize: {
        m: {
            required: true,
            validator: (value) =>
                ["lfit", "mfit"/** "fill", "pad", "fixed" */].includes(value),
        },
        w: {
            validator: (value) =>
                isNumberString(value) && value >= 1 && value <= 4096,
        },
        h: {
            validator: (value) =>
                isNumberString(value) && value >= 1 && value <= 4096,
        },
        limit: {
            validator: (value) => ["0", "1"].includes(value),
        },
    },
    quality: {
        q: {
            required: true,
            validator: (value) =>
                isNumberString(value) && value >= 1 && value <= 100,
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
            validator: (value) =>
                ["jpg", "png", "webp", "heic", "gif", "auto"].includes(
                    value
                ),
        },
    },
};

const VALID_ACTION_NAMES = Object.keys(VALID_ACTION);

function isNumberString(value) {
    return !isNaN(Number(value));
}

function validImageAction(action) {
    const { actionName, args } = action;
    if (!VALID_ACTION_NAMES.includes(actionName)) {
        throw new Error(`Invalid action name: ${actionName}`);
    }
    const validAction = VALID_ACTION[actionName];
    for (const argName in validAction) {
        const arg = validAction[argName];
        const argValue = args[argName];
        // 检验 arg 是否是必填参数
        if (arg.required && !argValue) {
            throw new Error(`Missing required argument: ${argName}`);
        }
        // argValue 有值再进行检验
        else if (argValue) {
            if (arg.validator && !arg.validator(argValue)) {
                throw new Error(
                    `Invalid ${actionName} action argument key: ${argName}, value: ${argValue}`
                );
            }
        }
    }
}

module.exports = {
    isNumberString,
    validImageAction,
};
