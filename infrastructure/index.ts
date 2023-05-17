import * as aws from "@pulumi/aws";
import {enums} from "@pulumi/aws/types";
import * as pulumi from "@pulumi/pulumi";

async function main() {
    const assumeRole = aws.iam.getPolicyDocument({
        statements: [{
            effect: "Allow",
            principals: [{
                type: "Service",
                identifiers: ["lambda.amazonaws.com"],
            }],
            actions: ["sts:AssumeRole"],
        }],
    });
    const role = new aws.iam.Role("midu-test-role", {assumeRolePolicy: assumeRole.then(assumeRole => assumeRole.json)});

    const lambdaLoggingPolicyDocument = aws.iam.getPolicyDocument({
        statements: [{
            effect: "Allow",
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ],
            resources: ["arn:aws:logs:*:*:*"],
        }],
    });
    const lambdaLoggingPolicy = new aws.iam.Policy("midu-test-policy-logging", {
        path: "/",
        description: "IAM policy for logging from a lambda",
        policy: lambdaLoggingPolicyDocument.then(lambdaLoggingPolicyDocument => lambdaLoggingPolicyDocument.json),
    });
    const lambdaLogs = new aws.iam.RolePolicyAttachment("midu-test-logs", {
        role: role.name,
        policyArn: lambdaLoggingPolicy.arn,
    });

    await new aws.lambda.Function(
        "midu-test-function",
        {
            name: "midu-test",
            handler: "index.main",
            code: new pulumi.asset.FileArchive("../dist"),
            runtime: enums.lambda.Runtime.NodeJS18dX,
            layers: aws.getRegionOutput().apply((region) => [
                `arn:aws:lambda:${region.name}:464622532012:layer:Datadog-Extension:43`,
            ]),
            architectures: ["x86_64"],
            role: role.arn,
            timeout: 60,
            memorySize: 256,
            environment: {
                variables: {
                    DD_SITE_ID: "datadoghq.com",
                    DD_API_KEY: "your-api-key",
                    DD_SERVERLESS_LOGS_ENABLED: "false",
                    DD_ENV: "midu",
                    DD_SERVICE: "midu-test",
                    DD_TAGS: "team:midu-test,project:dd-lambda-bundler",
                    DD_CAPTURE_LAMBDA_PAYLOAD: "true",
                    DD_LOG_LEVEL: "debug",
                    DD_TRACE_DEBUG: "true",
                    NODE_OPTIONS: "--enable-source-maps",
                },
            },
        },
        {
            dependsOn: [lambdaLogs]
        }
    );
}

export = main();
