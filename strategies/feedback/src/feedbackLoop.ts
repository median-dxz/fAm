import type { StrategyQueryRequset } from "@fam/strategy-service-type";
import { setTimeout } from "node:timers/promises";
import { prometheus } from "./clients/prometheus.js";
import { famController } from "./clients/controller.js";

const T = Number(process.env["INTERVAL"]);
const [kp, ki, kd, pf, t, InitialValue] = [1, 1, 1, 0.5, 60 * T, 50];

const PQL = (ns: string, svc: string) =>
    `rate(
    istio_request_duration_milliseconds_sum{destination_service_namespace="${ns}",destination_service_name="${svc}",reporter="source",response_flags="-"}[1m]
)
/
rate(
    istio_request_duration_milliseconds_count{destination_service_namespace="${ns}",destination_service_name="${svc}",reporter="source",response_flags="-"}[1m]
)`;

interface FeedbackLoopController {
    loops: FeedbackLoop[];
    stratNew(query: StrategyQueryRequset): Promise<void>;
    stop(query: StrategyQueryRequset): Promise<void>;
}

export const feedbackLoopController: FeedbackLoopController = {
    loops: [],
    async stratNew(reqest: StrategyQueryRequset) {
        const i = this.loops.findIndex((loop) => loop.id === `${reqest.service.namespace}.${reqest.service.name}`);
        if (i != -1) {
            console.log(`Loop for ${this.loops.at(i)!.id} already exists, stopping it.`);
            await this.loops.at(i)!.stop();
        }

        const loop = new FeedbackLoop(reqest);
        this.loops.push(loop);

        console.log(`Starting loop for ${loop.id} at: ${new Date().toLocaleString()}`);
        void loop.run().then(() => {
            console.log(`Loop for ${loop.id} has finished.`);
            const i = this.loops.findIndex((loop) => loop.id === `${reqest.service.namespace}.${reqest.service.name}`);
            if (i != -1) {
                this.loops.splice(i, 1);
            }
        });
    },
    async stop(reqest: StrategyQueryRequset) {
        const i = this.loops.findIndex((loop) => loop.id === `${reqest.service.namespace}.${reqest.service.name}`);
        if (i != -1) {
            console.log(`Stopping loop for ${this.loops.at(i)!.id}.`);
            await this.loops.at(i)!.stop();
        }
    },
};

export class FeedbackLoop {
    optimal = { e: NaN, v: NaN };
    historyError: number[] = [];
    lastValue: number = InitialValue;
    count = 0;
    readonly ac = new AbortController();
    readonly svc;
    readonly ns;
    readonly target;

    constructor({ responseTime, service }: StrategyQueryRequset) {
        this.target = responseTime;
        this.ns = service.namespace;
        this.svc = service.name;
    }

    get id() {
        return `${this.ns}.${this.svc}`;
    }

    next(rt: number) {
        const e = this.target - rt;

        const u =
            (kp + e < 0 ? pf * kp : 0) * e +
            ki * this.historyError.reduce((a, b) => a + b, e) +
            kd * (e - (this.historyError.at(-1) ?? e));

        let res = this.lastValue + u;
        res = Math.max(1, res);
        res = Math.min(100, res);

        return Math.round(res);
    }

    async run() {
        while (!this.ac.signal.aborted) {
            try {
                await setTimeout(t * 1000, undefined, { signal: this.ac.signal });
                const rt = await this.getResponseTime();

                console.log(`[Loop][${this.id} #${this.count}]: last: ${this.lastValue} -> ${rt}ms`);

                if (isNaN(rt)) {
                    continue;
                }

                const e = Math.abs(this.target - rt);
                if (isNaN(this.optimal.e) || e < this.optimal.e) {
                    this.optimal = { e, v: this.lastValue };
                }

                if (this.count === 6) {
                    break;
                }

                const nextValue = this.next(rt);
                this.lastValue = nextValue;
                console.log(`[Loop][${this.id} #${this.count}]: next: ${nextValue}`);
                this.count++;

                await this.apply(nextValue);
            } catch (error) {
                console.log(error);
            }
        }
        if (!this.ac.signal.aborted && !isNaN(this.optimal.e)) {
            console.log(`[Loop][${this.id}]: Applying optimal value: ${this.optimal.v}`);
            await this.apply(this.optimal.v);
        }
    }

    async stop() {
        this.ac.abort("Loop is stoped by controller.");
    }

    async getResponseTime() {
        let rt = NaN;
        try {
            const res = await prometheus.query<object, "vector">(
                { query: PQL(this.ns, this.svc) },
                { signal: this.ac.signal }
            );
            // console.log(`response: ${JSON.stringify(res)}`);
            rt = Number(res.data.result[0].value[1]);
        } catch (e) {
            console.log(e);
        }
        return rt;
    }

    async apply(v: number) {
        return famController.apply(
            {
                service: {
                    namespace: this.ns,
                    name: this.svc,
                },
                result: {
                    cpu: v,
                    type: "Utilization",
                },
                success: true,
            },
            { signal: this.ac.signal }
        );
    }
}
