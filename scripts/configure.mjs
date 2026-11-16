import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseEnv} from 'node:util';
export const root = resolve(import.meta.dirname, '..');
const publicKeys = ['FIREBASE_API_KEY','FIREBASE_AUTH_DOMAIN','FIREBASE_PROJECT_ID','FIREBASE_APP_ID'];
export function publicRuntime(env, demo = false) {
    if (env.VERCEL && publicKeys.some(key => !env[key])) throw new Error('Set the four Firebase Web App environment variables in Vercel, then redeploy.');
    return {apiBase: '/api', demo: demo && !env.VERCEL, firebase: {
        apiKey: env.FIREBASE_API_KEY || '', authDomain: env.FIREBASE_AUTH_DOMAIN || '',
        projectId: env.FIREBASE_PROJECT_ID || '', appId: env.FIREBASE_APP_ID || '',
        measurementId: env.FIREBASE_MEASUREMENT_ID || ''
    }, analyticsEnabled: env.FIREBASE_ANALYTICS_ENABLED === 'true'};
}
export function validateLive(env) {
    const missing = [...publicKeys,'FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','IMGBB_API_KEY','ADMIN_UID'].filter(key => !env[key]);
    if (missing.length) throw new Error('Missing environment variables: ' + missing.join(', '));
    if (!env.FIREBASE_CLIENT_EMAIL.endsWith(`@${env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`)) throw new Error('FIREBASE_CLIENT_EMAIL must belong to your Firebase project.');
    if (!env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----') || !env.FIREBASE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----')) throw new Error('FIREBASE_PRIVATE_KEY must contain the complete PEM private key.');
    return true;
}
export async function loadEnv() {
    let local = {};
    try { local = parseEnv(await readFile(join(root,'.env'),'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    return {...local, ...process.env};
}
export async function configurePublic(env = undefined, demo = false) {
    env ??= await loadEnv();
    const runtime = publicRuntime(env, demo);
    const source = '// Generated public configuration. No server credentials.\nexport const runtime = ' + JSON.stringify(runtime,null,4) + ";\nexport const demoMode = runtime.demo && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);\n";
    await writeFile(join(root,'js/app/config.js'),source);
}
async function main() {
    const env = await loadEnv();
    if (process.argv.includes('--check')) validateLive(env);
    await configurePublic(env, process.argv.includes('--demo'));
    console.log('Updated public configuration. API uses /api on the same Vercel domain.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    main().catch(error => { console.error(error.message); process.exitCode=1; });
}
