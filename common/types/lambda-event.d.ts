interface CfEventHeaders {
    [key: string]: Array<{
        key: string;
        value: string;
    }>;
}

type CfRequest = {
    clientIp: string;
    headers: CfEventHeaders;
    method: string;
    querystring: string;
    uri: string;
};

type CfResponse = {
    headers: CfEventHeaders;
    status: string;
    statusDescription: string;
    body: string;
    bodyEncoding: string;
};

/**
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-response
 */
interface CfOriginResponseEvent {
    Records: Array<{
        cf: {
            config: {
                distributionDomainName: string;
                distributionId: string;
                eventType: string;
                requestId: string;
            };
            request: CfRequest;
            response: CfResponse;
        };
    }>;
}

/**
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
 */
interface CfViewerRequestEvent {
    Records: Array<{
        cf: {
            config: {
                distributionDomainName: string;
                distributionId: string;
                eventType: string;
                requestId: string;
            };
            request: CfRequest;
        };
    }>;
}

/**
 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
 */
interface LambdaContext {
    /**
     * 回调运行后等待 Node.js 事件循环为空，设置为 false 则为不等待
     * @default true
     */
    callbackWaitsForEmptyEventLoop?: boolean;
}

type LambdaCallback = (error?: Error | null | string, result?: any) => void;
