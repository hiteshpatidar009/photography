import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEnv} from 'node:util';
import {publicRuntime,validateLive,loadEnv} from '../scripts/configure.mjs';
const env={FIREBASE_API_KEY:'public-key',FIREBASE_AUTH_DOMAIN:'wedding.firebaseapp.com',FIREBASE_PROJECT_ID:'wedding',FIREBASE_APP_ID:'web-id',ADMIN_UID:'owner-uid',IMGBB_API_KEY:'private-imgbb-key',FIREBASE_CLIENT_EMAIL:'backend@wedding.iam.gserviceaccount.com',FIREBASE_PRIVATE_KEY:'-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'};
test('browser config uses same-origin API and excludes every server secret',()=>{
    const result=publicRuntime(env),json=JSON.stringify(result);
    assert.equal(result.apiBase,'/api');assert.equal(result.firebase.projectId,'wedding');
    for(const secret of ['private-imgbb-key',env.FIREBASE_CLIENT_EMAIL,env.FIREBASE_PRIVATE_KEY,'owner-uid'])assert.equal(json.includes(secret),false);
    assert.deepEqual(Object.keys(result).sort(),['analyticsEnabled','apiBase','demo','firebase']);
});
test('demo requires explicit local opt-in and is disabled on Vercel',()=>{
    assert.equal(publicRuntime({}).demo,false);
    assert.equal(publicRuntime({},true).demo,true);
    assert.equal(publicRuntime({...env,VERCEL:'1'},true).demo,false);
    assert.throws(()=>publicRuntime({VERCEL:'1'}),/four Firebase/);
});
test('live configuration checks required fields without printing credentials',()=>{
    assert.equal(validateLive(env),true);
    assert.throws(()=>validateLive({...env,FIREBASE_CLIENT_EMAIL:''}),/FIREBASE_CLIENT_EMAIL/);
    assert.throws(()=>validateLive({...env,FIREBASE_CLIENT_EMAIL:'another@other.iam.gserviceaccount.com'}),/project/);
    assert.throws(()=>validateLive({...env,FIREBASE_PRIVATE_KEY:'bad-private-value'}),error=>!error.message.includes('bad-private-value'));
});
test('private key dotenv escapes are normalized to PEM newlines',()=>{
    const parsed=parseEnv('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----"\n');
    assert.equal(parsed.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n'),'-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----');
});
test('deployment environment takes precedence over local .env',async()=>{
    const prior=process.env.FIREBASE_PROJECT_ID;
    process.env.FIREBASE_PROJECT_ID='deployment-project';
    try{assert.equal((await loadEnv()).FIREBASE_PROJECT_ID,'deployment-project');}
    finally{if(prior===undefined)delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=prior;}
});
