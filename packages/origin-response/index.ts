import { S3Client } from "@aws-sdk/client-s3";
import util from "util";
import cfHandler from "./handler/cfHandler";
import { loadEnv } from "./utils";

const { NODE_ENV, REGION, ENDPOINT, AK, SK } = loadEnv();

// 生产环境运行在 AWS Lambda 上，不需要配置 AK 和 SK
const s3Client = new S3Client(
    NODE_ENV === "development"
        ? {
              credentials: {
                  accessKeyId: AK || "",
                  secretAccessKey: SK || "",
              },
              region: REGION,
              endpoint: ENDPOINT,
          }
        : {},
);

export async function handler(event: CfOriginResponseEvent) {
    console.log("Response event:\n", util.inspect(event, { depth: 8 }));
    return await cfHandler(event, s3Client);
}
