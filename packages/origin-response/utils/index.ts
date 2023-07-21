import dotenv from "dotenv";
import path from "path";

export async function logTime(fn: () => Promise<any>, tag: string) {
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
                : path.resolve(__dirname, "../.env"),
    });
    return process.env;
}
