export function errorResponse(option: {
    body: string;
    statusCode: number;
    response: CfResponse;
}) {
    const { body, statusCode, response } = option || {};
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
