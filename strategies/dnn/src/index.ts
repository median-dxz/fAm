import http from "node:http";
import type { StrategyQueryRequset, StrategyQueryResponse } from "@fam/strategy-service-type";
import fs from "node:fs/promises";
import ort from "onnxruntime-node";
import { fileURLToPath } from "node:url";
import path from "node:path";

let session: ort.InferenceSession;
let workloadMappings: Record<string, number>;

const LimitRate = 0.1;
const base = path.resolve(fileURLToPath(import.meta.url), "../..");

try {
    session = await ort.InferenceSession.create(path.resolve(base, "./model/dnn_model.onnx"));
    workloadMappings = JSON.parse(await fs.readFile(path.resolve(base, "./model/workload_mappings.json"), "utf-8"));
} catch (e) {
    console.error(`failed to inference ONNX model: ${e}.`);
    process.exit(1);
}

async function predict(namespace: string, workload: string, response: number) {
    if (!session) {
        throw new Error("session is not initialized");
    }
    const workloadLabel = workloadMappings[`${namespace}.${workload}`];
    if (workloadLabel == undefined) {
        throw new Error(`workload ${namespace}.${workload} is not found in service mappings.`);
    }

    // prepare inputs. a tensor need its corresponding TypedArray as data
    const dataInput = Float32Array.from([workloadLabel, response]);
    const tensorInput = new ort.Tensor("float32", dataInput, [1, 2]);

    // prepare feeds. use model input names as keys.
    const feeds = { [session.inputNames[0]]: tensorInput };

    // feed inputs and run
    const results = await session.run(feeds);

    // read from results
    const {
        stack_1: { data: resultBuffer },
    } = results;

    const result = Math.round((1 + LimitRate) * Number(resultBuffer[0]));
    console.log(`result: ${result}`);
    return result;
}

http.createServer((request, response) => {
    const { headers, method, url } = request;
    let chunks: any[] = [];
    request
        .on("error", (err) => {
            console.error(err);

            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ error: "Internal Server Error" }));
        })
        .on("data", (chunk) => {
            chunks.push(chunk);
        })
        .on("end", async () => {
            const body = Buffer.concat(chunks).toString();
            response.on("error", (err) => {
                console.error(err);
            });

            response.setHeader("Content-Type", "application/json");
            if (
                method === "POST" &&
                url === "/strategy/api/v1/query" &&
                headers["content-type"] === "application/json"
            ) {
                const queryResponse: StrategyQueryResponse = {
                    success: true,
                };
                try {
                    const queryRequest: StrategyQueryRequset = JSON.parse(body);
                    console.log(queryRequest);
                    response.statusCode = 200;

                    const {
                        workload: { name, namespace },
                        responseTime,
                    } = queryRequest;
                    queryResponse.result = { cpu: await predict(namespace, name, responseTime), type: "AverageValue" };
                } catch (error) {
                    response.statusCode = 400;
                    queryResponse.success = false;
                    queryResponse.error = JSON.stringify(error);
                    console.error(error);
                } finally {
                    response.end(JSON.stringify(queryResponse));
                }
            } else {
                response.statusCode = 404;
                response.end(JSON.stringify({ error: "Not Found" }));
            }
        });
}).listen(3002);
