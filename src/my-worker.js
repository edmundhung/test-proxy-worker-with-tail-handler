export default {
    fetch(request) {
        console.log('Fetch event received in My Worker', request.method, request.url);
        return new Response('Hello from My Worker!');
    },
}