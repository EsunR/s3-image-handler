import {
    isImageOpUri,
    getUriOpString,
    decodeImageOpString,
    encodeImageOpString,
} from "@/common/utils";

describe("isImageOpUri", () => {
    test("is image op uri", () => {
        expect(isImageOpUri("test.png__op__format,f_auto")).toBe(true);
    });

    test("is not image op uri", () => {
        expect(isImageOpUri("test.png")).toBe(false);
    });
});

describe("getUriOpString", () => {
    test("get uri op string successful", () => {
        expect(getUriOpString("test.png__op__format,f_auto")).toBe(
            "__op__format,f_auto",
        );
    });

    test("without uri op string", () => {
        expect(getUriOpString("test.png")).toBe("");
    });

    test("get uri op string with url query", () => {
        expect(getUriOpString("test.png?query=__op__format,f_auto")).toBe("");
    });
});

describe("decodeImageOpString", () => {
    test("decode image op string successful", () => {
        expect(
            decodeImageOpString(
                "__op__resize,m_lfit,w_100,h_100,limit_1__op__format,f_auto",
            ),
        ).toEqual({
            resize: {
                m: "lfit",
                w: "100",
                h: "100",
                limit: "1",
            },
            format: { f: "auto" },
        });
    });

    test("decode image op string with empty action", () => {
        expect(decodeImageOpString("__op__resize__op__format,f_auto")).toEqual({
            resize: {},
            format: { f: "auto" },
        });
    });
});

describe("encodeImageOpString", () => {
    test("encode image op string successful", () => {
        expect(
            encodeImageOpString({
                format: { f: "auto" },
                resize: {
                    m: "lfit",
                    limit: "1",
                    h: "100",
                    w: "100",
                },
                quality: { q: "90" },
            }),
        ).toEqual(
            "__op__resize,m_lfit,w_100,h_100,limit_1__op__quality,q_90__op__format,f_auto",
        );
    });

    test("encode image op string with empty args", () => {
        expect(
            encodeImageOpString({
                format: { f: "auto" },
                resize: {},
                quality: { q: "90" },
            }),
        ).toEqual("__op__resize__op__quality,q_90__op__format,f_auto");
    });

    test("encode image op string with nonexistent args", () => {
        expect(
            encodeImageOpString({
                format: { f: "auto" },
                resize: {
                    nonexistent: "nonexistent",
                },
                quality: { q: "90" },
            }),
        ).toEqual("__op__resize__op__quality,q_90__op__format,f_auto");
    });

    test("encode image op string with nonexistent action", () => {
        expect(
            encodeImageOpString({
                format: { f: "auto" },
                nonexistent: {
                    arg: "arg",
                },
                quality: { q: "90" },
            }),
        ).toEqual("__op__quality,q_90__op__format,f_auto");
    });
});
