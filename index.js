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
                    fetch(request, env) {
                        console.log('Fetch event received in My Worker', request.method, request.url);
                        return env.SERVICE.fetch(request);
                    },
                }
            `,
            serviceBindings: {
                SERVICE: 'proxy-worker',
            },
            // This will print out logs from both my-worker and tail-worker
            // Replacing tail consumer to "proxy-worker" will only print logs from my-worker
            tails: ['proxy-worker'],
        },
        {
            name: "proxy-worker",
            compatibilityDate: '2025-01-01',
            compatibilityFlags: ["experimental"],
            modules: true,
            script: `
                import { WorkerEntrypoint } from 'cloudflare:workers';
                
                export default class RPCProxyWorker extends WorkerEntrypoint {
                    async fetch(request) {
                        console.log('Fetch event received in Proxy Worker');
                        // Test if we can call tail handler manually
                        await this.env.SERVICE.tail(['Proxy worker calling tail handler of tail-worker']);
                        return this.env.SERVICE.fetch(request);
                    }

                    async tail(events) {
                        console.log('Tail event received in Proxy Worker:', events);
                        await Promise.all([
                            this.env.SERVICE.tail(events),
                            this.env.SERVICE.fetch('http://example.com'),
                        ]);
                    }
                }
            `,
            serviceBindings: {
                SERVICE: 'tail-worker',
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
                        console.log('Fetch event received in Tail Worker');
                        return new Response('Hello from Tail Worker!');
                    }
                    tail(events) {
                        console.log('Tail event received in Tail Worker:', events);
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
