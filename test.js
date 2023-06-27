const { handler } = require("./src/index");
const sharp = require("sharp");
const queryFile =
    "test.jpg__op__resize,m_lfit,w_700__op__quality,q_80__op__format,f_auto";

async function main() {
    const { output } = await handler({
        queryStringParameters: {
            query: queryFile,
        },
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        },
    });

    console.log("================output file info================");
    const image = await sharp(output);
    const metadata = await image.metadata();
    console.log(metadata);
}

main();
