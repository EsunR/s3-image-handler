import {
    querStringIncludeOpString,
    uriIncludeOpString,
    parseUri,
    getOpStringInQuerystring,
    decodeOpStringInQuery,
    decodeOpString,
    encodeOpString,
    isNumberString,
    getReduceModValue,
} from '@/common/utils';

describe('querStringIncludeOpString', () => {
    test('is image op querystring', () => {
        expect(
            querStringIncludeOpString(
                '/path/to/file/image.png?x-bce-process=image/format,f_auto',
            ),
        ).toBe(true);
    });

    test('is not image op querystring', () => {
        expect(querStringIncludeOpString('/path/to/file/image.png')).toBe(
            false,
        );
    });

    test('right query key but wrong value', () => {
        expect(
            querStringIncludeOpString(
                '/path/to/file/image.png?x-bce-process=doc/convert-to-pdf',
            ),
        ).toBe(false);
    });

    test('right query key and prefix, but not action keywords', () => {
        expect(
            querStringIncludeOpString(
                '/path/to/file/image.png?x-bce-process=image',
            ),
        ).toBe(false);
    });
});

describe('uriIncludeOpString', () => {
    test('is image op uri', () => {
        expect(uriIncludeOpString('test.png__op__format,f_auto')).toBe(true);
    });

    test('is not image op uri', () => {
        expect(uriIncludeOpString('test.png')).toBe(false);
    });

    test('empty string', () => {
        expect(uriIncludeOpString('')).toBe(false);
    });
});

describe('parseUri', () => {
    test('parse image op uri successful', () => {
        expect(
            parseUri(
                '/path/to/file/image.png__op__format,f_auto__op__quality,q_90',
            ),
        ).toEqual({
            fileKey:
                'path/to/file/image.png__op__format,f_auto__op__quality,q_90',
            originFileKey: 'path/to/file/image.png',
            fileName: 'image.png__op__format,f_auto__op__quality,q_90',
            originFileName: 'image.png',
            opString: '__op__format,f_auto__op__quality,q_90',
        } as ReturnType<typeof parseUri>);
    });

    test('no op string in uri', () => {
        expect(parseUri('/path/to/file/image.png')).toEqual({
            fileKey: 'path/to/file/image.png',
            originFileKey: 'path/to/file/image.png',
            fileName: 'image.png',
            originFileName: 'image.png',
            opString: '',
        } as ReturnType<typeof parseUri>);
    });

    test('wrong op symbol use', () => {
        expect(parseUri('/path/to/file/test.png_op_format,f_auto')).toEqual({
            fileKey: 'path/to/file/test.png_op_format,f_auto',
            originFileKey: 'path/to/file/test.png_op_format,f_auto',
            fileName: 'test.png_op_format,f_auto',
            originFileName: 'test.png_op_format,f_auto',
            opString: '',
        } as ReturnType<typeof parseUri>);
    });

    test('empty string', () => {
        expect(parseUri('')).toEqual({
            fileKey: '',
            originFileKey: '',
            fileName: '',
            originFileName: '',
            opString: '',
        } as ReturnType<typeof parseUri>);
    });

    test('empty uri', () => {
        expect(parseUri('/')).toEqual({
            fileKey: '',
            originFileKey: '',
            fileName: '',
            originFileName: '',
            opString: '',
        });
    });
});

describe('getOpStringInQuerystring', () => {
    test('get op string in querystring', () => {
        expect(
            getOpStringInQuerystring('x-bce-process=image/format,f_auto'),
        ).toEqual('/format,f_auto');
    });

    test('wrong query key', () => {
        expect(
            getOpStringInQuerystring('x-bce-processs=image/format,f_auto'),
        ).toEqual('');
    });

    test('wrong op string prefix', () => {
        expect(
            getOpStringInQuerystring('x-bce-process=images/format,f_auto'),
        ).toEqual('');
    });

    test('empty string input', () => {
        expect(getOpStringInQuerystring('')).toEqual('');
    });

    test('repeat op string prefix', () => {
        expect(
            getOpStringInQuerystring(
                'x-bce-process=image/format,f_auto/image/quality,q_90',
            ),
        ).toEqual('/format,f_auto/image/quality,q_90');
    });
});

