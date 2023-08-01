import { isImageOpUri } from "@/common/utils";

describe("isImageOpUri", () => {
    test("is image op uri", () => {
        expect(isImageOpUri("test.png__op__format,f_auto")).toBe(true);
    });
    test("is not image op uri", () => {
        expect(isImageOpUri("test.png")).toBe(false);
    });
});
