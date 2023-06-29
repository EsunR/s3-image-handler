const sharp = require("sharp");
const { validImageAction, isNumberString } = require("./validator");
const { IMAGE_OPERATION_SPLIT } = require("./constance");
const { logTime } = require(".");

/**
 * 解析操作字符串
 * @param {string} argString
 */
function parseOperationString(argString) {
    const actionsString = argString
        .split(IMAGE_OPERATION_SPLIT)
        .filter((item) => !!item);
    const result = [];
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(",");
        const action = {
            actionName,
            args: {},
        };
        args.forEach((arg) => {
            const argKey = arg.split("_")[0];
            const argValue = arg.split("_")[1].trim();
            action.args[argKey] = argValue;
        });
        validImageAction(action);
        result.push(action);
    }
    return result;
}

/**
 * 裁剪图片
 * @param {sharp.Sharp} imageHandle
 * @param {Object} args
 */
function resizeImage(imageHandle, args) {
    let { m, w, h, limit = "0" } = args;
    w = isNumberString(w) ? Number(w) : w;
    h = isNumberString(h) ? Number(h) : h;
    if (m === "lfit") {
        if (!w && !h) {
            throw new Error(`Missing required argument: w or h`);
        }
        return imageHandle.resize(w, h, {
            fit: "outside",
            withoutEnlargement: limit === "1",
        });
    } else if (m === "mfit") {
        if (!w && !h) {
            throw new Error(`Missing required argument: w or h`);
        }
        return imageHandle.resize(w, h, {
            fit: "inside",
            withoutEnlargement: limit === "1",
        });
    } else {
        throw new Error(`Invalid resize mode: ${m}`);
    }
}

async function imageTransfer(imageBuffer, operationString) {
    let imageHandle = sharp(imageBuffer);
    let metadata = await logTime(
        async () => await imageHandle.metadata(),
        "Read metadata before transform"
    );
    const actions = parseOperationString(operationString);
    let quality = 0;
    let format = metadata.format;
    for (const action of actions) {
        const { actionName, args } = action;
        if (actionName === "resize") {
            imageHandle = resizeImage(imageHandle, args);
        } else if (actionName === "quality") {
            quality = Number(args.q);
        } else if (actionName === "format") {
            const targetFormat = args.f;
            if (targetFormat === "auto") {
                format = "webp";
            } else {
                format = targetFormat;
            }
        }
    }

    // 如果有 format 或者 quality 操作，就需要重新对图片格式化
    if (
        actions.map((item) => item.actionName).includes("format") ||
        actions.map((item) => item.actionName).includes("quality")
    ) {
        imageHandle = await logTime(
            () =>
                imageHandle.toFormat(format, { quality: quality || undefined }),
            "Transform format and quantity"
        );
    }
    return {
        buffer: await imageHandle.toBuffer(),
        contentType: `image/${format}`,
    };
}

module.exports = {
    imageTransfer,
};
