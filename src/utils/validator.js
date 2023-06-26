const VALID_ACTION = {
    resize: {
        m: {
            required: true,
            validator: (value) =>
                ["lfit", "mfit", "fill", "pad", "fixed"].includes(value),
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
        else if(argValue) {
            if (arg.validator && !arg.validator(argValue)) {
                throw new Error(
                    `Invalid argument value: ${argName}, value: ${argValue}`
                );
            }
        }
    }
}

module.exports = {
    isNumberString,
    validImageAction,
};
