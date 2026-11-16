import service from '../server/service.mjs';

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const route = url.pathname === '/api/index' || url.pathname === '/api/index.js'
            ? url.searchParams.get('route') || '' : url.pathname.replace(/^\/api\/?/, '');
        url.pathname = '/' + route.replace(/^\/+/, '');
        url.searchParams.delete('route');
        return service.fetch(new Request(url, request), process.env);
    }
};
