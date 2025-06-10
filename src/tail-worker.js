// export default {
//     fetch() {
//         return new Response('Hello from Tail Worker!');
//     },
//     tail(events) {
//         console.log('Tail event received:', events);
//     } 
// }
import { WorkerEntrypoint } from 'cloudflare:workers';

export default class TailWorker extends WorkerEntrypoint {
    fetch() {
        return new Response('Hello from Tail Worker!');
    }
    tail(events) {
        console.log('Tail event received:', events);
    } 
}