// Dependency-free Firestore REST adapter. Credentials come from server environment variables only.
let cachedToken;
const b64 = value => btoa(String.fromCharCode(...new TextEncoder().encode(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
export function encode(value) {
    if (value === null || value === undefined) return {nullValue: null};
    if (typeof value === 'boolean') return {booleanValue: value};
    if (typeof value === 'number') return Number.isInteger(value) ? {integerValue: String(value)} : {doubleValue: value};
    if (typeof value === 'string') return {stringValue: value};
    if (Array.isArray(value)) return {arrayValue: {values: value.map(encode)}};
    return {mapValue: {fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]))}};
}
export function decode(value) {
    if ('nullValue' in value) return null;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
    if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k,v]) => [k, decode(v)]));
    return value.stringValue;
}
async function accessToken(env) {
    const account = {client_email: env.FIREBASE_CLIENT_EMAIL, private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')};
    if (cachedToken?.email === account.client_email && cachedToken.expires > Date.now()) return cachedToken.token;
    const now = Math.floor(Date.now() / 1000);
    const unsigned = b64(JSON.stringify({alg: 'RS256', typ: 'JWT'})) + '.' + b64(JSON.stringify({iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600}));
    const raw = Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('pkcs8', raw, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
    const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
    const jwt = unsigned + '.' + btoa(String.fromCharCode(...signature)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const response = await fetch('https://oauth2.googleapis.com/token', {method: 'POST', body: new URLSearchParams({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt})});
    const data = await response.json();
    if (!response.ok) throw new Error('Database authentication failed. Check the Firebase server credentials.');
    cachedToken = {email: account.client_email, token: data.access_token, expires: Date.now() + 3300000};
    return cachedToken.token;
}
export class Firestore {
    constructor(env) { this.env = env; this.root = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`; }
    async request(path, body, method = 'POST') {
        const response = await fetch('https://firestore.googleapis.com/v1/' + this.root + path, {method, headers: {Authorization: 'Bearer ' + await accessToken(this.env), 'Content-Type': 'application/json'}, ...(method !== 'GET' ? {body: JSON.stringify(body)} : {})});
        if (response.status === 404) return null;
        const data = await response.json();
        if (!response.ok) throw Object.assign(new Error('Database request failed.'), {code: data.error?.status});
        return data;
    }
    unpack(doc) { return doc ? decode({mapValue: {fields: doc.fields}}) : null; }
    async get(path) { return this.unpack(await this.request('/' + path, null, 'GET')); }
    write(path, value) { return {update: {name: this.root + '/' + path, fields: encode(value).mapValue.fields}}; }
    async set(path, value) { await this.request(':commit', {writes: [this.write(path, value)]}); }
    async list(collection, cursor = '', pageSize = 50) {
        const params = new URLSearchParams({pageSize: String(pageSize)});
        if (cursor) params.set('pageToken', cursor);
        const data = await this.request('/' + collection + '?' + params, null, 'GET');
        return {items: (data?.documents || []).map(doc => this.unpack(doc)), cursor: data?.nextPageToken || ''};
    }
    async query(collection, field, value, limit = 100) {
        const data = await this.request(':runQuery', {structuredQuery: {from: [{collectionId: collection}], where: {fieldFilter: {field: {fieldPath: field}, op: 'EQUAL', value: encode(value)}}, limit}});
        return (data || []).filter(x => x.document).map(x => this.unpack(x.document));
    }
    async transaction(paths, action) {
        for (let attempt = 0; attempt < 4; attempt++) {
            const {transaction} = await this.request(':beginTransaction', {});
            try {
                const data = await this.request(':batchGet', {documents: paths.map(p => this.root + '/' + p), transaction});
                const docs = Object.fromEntries(data.map(x => [(x.found?.name || x.missing).slice(this.root.length + 1), this.unpack(x.found)]));
                const {writes, result} = action(docs);
                await this.request(':commit', {transaction, writes: writes.map(([path, value]) => this.write(path, value))});
                return result;
            } catch (error) {
                await this.request(':rollback', {transaction}).catch(() => {});
                if (error.code !== 'ABORTED' || attempt === 3) throw error;
            }
        }
    }
}
