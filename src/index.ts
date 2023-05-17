import { datadog } from "datadog-lambda-js";
import tracer from "dd-trace";
tracer.init();

async function handler(event: any): Promise<any> {
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: 'Go Serverless v1.0! Your function executed successfully!',
                input: event,
            },
            null,
            2
        ),
    };
}

export const main = datadog(handler);
