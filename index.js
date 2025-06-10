import { Miniflare } from "miniflare";

const mf = new Miniflare({
    port: 8787,
    // inspectorPort: 9229,
    workers: [
        {
            name: "my-worker",
            modules: true,
            script: `
                export default {
                    fetch(request) {
                        console.log('Fetch event received in My Worker', request.method, request.url);
                        return new Response('Hello from My Worker!');
                    },
                }
            `,
            // This will print out logs from both my-worker and tail-worker
            // Replacing tail consumer to "proxy-worker" will only print logs from my-worker
            tails: ['tail-worker'],
        },
        {
            name: "proxy-worker",
            compatibilityFlags: ["experimental"],
            modules: true,
            script: `
                import { WorkerEntrypoint } from 'cloudflare:workers';
                
                export default class RPCProxyWorker extends WorkerEntrypoint {
                    async fetch(request) {
                        return this.env.FETCHER.fetch(request);
                    }
                
                    constructor(ctx, env) {
                        super(ctx, env);
                        return new Proxy(this, {
                            get(target, prop) {
                                if (Reflect.has(target, prop)) {
                                    return Reflect.get(target, prop);
                                }
                
                                return Reflect.get(target.env.RPC_WORKER, prop);
                            },
                        });
                    }
                }
            `,
            serviceBindings: {
                FETCHER: 'tail-worker',
                RPC_WORKER: 'tail-worker',
            }
        },
        {
            name: "tail-worker",
            compatibilityFlags: ["experimental"],
            modules: true,
            script: `
                import { WorkerEntrypoint } from 'cloudflare:workers';
                
                export default class TailWorker extends WorkerEntrypoint {
                    fetch() {
                        return new Response('Hello from Tail Worker!');
                    }
                    tail(events) {
                        console.log('Tail event received:', events);
                    } 
                }

                // Same issue with non WorkerEntrypoint export
                // export default {
                //     fetch() {
                //         return new Response('Hello from Tail Worker!');
                //     },
                //     tail(events) {
                //         console.log('Tail event received:', events);
                //     } 
                // }
            `
        }
    ]
});

await mf.ready;
