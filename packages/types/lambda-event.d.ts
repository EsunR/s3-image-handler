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