describe('decodeOpStringInQuery', () => {
    test('decode image op string successful', () => {
        expect(decodeOpStringInQuery('/format,f_auto/quality,q_90')).toEqual({
            format: { f: 'auto' },
            quality: { q: '90' },
        });
    });

    test('wrong op symbol use', () => {
        expect(decodeOpStringInQuery('/format,f_auto_quality,q_90')).toEqual({
            format: { f: 'auto_quality', q: '90' },
        });
    });

    test('op string with empty action', () => {
        expect(decodeOpStringInQuery('/resize/format,f_auto')).toEqual({
            resize: {},
            format: { f: 'auto' },
        });
    });
});

describe('decodeOpString', () => {
    test('decode image op string successful', () => {
        expect(
            decodeOpString(
                '__op__format,f_auto__op__resize,m_lfit,w_100,h_100,limit_1__op__quality,q_90',
            ),
        ).toEqual({
            format: { f: 'auto' },
            resize: {
                m: 'lfit',
                limit: '1',
                h: '100',
                w: '100',
            },
            quality: { q: '90' },
        });
    });

    test('wrong op symbol use', () => {
        expect(decodeOpString('_op_format,f_auto__op__quality,q_90')).toEqual({
            _op_format: { f: 'auto' },
            quality: { q: '90' },
        });
    });

    test('wrong op symbol use', () => {
        expect(decodeOpString('_op_format,f_auto_op_quality,q_90')).toEqual({
            _op_format: { f: 'auto_op_quality', q: '90' },
        });
    });

    test('op string with empty action', () => {
        expect(decodeOpString('__op__resize__op__format,f_auto')).toEqual({
            resize: {},
            format: { f: 'auto' },
        });
    });
});

describe('encodeOpString', () => {
    test('encode image op string successful', () => {
        expect(
            encodeOpString({
                format: { f: 'webp' },
                resize: {
                    m: 'lfit',
                    limit: '0',
                    h: '120',
                    w: '120',
                },
                quality: { q: '90' },
            }),
        ).toEqual(
            '__op__resize,m_lfit,w_100,h_100__op__quality,q_80__op__format,f_webp',
        );
    });

    /**
     * 当某个 action 的参数为空时，仍会生成对应的 action 字符串
     */
    test('encode image op string with empty args', () => {
        expect(
            encodeOpString({
                format: { f: 'webp' },
                resize: {},
                quality: { q: '90' },
            }),
        ).toEqual('__op__resize__op__quality,q_80__op__format,f_webp');
    });

    /**
     * 当某个 action 的参数不存在时，不会生成对应的 action 参数字符串
     */
    test('encode image op string with nonexistent args', () => {
        expect(
            encodeOpString({
                format: { f: 'webp' },
                resize: {
                    nonexistent: 'nonexistent',
                },
                quality: { q: '90' },
            }),
        ).toEqual('__op__resize__op__quality,q_80__op__format,f_webp');
    });

    /**
     * 当某个 action 不存在时，不会生成对应的 action 字符串
     */
    test('encode image op string with nonexistent action', () => {
        expect(
            encodeOpString({
                format: { f: 'webp' },
                nonexistent: {
                    arg: 'arg',
                },
                quality: { q: '90' },
            }),
        ).toEqual('__op__quality,q_80__op__format,f_webp');
    });
});

describe('isNumberString', () => {
    test('is number string', () => {
        expect(isNumberString('123')).toBe(true);
    });

    test('is float number string', () => {
        expect(isNumberString('0001.11')).toBe(true);
    });

    test('is not number string', () => {
        expect(isNumberString('123a')).toBe(false);
    });

    test('is empty string', () => {
        expect(isNumberString('')).toBe(false);
    });
});

describe('getReduceModValue', () => {
    test('get reduce mod value', () => {
        expect(getReduceModValue('450', 100)).toBe('400');
    });

    test('get reduce mod value', () => {
        expect(getReduceModValue('50', 100)).toBe('0');
    });

    test('not number string input', () => {
        expect(getReduceModValue('value', 100)).toBe('value');
    });

    test('negative number string input', () => {
        expect(getReduceModValue('-50', 100)).toBe('-50');
    });
});
