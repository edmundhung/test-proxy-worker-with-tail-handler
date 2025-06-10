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