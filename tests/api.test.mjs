import test from 'node:test';
import assert from 'node:assert/strict';
import service from '../server/service.mjs';
import {Firestore,decode} from '../server/firestore.mjs';
const records=new Map();
Firestore.prototype.get=async function(path){return structuredClone(records.get(path)||null);};
Firestore.prototype.set=async function(path,value){records.set(path,structuredClone(value));};
Firestore.prototype.transaction=async function(paths,action){const {writes,result}=action(Object.fromEntries(paths.map(path=>[path,structuredClone(records.get(path)||null)])));for(const [path,value]of writes)records.set(path,structuredClone(value));return result;};
Firestore.prototype.list=async function(collection){return {items:[...records].filter(([key])=>key.startsWith(collection+'/')).map(([,value])=>structuredClone(value)),cursor:''};};
Firestore.prototype.query=async function(collection,key,value){return (await this.list(collection)).items.filter(item=>item[key]===value);};
Firestore.prototype.request=async function(path,body){assert.equal(path,':commit');for(const write of body.writes){const id=write.update.name.split('/documents/')[1];records.set(id,decode({mapValue:{fields:write.update.fields}}));}return {};};
const env={FIREBASE_PROJECT_ID:'test',FIREBASE_API_KEY:'test',FIREBASE_CLIENT_EMAIL:'server@test',FIREBASE_PRIVATE_KEY:'test',IMGBB_API_KEY:'test',ADMIN_UID:'root'};
const identities={root:{localId:'root',emailVerified:true,email:'root@test'},guest:{localId:'guest',emailVerified:true,email:'guest@test'},bride:{localId:'bride',emailVerified:true,email:'bride@test'},unverified:{localId:'unverified',emailVerified:false,email:'new@test'}};
let hostUploads=0;
globalThis.fetch=async function(url,options){if(String(url).includes('accounts:lookup')){const token=JSON.parse(options.body).idToken;return Response.json(identities[token]?{users:[identities[token]]}:{error:{}},{status:identities[token]?200:400});}if(String(url).includes('api.imgbb.com')){hostUploads++;return Response.json({success:true,data:{url:'https://i.ibb.co/photo.jpg',thumb:{url:'https://i.ibb.co/thumb.jpg'},delete_url:'https://ibb.co/private-delete'}});}throw new Error('Unexpected network call '+url);};
const call=async(path,{token,body,method}={})=>{const response=await service.fetch(new Request('https://api.test'+path,{method:method||(body?'POST':'GET'),headers:{Origin:'https://api.test',...(token?{Authorization:'Bearer '+token}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined}),env);return {status:response.status,data:await response.json()};};
test('production denies anonymous mutations, unverified accounts and unauthorized origins',async()=>{
    assert.equal((await call('/admin/settings',{body:{}})).status,401);
    assert.equal((await call('/me',{token:'unverified'})).status,403);
    const response=await service.fetch(new Request('https://api.test/public',{headers:{Origin:'https://evil.test'}}),env);assert.equal(response.status,403);
});
test('missing server credentials explain setup without leaking configured secrets',async()=>{
    const response=await service.fetch(new Request('https://api.test/me'),{...env,FIREBASE_CLIENT_EMAIL:'',FIREBASE_PRIVATE_KEY:''});
    assert.equal(response.status,503);
    const {error}=await response.json();
    assert.match(error,/FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY/);
    assert.match(error,/restart or redeploy/);
    assert.equal(error.includes('Bearer'),false);
});
test('bootstrap role is assigned only to configured UID; new users are guests',async()=>{
    assert.equal((await call('/me',{token:'root'})).data.user.role,'admin');
    assert.equal((await call('/me',{token:'guest'})).data.user.role,'guest');
    assert.equal((await call('/admin/role',{token:'guest',body:{uid:'guest',role:'admin'}})).status,403);
    assert.equal((await call('/admin/role',{token:'root',body:{uid:'root',role:'guest'}})).status,400);
});
test('automatic publication, exact duplicates and public privacy',async()=>{
    records.set('settings/site',{uploadsEnabled:true,sideLimit:1,guestLimit:1,dailyLimit:3});
    records.set('users/bride',{uid:'bride',name:'Bride member',role:'bride',disabled:false});
    const form=()=>{const data=new FormData();data.set('image',new Blob([new Uint8Array([255,216,255,192,0,11,8,3,32,4,176,1,1,17,0,255,217])],{type:'image/jpeg'}),'photo.jpg');data.set('date','2026-11-01');data.set('caption','A memory');return data;};
    const first=await call('/upload',{token:'bride',body:form()});assert.equal(first.status,200);assert.equal(first.data.photo.side,'bride');assert.equal(hostUploads,1);
    assert.equal((await call('/upload',{token:'bride',body:form()})).status,409);
    assert.equal((await call('/upload',{token:'guest',body:form()})).status,409);assert.equal(hostUploads,1);
    const publicData=(await call('/public')).data;assert.equal(publicData.photos.length,1);assert.equal(publicData.photos[0].deleteUrl,undefined);assert.equal(publicData.photos[0].owner,undefined);
    const id=first.data.photo.id;
    await call('/admin/photo',{token:'root',body:{id,status:'hidden',featured:false}});assert.equal((await call('/public')).data.photos.length,0);
    await call('/admin/photo',{token:'root',body:{id,status:'published',featured:true}});
    await call('/admin/album',{token:'root',body:{date:'2026-11-01',title:'Preparations',archived:true,musicUrl:''}});assert.equal((await call('/public')).data.photos.length,0);
    await call('/admin/album',{token:'root',body:{date:'2026-11-01',title:'Preparations',archived:false,musicUrl:''}});assert.equal((await call('/public')).data.photos.length,1);
    const home=await call('/public?home=1');assert.equal(home.data.featured.length,1);assert.equal(home.data.featured[0].deleteUrl,undefined);
});
test('photo download proxy rejects guests and unapproved hosts',async()=>{
    const id='a'.repeat(64);records.set('photos/'+id,{id,src:'https://internal.example/secrets'});
    assert.equal((await call('/admin/download?id='+id,{token:'bride'})).status,403);
    assert.equal((await call('/admin/download?id='+id,{token:'root'})).status,400);
});
test('disabled account loses access and cannot retrieve other users',async()=>{
    await call('/admin/role',{token:'root',body:{uid:'guest',role:'guest',disabled:true}});
    assert.equal((await call('/me',{token:'guest'})).status,403);
    assert.equal((await call('/admin/list?collection=users',{token:'bride'})).status,403);
});

test('more than ten uploads in one day succeed even with obsolete zero limits',async()=>{
    records.set('settings/site',{uploadsEnabled:true,sideLimit:0,guestLimit:0,dailyLimit:0});
    for(let i=2;i<14;i++){
        const data=new FormData();
        data.set('image',new Blob([new Uint8Array([255,216,255,192,0,11,8,3,32,4,176,1,1,17,i,255,217])],{type:'image/jpeg'}),'photo.jpg');
        data.set('date','2026-11-01');
        assert.equal((await call('/upload',{token:'bride',body:data})).status,200);
    }
    assert.equal([...records.keys()].some(key=>key.startsWith('quotas/')),false);
});

test('homepage banner preserves admin order and excludes hidden, archived and missing photos',async()=>{
    const ids=['b','c','d','e','f'].map(x=>x.repeat(64));
    for(let i=0;i<4;i++) records.set('photos/'+ids[i],{id:ids[i],status:i===2?'hidden':'published',date:i===3?'2026-10-01':'2026-11-01',src:'https://i.ibb.co/banner.jpg',owner:'private',deleteUrl:'private'});
    records.set('albums/2026-10-01',{date:'2026-10-01',archived:true});
    const body={startDate:'2027-02-08',events:[],bannerPhotoIds:[ids[1],ids[0],ids[2],ids[3],ids[4]],bannerMotion:false,bannerOverlay:50};
    assert.equal((await call('/admin/settings',{token:'bride',body})).status,403);
    assert.equal((await call('/admin/settings',{token:'root',body})).status,200);
    const home=(await call('/public?home=1')).data;
    assert.deepEqual(home.banner.map(p=>p.id),[ids[1],ids[0]]);
    assert.equal(home.banner[0].owner,undefined);
    assert.equal(home.banner[0].deleteUrl,undefined);
    assert.equal(home.settings.bannerMotion,false);
    assert.deepEqual((await call('/public')).data.banner,[]);
});
