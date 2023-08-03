import {
    uriIncludeOpString,
    parseUri,
    decodeOpString,
    encodeOpString,
} from '@/common/utils';

// const TEST_OP_STRING =
//     "__op__format,f_auto__op__resize,m_lfit,w_100,h_100,limit_1__op__quality,q_90";
// const TEST_URI = "/path/to/file/image.png";

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
        debugger;
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
                format: { f: 'auto' },
                resize: {
                    m: 'lfit',
                    limit: '1',
                    h: '100',
                    w: '100',
                },
                quality: { q: '90' },
            }),
        ).toEqual(
            '__op__resize,m_lfit,w_100,h_100,limit_1__op__quality,q_90__op__format,f_auto',
        );
    });

    test('encode image op string with empty args', () => {
        expect(
            encodeOpString({
                format: { f: 'auto' },
                resize: {},
                quality: { q: '90' },
            }),
        ).toEqual('__op__resize__op__quality,q_90__op__format,f_auto');
    });

    test('encode image op string with nonexistent args', () => {
        expect(
            encodeOpString({
                format: { f: 'auto' },
                resize: {
                    nonexistent: 'nonexistent',
                },
                quality: { q: '90' },
            }),
        ).toEqual('__op__resize__op__quality,q_90__op__format,f_auto');
    });

    test('encode image op string with nonexistent action', () => {
        expect(
            encodeOpString({
                format: { f: 'auto' },
                nonexistent: {
                    arg: 'arg',
                },
                quality: { q: '90' },
            }),
        ).toEqual('__op__quality,q_90__op__format,f_auto');
    });
});
