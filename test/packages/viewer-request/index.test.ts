import { handler } from '@/packages/viewer-request/index';

function createCfViewerRequestEvent(
    request: Partial<CfRequest>,
): CfViewerRequestEvent {
    return {
        Records: [
            {
                cf: {
                    config: {
                        distributionDomainName: 'd282bf1w8afqkt.cloudfront.net',
                        distributionId: 'E24B6QLRKBVOZJ',
                        eventType: 'viewer-request',
                        requestId:
                            'Ck6chpX-s3ljKREcQwrF2ARzSARDTEiVFZKFZUrC-32So4JR8fAg5g==',
                    },
                    request: {
                        clientIp: '2a12:a301:1::32b',
                        headers: {
                            accept: [
                                {
                                    key: 'accept',
                                    value: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                                },
                            ],
                        },
                        method: 'GET',
                        querystring: '',
                        uri: '/test.jpg',
                        ...request,
                    },
                },
            },
        ],
    };
}

describe('viewer-request handler', () => {
    test('browser support webp', async () => {
        const event: CfViewerRequestEvent = createCfViewerRequestEvent({
            uri: '/folder/to/file/test.jpg__op__format,f_auto',
            headers: {
                accept: [
                    {
                        key: 'accept',
                        value: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    },
                ],
            },
        });
        const result = await handler(event);
        expect(result.uri).toEqual(
            '/folder/to/file/test.jpg__op__format,f_webp',
        );
    });

    test('browser not support webp', async () => {
        const event: CfViewerRequestEvent = createCfViewerRequestEvent({
            uri: '/folder/to/file/test.jpg__op__format,f_auto',
            headers: {
                accept: [
                    {
                        key: 'accept',
                        value: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    },
                ],
            },
        });
        const result = await handler(event);
        expect(result.uri).toEqual('/folder/to/file/test.jpg');
    });

    test('sort uri image op string', async () => {
        const event: CfViewerRequestEvent = createCfViewerRequestEvent({
            uri: '/folder/to/file/test.jpg__op__format,f_auto__op__resize,m_lfit,h_200,w_200__op__quality,q_90',
        });
        const result = await handler(event);
        expect(result.uri).toEqual(
            '/folder/to/file/test.jpg__op__resize,m_lfit,w_200,h_200__op__quality,q_90__op__format,f_webp',
        );
    });
});
