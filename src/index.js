// set env
require("dotenv").config({
    path: process.env.NODE_ENV === "development" ? ".env.dev" : ".env.prod",
});
// require module
const { S3Client } = require("@aws-sdk/client-s3");
const util = require("util");
const apiHandler = require("./handler/apiHandler");
const cfHandler = require("./handler/cfHandler");

console.log("env: ", process.env);

const { NODE_ENV, REGION, ENDPOINT, AK, SK } = process.env;
// 生产环境运行在 AWS Lambda 上，不需要配置 AK 和 SK
const s3Client = new S3Client(
    NODE_ENV === "development"
        ? {
              credentials: {
                  accessKeyId: AK,
                  secretAccessKey: SK,
              },
              region: REGION,
              endpoint: ENDPOINT,
          }
        : {
              region: REGION,
              endpoint: ENDPOINT,
          }
);

exports.handler = async (event) => {
    console.log(
        "Reading options from event:\n",
        util.inspect(event, { depth: 8 })
    );
    const eventMode = event?.Records instanceof Array ? "cf" : "api";

    if (eventMode === "cf") {
        return await cfHandler(event, s3Client);
    } else {
        return await apiHandler(event, s3Client);
    }
};
