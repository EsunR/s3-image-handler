import {
    CLIENT_ERROR_PREFIX,
    VALID_ACTION_NAMES,
    VALID_ACTION,
} from '@/common/constance';

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
