import http from "node:http";
import "dotenv/config";
import type { StrategyQueryRequset, StrategyQueryResponse } from "@fam/strategy-service-type";
import { feedbackLoopController } from "./feedbackLoop.js";

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
        .on("end", () => {
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
                    service: {
                        name: "",
                        namespace: "",
                    },
                };
                try {
                    const queryRequest: StrategyQueryRequset = JSON.parse(body);
                    console.log(queryRequest);
                    response.statusCode = 200;
                    queryResponse.result = { cpu: 50, type: "Utilization" };
                    if (queryRequest.responseTime === 0) {
                        feedbackLoopController.stop(queryRequest);
                    } else {
                        feedbackLoopController.stratNew(queryRequest);
                    }
                } catch (error) {
                    response.statusCode = 400;
                    queryResponse.success = false;
                    queryResponse.error = JSON.stringify(error);
                } finally {
                    response.end(JSON.stringify(queryResponse));
                }
            } else {
                response.statusCode = 404;
                response.end(JSON.stringify({ error: "Not Found" }));
            }
        });
}).listen(3002);
