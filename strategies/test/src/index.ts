import http from "node:http";
import type { StrategyQueryRequset, StrategyQueryResponse } from "./types.js";

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
                    result: {
                        cpuUtilization: 0,
                    },
                };
                try {
                    const queryRequest: StrategyQueryRequset = JSON.parse(body);
                    console.log(queryRequest);
                    response.statusCode = 200;
                    queryResponse.result.cpuUtilization = queryRequest.responseTime;
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
