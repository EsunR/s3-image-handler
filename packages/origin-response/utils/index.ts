import { IMAGE_OPERATION_SPLIT } from "@/common/constance";
import dotenv from "dotenv";
import path from "path";
import { validImageAction } from "./validator";
import { ImageAction } from "../types";

export async function logTime<T>(
    fn: (() => Promise<T>) | (() => T),
    tag: string,
) {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    console.log(`[${tag}] Time: `, end - start, "ms");
    return result;
}

export function transformCfEventRequestHeaders(headers: CfEventHeaders) {
    const result: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
        result[key] = value[0].value;
    });
    return result;
}

export function requestHeadersKey2LowerCase(headers: Record<string, string>) {
    const result: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
        result[key.toLowerCase()] = value;
    });
    return result;
}

export function loadEnv() {
    dotenv.config({
        path:
            process.env.NODE_ENV === "test"
                ? path.resolve(__dirname, "../.evn.test")
                : path.resolve(__dirname, ".env"),
    });
    return process.env;
}

/**
 * 将 opString 转为 ImageAction 对象，同时校验，如果校验失败抛出错误
 */
export function opString2ImageActions(opString: string): ImageAction[] {
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
