import { Miniflare } from "miniflare";

const mf = new Miniflare({
    port: 8787,
    // inspectorPort: 9229,
    workers: [
        {
            name: "my-worker",
            modules: true,
            scriptPath: "./src/my-worker.js",
            // This will print out logs from both my-worker and tail-worker
            // But pointing the tail consumer to the proxy-worker will only print logs from my-worker
            tails: ['tail-worker'],
        },
        {
            name: "proxy-worker",
            compatibilityFlags: ["experimental"],
            modules: true,
            scriptPath: "./src/proxy-worker.js",
            serviceBindings: {
                FETCHER: 'tail-worker',
                RPC_WORKER: 'tail-worker',
            }
        },
        {
            name: "tail-worker",
            compatibilityFlags: ["experimental"],
            modules: true,
            scriptPath: "./src/tail-worker.js",
        }
    ]
});

await mf.ready;
