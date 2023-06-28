exports.errorResponse = (body, statusCode = 400, option = {}) => {
    const { eventType = "api", response } = option;
    console.log(body);
    if (eventType === "api") {
        return {
            statusCode,
            body,
            headers: { "Content-Type": "text/plain" },
        };
    } else {
        response.status = `${statusCode}`;
        response.statusDescription = "Bad Request";
        response.body = body;
        response.headers["content-type"] = [
            {
                key: "Content-Type",
                value: "text/plain",
            },
        ];
        response.headers["lambda-edge"] = [
            {
                key: "Lambda-Edge",
                value: "error",
            },
        ];
        return response;
    }
};
