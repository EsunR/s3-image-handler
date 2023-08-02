import { CLIENT_ERROR_PREFIX } from "@/common/constance";
import { S3Client } from "@aws-sdk/client-s3";
import cfHandler from "./handler/cfHandler";
import { loadEnv } from "./utils";
import { errorResponse } from "./utils/response";

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
        : {
              region: REGION,
          },
);

export function handler(
    event: CfOriginResponseEvent,
    context: LambdaContext,
    callback: LambdaCallback,
) {
    console.log(`Request uri: ${event?.Records?.[0]?.cf?.request?.uri}`);
    cfHandler(event, s3Client)
        .then((response) => {
            callback(null, response);
        })
        .catch((e) => {
            console.log("CloudFront handler exception:\n", e);
            // 只有 validator 的消息才能暴露出去
            const shouldShowErrorMsg =
                e?.message?.includes(CLIENT_ERROR_PREFIX);
            callback(
                null,
                errorResponse({
                    body: shouldShowErrorMsg
                        ? (e.message as string)
                              .replace(CLIENT_ERROR_PREFIX, "")
                              .trim()
                        : "File not exist",
                    statusCode: shouldShowErrorMsg ? 400 : e?.statusCode || 404,
                    response: event.Records[0].cf.response,
                }),
            );
        });
}
