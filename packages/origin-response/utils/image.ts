import { CLIENT_ERROR_PREFIX, IMAGE_OPERATION_SPLIT } from "@/common/constance";
import sharp, { Sharp } from "sharp";
import { logTime } from ".";
import { ImageAction, ResizeImageAction } from "../types";
import { isNumberString, validImageAction } from "./validator";

/**
 * 将 opString 转为 ImageAction 对象，同时校验，如果校验失败抛出错误
 */
function opString2ImageAction(opString: string) {
    const actionsString = opString
        .split(IMAGE_OPERATION_SPLIT)
        .filter((item) => !!item);
    const result = [];
    for (const actionString of actionsString) {
        const [actionName, ...args] = actionString.split(",");
        const action = {
            actionName,
            args: {},
        } as ImageAction;
        args.forEach((arg) => {
            const kvSplitIndex = arg.indexOf("_");
            const argKey = arg.slice(0, kvSplitIndex);
            const argValue = arg.slice(kvSplitIndex + 1).trim();
            Object.assign(action.args, { [argKey]: argValue });
        });
        validImageAction(action);
        result.push(action);
    }
    return result;
}

/**
 * 裁剪图片
 */
function resizeImage(imageHandle: Sharp, args: ResizeImageAction["args"]) {
    const { m, w, h, limit = "0" } = args;
    const numW = isNumberString(w) ? Number(w) : undefined;
    const numH = isNumberString(h) ? Number(h) : undefined;
    if (m === "lfit") {
        if (!numW && !numH) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: w or h`,
            );
        }
        return imageHandle.resize(numW, numH, {
            fit: "outside",
            withoutEnlargement: limit === "1",
        });
    } else if (m === "mfit") {
        if (!numW && !numH) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: w or h`,
            );
        }
        return imageHandle.resize(numW, numH, {
            fit: "inside",
            withoutEnlargement: limit === "1",
        });
    } else {
        throw new Error(`${CLIENT_ERROR_PREFIX} Invalid resize mode: ${m}`);
    }
}

export async function imageTransfer(imageBuffer: Uint8Array, opString: string) {
    let imageHandle = sharp(imageBuffer);
    const metadata = await logTime(
        async () => await imageHandle.metadata(),
        "Read metadata before transform",
    );
    const actions = opString2ImageAction(opString);
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
            format = targetFormat;
        }
    }

    // 如果有 format 或者 quality 操作，就需要重新对图片格式化
    if (
        actions.map((item) => item.actionName).includes("format") ||
        actions.map((item) => item.actionName).includes("quality")
    ) {
        imageHandle = await logTime(
            async () =>
                imageHandle.toFormat(format, { quality: quality || undefined }),
            "Transform format and quantity",
        );
    }
    return {
        buffer: await imageHandle.toBuffer(),
        contentType: `image/${format}`,
    };
}
