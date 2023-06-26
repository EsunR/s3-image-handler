exports.errorResponse = (body, statusCode = 400) => {
    console.log(body);
    return {
        statusCode,
        body,
        headers: { "Content-Type": "text/plain" },
    };
};
