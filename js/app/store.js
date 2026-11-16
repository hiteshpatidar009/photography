import {runtime, demoMode} from './config.js';
import {assertUpload, validateSettings, publicPhoto, requireValue} from './domain.js';

export const defaults = () => ({...structuredClone(window.WEDDING), coupleNames: 'Tarun & Shelu', groomName: 'Tarun Gami', brideName: 'Shelu Patidar', groomBio: 'From Ujjain, Madhya Pradesh. A software developer at Appalto Electronics, with an education affiliation at the Institute of Engineering & Technology, DAVV, Indore.', brideBio: 'Meet Shelu, as we look forward to celebrating this new chapter with our families and friends.', headline: 'Two Hearts, One Beautiful Journey', welcome: 'Together with our families, we invite you to celebrate the beginning of our forever.', startDate: '2027-02-08', uploadsEnabled: true, heroPhoto: '', musicUrl: ''});
let firebaseAuth, firebaseSDK;
let demoUser = null;
export function currentUser() { return demoMode ? demoUser : firebaseAuth?.currentUser; }
export async function initializeAuth(onChange) {
    if (demoMode) {
        const role = sessionStorage.getItem('wedding-demo-role');
        if (role) demoUser = {uid: 'demo-' + role};
        await onChange(demoUser); return;
    }
    requireValue(runtime.apiBase && runtime.firebase.apiKey, 'Live service is not connected yet. See SETUP.md.');
    const [{initializeApp}, auth] = await Promise.all([import('https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js'), import('https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js')]);
    firebaseSDK = auth;
    const app = initializeApp(runtime.firebase);
    firebaseAuth = auth.getAuth(app);
    if (runtime.analyticsEnabled && runtime.firebase.measurementId) {
        import('https://www.gstatic.com/firebasejs/13.3.0/firebase-analytics.js')
            .then(async ({getAnalytics, isSupported}) => { if (await isSupported()) getAnalytics(app); })
            .catch(() => { /* Analytics availability must not block sign-in. */ });
    }
    auth.onAuthStateChanged(firebaseAuth, onChange);
}
export async function demoLogin(role) {
    requireValue(demoMode && ['admin','groom','bride','guest'].includes(role), 'Demo accounts are local only.');
    sessionStorage.setItem('wedding-demo-role', role); location.reload();
}
export async function login(email, password) { return firebaseSDK.signInWithEmailAndPassword(firebaseAuth, email, password); }
export async function googleLogin() { return firebaseSDK.signInWithPopup(firebaseAuth, new firebaseSDK.GoogleAuthProvider()); }
export async function register(email, password) {
    const result = await firebaseSDK.createUserWithEmailAndPassword(firebaseAuth, email, password);
    await firebaseSDK.sendEmailVerification(result.user);
    return 'Verification email sent. Verify your email, then sign in again.';
}
export async function resendVerification() { await firebaseSDK.sendEmailVerification(firebaseAuth.currentUser); }
export async function resetPassword(email) { await firebaseSDK.sendPasswordResetEmail(firebaseAuth, email); }
export async function logout() {
    if (demoMode) { sessionStorage.removeItem('wedding-demo-role'); location.reload(); }
    else await firebaseSDK.signOut(firebaseAuth);
}
async function openDemo() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('tarun-shelu-demo-v1', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('state');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
}
async function demoState(update) {
    const db = await openDemo();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('state', 'readwrite'), store = tx.objectStore('state');
        let result;
        const req = store.get('wedding');
        req.onsuccess = () => {
            try {
                const state = req.result || {settings: defaults(), photos: [], albums: [], audit: [], users: ['admin','groom','bride','guest'].map(role => ({uid: 'demo-' + role, name: `${role[0].toUpperCase() + role.slice(1)} demo`, email: `${role}@local.demo`, role, disabled: false}))};
                result = update(state); store.put(state, 'wedding');
            } catch (error) { reject(error); tx.abort(); }
        };
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
        tx.onabort = () => db.close();
    });
}
async function demoRequest(path, input) {
    let uploaded;
    if (path === '/upload') {
        const file = input.get('image');
        const buffer = new Uint8Array(await file.arrayBuffer());
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), b => b.toString(16).padStart(2,'0')).join('');
        const src = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        uploaded = {id: hash, src, thumbnail: src, width: Number(input.get('width')), height: Number(input.get('height')), date: input.get('date'), caption: input.get('caption')};
    }
    return demoState(state => {
        const url = new URL(path, location.origin); path = url.pathname;
        const page = items => { const start = Number(url.searchParams.get('cursor') || 0); return {items: items.slice(start,start+50), cursor: start+50 < items.length ? String(start+50) : ''}; };
        if (path === '/public') {
            const photos = page(state.photos);
            const visible = p => p.status === 'published' && !state.albums.some(a => a.date === p.date && a.archived);
            return {settings: state.settings, photos: photos.items.filter(visible).map(publicPhoto), featured: state.photos.filter(p => p.featured && visible(p)).slice(0,12).map(publicPhoto), albums: state.albums.filter(a => !a.archived), cursor: photos.cursor};
        }
        const user = state.users.find(u => u.uid === demoUser?.uid);
        requireValue(user && !user.disabled, 'Please sign in with an active account.', 403);
        if (path === '/me') return {user};
        if (path === '/my-photos') return {items: state.photos.filter(p => p.owner === user.uid)};
        const audit = (action, target) => state.audit.unshift({id: crypto.randomUUID(), actor: user.uid, name: user.name, action, target, createdAt: new Date().toISOString()});
        if (path === '/upload') {
            assertUpload(user, state.settings);
            requireValue(!state.photos.some(p => p.id === uploaded.id), 'This photo has already been uploaded.', 409);
            requireValue(state.photos.length < 100, 'Local demo holds up to 100 photos. Export your photos before clearing browser storage.');
            const photo = {...uploaded, owner: user.uid, side: ['bride','groom'].includes(user.role) ? user.role : input.get('side') || 'guest', status: 'published', featured: false, createdAt: new Date().toISOString()};
            state.photos.unshift(photo); audit('photo.upload', photo.id);
            return {photo};
        }
        requireValue(user.role === 'admin', 'Admin access required.', 403);
        if (path === '/admin/list') { const key = url.searchParams.get('collection'); requireValue(['photos','albums','users','audit'].includes(key), 'Invalid collection.'); return page(state[key]); }
        if (path === '/admin/settings') { state.settings = validateSettings(input); audit('settings.update','site'); return {settings: state.settings}; }
        if (path === '/admin/photo') { const photo = state.photos.find(p => p.id === input.id); requireValue(photo, 'Photo not found.'); photo.status = input.status; photo.featured = input.featured; audit('photo.update',photo.id); return {ok:true}; }
        if (path === '/admin/album') { state.albums = state.albums.filter(a => a.date !== input.date); state.albums.push(input); audit('album.update',input.date); return {album: input}; }
        if (path === '/admin/role') { requireValue(input.uid !== user.uid && input.uid !== 'demo-admin','The primary admin cannot be changed here.'); const target = state.users.find(u => u.uid === input.uid); requireValue(target, 'User not found.'); target.role = input.role; target.disabled = input.disabled; audit('user.update',input.uid); return {ok:true}; }
        throw new Error('Unknown operation.');
    });
}
export async function api(path, body) {
    if (demoMode) return demoRequest(path, body);
    requireValue(runtime.apiBase, 'Live service is not connected yet.');
    const headers = {};
    if (!path.startsWith('/public')) {
        requireValue(firebaseAuth?.currentUser, 'Please sign in.');
        headers.Authorization = 'Bearer ' + await firebaseAuth.currentUser.getIdToken();
    }
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(runtime.apiBase.replace(/\/$/, '') + path, {method: body ? 'POST' : 'GET', headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45000)});
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed.'), {status: response.status});
    return data;
}
export async function allRecords(collection) {
    const records = []; let cursor = '';
    do { const page = await api('/admin/list?collection=' + collection + '&cursor=' + encodeURIComponent(cursor)); records.push(...page.items); cursor = page.cursor; } while (cursor);
    return records;
}
export async function photoDownload(photo) {
    if (demoMode) return fetch(photo.src);
    requireValue(firebaseAuth?.currentUser, 'Please sign in.');
    return fetch(runtime.apiBase.replace(/\/$/,'') + '/admin/download?id=' + encodeURIComponent(photo.id), {
        headers: {Authorization: 'Bearer ' + await firebaseAuth.currentUser.getIdToken()}, signal: AbortSignal.timeout(30000)
    });
}
