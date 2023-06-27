async function logTime(fn, tag) {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    console.log(`[${tag}] Time: `, end - start, "ms");
    return result;
}

module.exports = {
    logTime,
};
