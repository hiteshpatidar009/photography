import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, relative, extname, join} from 'node:path';
import {Readable} from 'node:stream';
import {loadEnv, root} from './configure.mjs';
import api from '../api/index.js';

Object.assign(process.env, await loadEnv());
await import('./build.mjs');
const directory = join(root,'dist');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json'};
const server = createServer(async (req,res) => {
    try {
        const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost:8765'));
        if (url.pathname.startsWith('/api/')) {
            const request = new Request(url, {method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
            const response = await api.fetch(request);
            res.writeHead(response.status,Object.fromEntries(response.headers));
            if(response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
            return;
        }
        if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
        const decoded=decodeURIComponent(url.pathname);
        const target=resolve(directory,'.'+(decoded==='/'?'/index.html':decoded));
        const local=relative(directory,target);
        if(local.startsWith('..') || local.split(/[\\/]/).some(part=>part.startsWith('.')) || !(await stat(target)).isFile()){res.writeHead(404);res.end('Not found');return;}
        res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
        res.end(req.method==='HEAD'?undefined:await readFile(target));
    }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end(error.code==='ENOENT'?'Not found':'Unable to serve request.');}
});
server.listen(Number(process.env.PORT||8765),'127.0.0.1',()=>console.log(`Local website + API: http://127.0.0.1:${server.address().port}/admin.html${process.argv.includes('--demo')?' (local demo)':''}`));
