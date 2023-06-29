async function logTime(fn, tag) {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    console.log(`[${tag}] Time: `, end - start, "ms");
    return result;
}

function transformCfEventRequestHeaders(headers) {
    const result = {};
    Object.entries(headers).forEach(([key, value]) => {
        result[key] = value[0].value;
    });
    return result;
}

function requestHeadersKey2LowerCase(headers) {
    const result = {};
    Object.entries(headers).forEach(([key, value]) => {
        result[key.toLowerCase()] = value;
    });
    return result;
}

module.exports = {
    logTime,
    transformCfEventRequestHeaders,
    requestHeadersKey2LowerCase,
};
