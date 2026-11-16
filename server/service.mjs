import {Firestore} from './firestore.mjs';
import {ROLES, MAX_IMAGE_BYTES, indiaDay, validDate, requireValue, text, httpsUrl, validateSettings, assertUpload, publicPhoto, jpegDimensions} from '../js/app/domain.js';

const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}});
async function bodyJson(request) {
    const reader = request.body?.getReader();
    requireValue(reader, 'Request body is required.');
    const chunks = []; let bytes = 0;
    while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.length; if (bytes > 50000) { await reader.cancel(); throw Object.assign(new Error('Request too large.'), {status: 413}); } chunks.push(part.value); }
    const raw = await new Blob(chunks).text();
    requireValue(raw.length < 50000, 'Request too large.', 413);
    try { return JSON.parse(raw); } catch (_) { throw Object.assign(new Error('Invalid JSON.'), {status: 400}); }
}
async function identify(request, env, db) {
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
    requireValue(token && token.length < 10000, 'Please sign in.', 401);
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({idToken: token})});
    const data = await response.json();
    const identity = data.users?.[0];
    requireValue(response.ok && identity && !identity.disabled, 'Your session expired. Sign in again.', 401);
    requireValue(identity.emailVerified, 'Verify your email before continuing.', 403);
    const uid = identity.localId;
    requireValue(/^[A-Za-z0-9_-]{1,128}$/.test(uid), 'Unsupported account ID.', 403);
    const path = 'users/' + uid;
    let user = await db.get(path);
    if (!user) {
        user = await db.transaction([path], docs => {
            const profile = docs[path] || {uid, email: identity.email, name: text(identity.displayName || identity.email, 120), role: uid === env.ADMIN_UID ? 'admin' : 'guest', disabled: false, createdAt: new Date().toISOString()};
            return {writes: docs[path] ? [] : [[path, profile]], result: profile};
        });
    }
    if (uid === env.ADMIN_UID && user.role !== 'admin') {
        user = {...user, role: 'admin'};
        await db.set(path, user);
    }
    requireValue(!user.disabled, 'This account has been disabled by the admin.', 403);
    return user;
}
const adminOnly = user => requireValue(user.role === 'admin', 'Admin access required.', 403);
async function auditWrite(db, user, action, target, writes = []) {
    const id = crypto.randomUUID();
    const record = {id, actor: user.uid, name: user.name, action, target, createdAt: new Date().toISOString()};
    await db.request(':commit', {writes: [...writes, ['audit/' + id, record]].map(([path, value]) => db.write(path, value))});
}
async function upload(request, user, db, env) {
    requireValue(Number(request.headers.get('Content-Length') || 0) <= MAX_IMAGE_BYTES + 20000, 'Photo is too large.', 413);
    // Bound the stream even when the client omits Content-Length.
    requireValue(env.IMGBB_API_KEY, 'Image uploads are not configured yet.', 503);
    requireValue(request.body, 'Choose an image.');
    const reader = request.body.getReader(); const chunks = []; let length = 0;
    while (true) { const {done, value} = await reader.read(); if (done) break; length += value.length; if (length > MAX_IMAGE_BYTES + 20000) { await reader.cancel(); throw Object.assign(new Error('Photo is too large.'), {status: 413}); } chunks.push(value); }
    const form = await new Response(new Blob(chunks), {headers: {'Content-Type': request.headers.get('Content-Type')}}).formData();
    const file = form.get('image');
    requireValue(file instanceof Blob, 'Choose an image.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const dimensions = jpegDimensions(bytes);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
    const day = indiaDay(); const date = text(form.get('date'), 10);
    requireValue(validDate(date) && date <= day, 'Choose today or an earlier memory date.');
    const photoPath = 'photos/' + hash;
    const now = new Date().toISOString();
    const photo = await db.transaction(['settings/site', 'users/' + user.uid, photoPath], docs => {
        const settings = docs['settings/site'];
        requireValue(settings, 'The admin must save website settings before uploads open.', 409);
        const current = docs['users/' + user.uid];
        requireValue(current.role === user.role, 'Your role changed. Refresh and retry.', 409);
        assertUpload(current, settings);
        const old = docs[photoPath];
        const retryable = old && old.owner === user.uid && (old.status === 'failed' || (old.status === 'uploading' && Date.now() - Date.parse(old.createdAt) > 600000));
        requireValue(!old || retryable, 'This photo has already been uploaded or is being processed. Interrupted uploads can be retried after 10 minutes.', 409);
        const record = {id: hash, owner: user.uid, side: ['groom','bride'].includes(user.role) ? user.role : user.role === 'admin' ? (['groom','bride'].includes(form.get('side')) ? form.get('side') : 'guest') : 'guest', date, caption: text(form.get('caption'), 500), ...dimensions, status: 'uploading', createdAt: now, featured: false};
        return {writes: [[photoPath, record]], result: record};
    });
    try {
        const outgoing = new FormData(); outgoing.set('image', new Blob([bytes], {type: 'image/jpeg'}), hash + '.jpg');
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {method: 'POST', body: outgoing, signal: AbortSignal.timeout(25000)});
        const data = await response.json();
        requireValue(response.ok && data.success && data.data?.url, 'Image hosting is unavailable. Retry later.', 502);
        const published = {...photo, status: 'published', src: httpsUrl(data.data.url), thumbnail: httpsUrl(data.data.thumb?.url || data.data.url), deleteUrl: httpsUrl(data.data.delete_url), publishedAt: new Date().toISOString()};
        await auditWrite(db, user, 'photo.upload', hash, [[photoPath, published]]);
        return json({photo: publicPhoto(published)});
    } catch (error) {
        await db.set(photoPath, {...photo, status: 'failed'}).catch(() => {});
        throw error;
    }
}
export async function route(request, env) {
    const url = new URL(request.url), path = url.pathname.replace(/\/$/, '') || '/';
    const db = new Firestore(env);
    if (path === '/public' && request.method === 'GET') {
        const [settings, photos, albums] = await Promise.all([db.get('settings/site'), db.list('photos', url.searchParams.get('cursor') || '', 50), db.list('albums', '', 1000)]);
        const hiddenDates = new Set(albums.items.filter(x => x.archived).map(x => x.date));
        const featured = url.searchParams.get('home') === '1' ? (await db.query('photos', 'featured', true, 50)).filter(p => p.status === 'published' && !hiddenDates.has(p.date)).slice(0,12).map(publicPhoto) : [];
        return json({settings, photos: photos.items.filter(p => p.status === 'published' && !hiddenDates.has(p.date)).map(publicPhoto), featured, albums: albums.items.filter(x => !x.archived), cursor: photos.cursor});
    }
    const user = await identify(request, env, db);
    if (path === '/me' && request.method === 'GET') {
        return json({user});
    }
    if (path === '/upload' && request.method === 'POST') return upload(request, user, db, env);
    if (path === '/my-photos' && request.method === 'GET') {
        const photos = await db.query('photos', 'owner', user.uid, 100);
        return json({items: photos.map(({deleteUrl, ...photo}) => photo)});
    }
    adminOnly(user);
    if (path === '/admin/download' && request.method === 'GET') {
        const id = url.searchParams.get('id');
        requireValue(/^[a-f0-9]{64}$/.test(id), 'Invalid photo ID.');
        const photo = await db.get('photos/' + id);
        requireValue(photo?.src, 'Photo not found.', 404);
        const source = new URL(photo.src);
        requireValue(source.protocol === 'https:' && source.hostname === 'i.ibb.co', 'Unsupported image host.', 400);
        const image = await fetch(source.href, {redirect: 'error', signal: AbortSignal.timeout(20000)});
        requireValue(image.ok, 'Image host could not provide this photo.', 502);
        return new Response(image.body, {headers: {'Content-Type': 'image/jpeg', 'Content-Disposition': `attachment; filename="${id}.jpg"`, 'Cache-Control': 'no-store'}});
    }
    if (path === '/admin/list' && request.method === 'GET') {
        const collection = url.searchParams.get('collection');
        requireValue(['photos','albums','users','audit'].includes(collection), 'Unknown collection.');
        return json(await db.list(collection, url.searchParams.get('cursor') || '', 50));
    }
    if (path === '/admin/settings' && request.method === 'POST') {
        const settings = validateSettings(await bodyJson(request));
        await auditWrite(db, user, 'settings.update', 'site', [['settings/site', settings]]);
        return json({settings});
    }
    if (path === '/admin/role' && request.method === 'POST') {
        const input = await bodyJson(request);
        requireValue(/^[A-Za-z0-9_-]{1,128}$/.test(input.uid), 'Invalid user ID.');
        requireValue(ROLES.includes(input.role), 'Invalid role.');
        requireValue(input.uid !== user.uid && input.uid !== env.ADMIN_UID, 'The primary admin cannot be changed here.');
        const target = await db.get('users/' + input.uid);
        requireValue(target, 'User not found.', 404);
        await auditWrite(db, user, 'user.update', input.uid, [['users/' + input.uid, {...target, role: input.role, disabled: input.disabled === true}]]);
        return json({ok: true});
    }
    if (path === '/admin/photo' && request.method === 'POST') {
        const input = await bodyJson(request);
        requireValue(/^[a-f0-9]{64}$/.test(input.id), 'Invalid photo ID.');
        const photo = await db.get('photos/' + input.id);
        requireValue(photo && ['published', 'hidden'].includes(photo.status), 'Photo is not ready.', 409);
        requireValue(['published','hidden'].includes(input.status), 'Invalid photo status.');
        await auditWrite(db, user, 'photo.update', input.id, [['photos/' + input.id, {...photo, status: input.status, featured: input.featured === true}]]);
        return json({ok: true});
    }
    if (path === '/admin/album' && request.method === 'POST') {
        const input = await bodyJson(request);
        requireValue(validDate(input.date), 'Invalid album date.');
        const album = {date: input.date, title: text(input.title, 120), archived: input.archived === true, musicUrl: httpsUrl(input.musicUrl)};
        await auditWrite(db, user, 'album.update', input.date, [['albums/' + input.date, album]]);
        return json({album});
    }
    return json({error: 'Route not found.'}, 404);
}
export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        if (origin && origin !== new URL(request.url).origin) return json({error: 'Origin not allowed.'}, 403);
        if (request.method === 'OPTIONS') return new Response(null, {status: 204});
        let response;
        try {
            requireValue(env.FIREBASE_PROJECT_ID && env.FIREBASE_API_KEY && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY, 'Service is not configured yet.', 503);
            response = await route(request, env);
        } catch (error) {
            response = json({error: error.status ? error.message : 'Service temporarily unavailable. Please retry.'}, error.status || 503);
        }
        response.headers.set('X-Content-Type-Options', 'nosniff');
        return response;
    }
};
