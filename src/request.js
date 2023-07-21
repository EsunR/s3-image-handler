const util = require("util");

exports.handler = async (event) => {
    console.log("Request event:\n", util.inspect(event, { depth: 8 }));
    const request = event.Records[0].cf.request;
    const uri = request.uri;
    const requestAutoFormat = uri.includes("__op__format,f_auto");
    const isSupportWebp =
        !!request.headers?.["accept"][0].value.includes("image/webp");
    // 如果不支持 webp 但是要求自动转换格式，就把请求中的 f_auto 去掉
    if (!isSupportWebp && requestAutoFormat) {
        request.uri = uri.replace("__op__format,f_auto", "");
    }
    return request;
};
