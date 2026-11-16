import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import api from '../api/index.js';
import service from '../server/service.mjs';

test('Vercel entry point forwards direct paths, query strings and authenticated uploads',async()=>{
    const original=service.fetch;
    service.fetch=async(request,env)=>{
        assert.equal(new URL(request.url).pathname,'/upload');
        assert.equal(new URL(request.url).searchParams.get('test'),'yes');
        assert.equal(request.headers.get('Authorization'),'Bearer test-token');
        assert.equal((await request.formData()).get('caption'),'A memory');
        assert.equal(env,process.env);
        return Response.json({ok:true});
    };
    try{const form=new FormData();form.set('caption','A memory');const response=await api.fetch(new Request('https://wedding.vercel.app/api/upload?test=yes',{method:'POST',headers:{Authorization:'Bearer test-token'},body:form}));assert.equal(response.status,200);}
    finally{service.fetch=original;}
});
test('Vercel rewritten API path retains pagination parameters',async()=>{
    const original=service.fetch;
    service.fetch=async request=>{const url=new URL(request.url);assert.equal(url.pathname,'/admin/list');assert.equal(url.searchParams.get('cursor'),'next-page');assert.equal(url.searchParams.get('route'),null);return new Response(null,{status:204});};
    try{assert.equal((await api.fetch(new Request('https://wedding.vercel.app/api/index?route=admin/list&cursor=next-page'))).status,204);}
    finally{service.fetch=original;}
});
test('Vercel config routes API separately and builds only public static output',async()=>{
    const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
    assert.equal(config.outputDirectory,'dist');
    assert.equal(config.rewrites[0].destination,'/api/index?route=:path*');
    assert.equal(config.functions['api/index.js'].maxDuration,60);
});
