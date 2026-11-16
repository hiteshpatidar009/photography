import {demoMode} from './config.js';
import {api, defaults, initializeAuth, demoLogin, login, register, googleLogin, logout, resetPassword, resendVerification, allRecords, photoDownload} from './store.js';
import {indiaDay, albumLabel} from './domain.js';
import {optimizePhoto, saveJSON, zipFiles} from './images.js';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile, settings = defaults(), photos = [], albums = [], users = [], audit = [], selected = [], queueUrls = [], activeView = 'overview';
function notice(message, error = false) { const el = $('#notice'); el.textContent = message; el.className = 'notice' + (error ? ' error' : ''); el.hidden = false; }
async function run(action, button) { if (button) button.disabled = true; try { return await action(); } catch (error) { notice(error.message, true); } finally { if (button) button.disabled = button.id === 'upload-button' && !settings.uploadsEnabled; } }
function setView(name) {
    if (['settings','people','archive','banner'].includes(name) && profile?.role !== 'admin') return;
    activeView = name;
    document.querySelectorAll('[data-panel]').forEach(el => el.hidden = el.dataset.panel !== name);
    document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === name));
    if (name === 'settings') renderSettings();
    if (name === 'banner') renderBanner();
    $('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[data-view],[data-go]').forEach(el => el.addEventListener('click', () => { if (profile) setView(el.dataset.view || el.dataset.go); }));
$('#demo-banner').hidden = !demoMode; $('#demo-logins').hidden = !demoMode; $('#live-login').hidden = demoMode;
document.querySelectorAll('[data-demo]').forEach(button => button.onclick = () => run(() => demoLogin(button.dataset.demo),button));
$('#signout').onclick = () => run(logout); $('#login-signout').onclick = () => run(logout);
$('#login-form').onsubmit = event => { event.preventDefault(); const data = new FormData(event.target); run(() => login(data.get('email'),data.get('password')), $('#email-login')); };
$('#google-login').onclick = event => run(googleLogin,event.target);
$('#register').onclick = event => run(async () => { if (!$('#login-form').reportValidity()) return; const data = new FormData($('#login-form')); notice(await register(data.get('email'),data.get('password'))); },event.target);
$('#reset-password').onclick = event => run(async () => { const email = $('#login-form [name=email]'); if (!email.reportValidity()) return; await resetPassword(email.value); notice('Password reset requested. Check your email.'); },event.target);
$('#resend-verification').onclick = event => run(async () => { await resendVerification(); notice('Verification email sent. Verify, then sign out and sign in again.'); },event.target);
async function refresh() {
    const me = await api('/me'); profile = me.user;
    const publicState = await api('/public'); settings = {...defaults(), ...(publicState.settings || {})};
    if (profile.role === 'admin') [photos,albums,users,audit] = await Promise.all(['photos','albums','users','audit'].map(allRecords));
    else { photos = (await api('/my-photos')).items; albums = publicState.albums; users = []; audit = []; }
    photos.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); audit.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    $('#identity').textContent = profile.name + ' · ' + (profile.role === 'admin' ? 'Admin' : profile.role === 'guest' ? 'Guest' : profile.role + '’s side');
    document.querySelectorAll('[data-admin]').forEach(el => el.hidden = profile.role !== 'admin');
    $('#upload-side-label').hidden = profile.role !== 'admin';
    $('#library-description').textContent = profile.role === 'admin' ? 'Manage all family photos. Hiding removes a photo from the website, not from its image host.' : 'Up to 100 of your uploads. Contact the admin if a photo needs to be removed.';
    $('#upload-note').textContent = settings.uploadsEnabled ? 'Share your photos whenever you like. There is no daily upload limit.' : 'New uploads are currently paused by the admin.';
    $('#upload-button').disabled = !settings.uploadsEnabled;
    if (!publicState.settings && profile.role === 'admin') { activeView = 'settings'; notice('First setup: review Website & events and click Save before uploading photos.'); }
    applyStudioBackground(settings);
    render();
}
function photoCard(photo) {
    return `<article class="photo-card"><button class="photo-image" data-open="${esc(photo.id)}" aria-label="View ${esc(photo.caption || 'photo')}"><img src="${esc(photo.thumbnail || photo.src || 'img/wedding/blessings.svg')}" loading="lazy" alt="${esc(photo.caption || 'Wedding memory')}"></button><div class="photo-info"><span class="pill ${esc(photo.side)}">${esc(photo.side === 'guest' ? 'Guest memories' : photo.side + '’s side')}</span> <span class="pill ${esc(photo.status)}">${esc(photo.status)}</span><p>${esc(photo.caption || 'A little moment, kept forever.')}</p><small>${esc(photo.date)}${photo.featured ? ' · Featured' : ''}</small>${profile.role === 'admin' && ['published','hidden'].includes(photo.status) ? `<div class="card-actions"><button class="text-button" data-photo="${esc(photo.id)}" data-action="visibility">${photo.status === 'hidden' ? 'Restore' : 'Hide photo'}</button><button class="text-button" data-photo="${esc(photo.id)}" data-action="feature">${photo.featured ? 'Unfeature' : 'Feature'}</button><button class="text-button" data-add-to-banner="${esc(photo.id)}">Add to moving banner</button><button class="text-button" data-background="heroPhoto" data-id="${esc(photo.id)}">Use as single home background</button><button class="text-button" data-background="adminBackground" data-id="${esc(photo.id)}">Use as admin background</button>${photo.deleteUrl ? `<a class="text-button" href="${esc(photo.deleteUrl)}" target="_blank" rel="noopener noreferrer">Delete at host ↗</a>` : ''}</div>` : ''}</div></article>`;
}
function applyStudioBackground(value) {
    const url = value?.adminBackground;
    document.body.classList.toggle('has-studio-background', Boolean(url));
    document.body.style.setProperty('--studio-background', url ? `url(${JSON.stringify(url)})` : 'none');
}
api('/public').then(data => applyStudioBackground(data.settings)).catch(() => {});
const empty = (title, description) => `<div class="empty"><h3>${esc(title)}</h3><p>${esc(description)}</p></div>`;
function renderPhotos() {
    const filter = $('#photo-filter').value;
    const list = photos.filter(p => filter === 'all' || (filter === 'hidden' ? p.status === 'hidden' : filter === 'featured' ? p.featured : p.side === filter));
    $('#photo-library').innerHTML = list.length ? list.map(photoCard).join('') : empty('A little room for memories.','Upload your first preparation photos, and they’ll appear here.');
    $('#recent-photos').innerHTML = photos.length ? photos.slice(0,3).map(photoCard).join('') : empty('The story starts with you.','Share a photo from today’s preparations to begin the diary.');
}
function albumCard(date) {
    const album = albums.find(a => a.date === date) || {date};
    const entries = photos.filter(p => p.date === date && p.status === 'published');
    const cover = entries.find(p => p.featured) || entries[0];
    return `<article class="album-card">${cover ? `<img class="album-cover" src="${esc(cover.thumbnail || cover.src)}" alt="${esc(cover.caption)}" loading="lazy">` : ''}<span class="eyebrow">${esc(albumLabel(date, settings.startDate))} · ${esc(date)}</span><h2>${esc(album.title || 'Little moments, together')}</h2><p>${entries.length} published photo${entries.length === 1 ? '' : 's'}${album.archived ? ' · Archived' : ''}</p>${profile.role === 'admin' ? `<form data-album="${esc(date)}"><label>Album title<input name="title" value="${esc(album.title)}" maxlength="120" placeholder="Preparations begin"></label><label>Music URL (licensed HTTPS audio)<input name="musicUrl" type="url" value="${esc(album.musicUrl)}" placeholder="https://…/our-music.mp3"></label><label class="checkbox"><input type="checkbox" name="archived" ${album.archived ? 'checked' : ''}>Archive this album</label><button class="button secondary">Save album</button></form><div class="card-actions">${Array.from({length:Math.ceil(entries.length/20)},(_,i) => `<button class="text-button" data-download="${esc(date)}" data-batch="${i}">Download photos ${i*20+1}–${Math.min((i+1)*20,entries.length)} ↓</button>`).join('')}</div>` : '<a class="text-button" href="diary.html">See the public diary ↗</a>'}</article>`;
}
function render() {
    const visible = photos.filter(p => p.status === 'published');
    const dates = [...new Set([...photos.map(p => p.date),...albums.map(a => a.date)])].sort().reverse();
    $('#stats').innerHTML = [['Published photos',visible.length,'Automatically shared'],['Daily albums',dates.length,'A chapter for each day'],['Featured photos',visible.filter(p=>p.featured).length,'Selected memories'],['Your access',profile.role,'Assigned by the admin']].map(([label,value,note]) => `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><span>${esc(note)}</span></div>`).join('');
    renderPhotos();
    $('#album-list').innerHTML = dates.filter(date => !albums.some(a => a.date===date && a.archived)).map(albumCard).join('') || empty('Your first album is waiting.','Albums appear automatically when you upload photos.');
    $('#archived-albums').innerHTML = dates.filter(date => albums.some(a => a.date===date && a.archived)).map(albumCard).join('') || empty('Nothing archived yet.','Archive a day from Daily albums. You can restore it at any time.');
    $('#people-list').innerHTML = users.map(u => `<form class="person-row" data-user="${esc(u.uid)}"><div><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div><select name="role" aria-label="Role for ${esc(u.name)}" ${u.uid===profile.uid ? 'disabled' : ''}>${['admin','groom','bride','guest'].map(role => `<option ${u.role===role?'selected':''}>${role}</option>`).join('')}</select><label class="checkbox"><input type="checkbox" name="disabled" ${u.disabled?'checked':''} ${u.uid===profile.uid?'disabled':''}>Disabled</label><button class="button secondary" ${u.uid===profile.uid?'disabled':''}>Save</button></form>`).join('');
    $('#audit-list').innerHTML = audit.slice(0,50).map(a => `<div class="audit-row"><strong>${esc(a.name)}</strong> · ${esc(a.action)}<small>${esc(a.createdAt)} · ${esc(a.target)}</small></div>`).join('') || '<p>No changes recorded yet.</p>';
}
const settingFields = [['coupleNames','Couple display names'],['headline','Main heading'],['groomName','Groom’s full name'],['brideName','Bride’s full name'],['groomBio','Groom’s introduction','textarea'],['brideBio','Bride’s introduction','textarea'],['welcome','Welcome message','textarea'],['story.meeting','How we met','textarea'],['story.memories','Favourite memories','textarea'],['venue','Venue / location summary'],['mapUrl','Google Maps URL','url'],['contactName','Contact person'],['contactPhone','Contact number'],['rsvpUrl','RSVP form URL','url'],['rsvpMessage','RSVP instructions','textarea'],['heroPhoto','Homepage background photo URL','url'],['adminBackground','Admin panel background photo URL','url'],['musicUrl','Default licensed music URL','url'],['startDate','Diary Day 1','date']];
function field(name,label,value,type='text') { return `<label>${esc(label)}${type==='textarea' ? `<textarea name="${esc(name)}" rows="3" maxlength="3000">${esc(value)}</textarea>` : `<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${type==='date'?'required':''}>`}</label>`; }
function renderSettings() {
    $('#settings-fields').innerHTML = '<h2>The couple & invitation</h2><div class="form-grid">'+settingFields.map(([name,label,type]) => field(name,label,name.startsWith('story.') ? settings.story[name.split('.')[1]] : settings[name],type)).join('')+'</div><label class="checkbox"><input type="checkbox" name="uploadsEnabled" '+(settings.uploadsEnabled?'checked':'')+'>Allow new uploads</label><p class="download-note">Choose backgrounds using the photo library buttons or enter HTTPS image URLs above. Feature photos for Our Beautiful Moments. All published photos appear in Public Moments and the diary.</p>';
    $('#event-fields').innerHTML = ''; settings.events.forEach(addEventEditor);
}
function addEventEditor(e = {}) {
    const el = document.createElement('fieldset'); el.className='panel event-editor'; el.innerHTML='<legend>Celebration</legend><div class="form-grid">'+[['name','Event name'],['hindi','Hindi name'],['date','Date','date'],['time','Time / timing note'],['theme','Dress code / theme'],['venue','Venue'],['mapUrl','Map URL','url']].map(([name,label,type]) => field(name,label,e[name],type)).join('')+`<label>Illustration<select name="image">${['blessings','haldi','mehendi','ganga','sangeet'].map(name => `<option ${e.image===name?'selected':''}>${name}</option>`).join('')}</select></label></div><button type="button" class="text-button remove-event">Remove event</button>`;
    el.querySelector('.remove-event').onclick=()=>el.remove(); $('#event-fields').append(el);
}
$('#add-event').onclick=()=>{ if ($('#event-fields').children.length < 20) addEventEditor(); else notice('Maximum 20 events.',true); };
$('#settings-form').onsubmit=event=>{event.preventDefault();run(async()=>{
    const data={...settings,story:{...settings.story}};
    for(const [name,,type] of settingFields){const value=event.target.elements.namedItem(name).value;if(name.startsWith('story.'))data.story[name.split('.')[1]]=value;else data[name]=type==='number'?Number(value):value;}
    data.uploadsEnabled=event.target.elements.namedItem('uploadsEnabled').checked;
    data.events=[...document.querySelectorAll('.event-editor')].map(el=>Object.fromEntries([...el.querySelectorAll('input,select')].map(input=>[input.name,input.value])));
    await api('/admin/settings',data);await refresh();notice('Website content and event details saved.');
},event.submitter);};
$('#photo-filter').onchange=renderPhotos;$('#refresh').onclick=event=>run(async()=>{await refresh();notice('Library refreshed.');},event.target);
function setFiles(files) {
    queueUrls.forEach(URL.revokeObjectURL); queueUrls=[]; selected=[...files].slice(0,30);
    $('#queue').innerHTML=selected.map((file,index)=>{const url=URL.createObjectURL(file);queueUrls.push(url);return `<div class="queue-item"><img src="${url}" alt="Selected photo"><span>${esc(file.name)}</span><button type="button" data-remove="${index}">Remove</button></div>`;}).join('');
    if(files.length>30)notice('Choose up to 30 photos per batch. You can upload another batch afterward.',true);
}
$('#files').onchange=event=>setFiles(event.target.files);
$('#dropzone').ondragover=event=>{event.preventDefault();$('#dropzone').classList.add('dragging');};
$('#dropzone').ondragleave=()=>$('#dropzone').classList.remove('dragging');
$('#dropzone').ondrop=event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');setFiles(event.dataTransfer.files);};
$('#memory-date').value=indiaDay();$('#memory-date').max=indiaDay();
$('#upload-form').onsubmit=event=>{event.preventDefault();run(async()=>{
    if(!selected.length)throw new Error('Choose at least one photo.');
    const batch=[...selected],failed=[],memoryDate=$('#memory-date').value,caption=$('#caption').value,side=$('#upload-side').value;let successful=0;$('#upload-progress').hidden=false;
    for(let i=0;i<batch.length;i++){
        $('#upload-status').textContent=`Preparing and uploading photo ${i+1} of ${batch.length}…`;
        try{const image=await optimizePhoto(batch[i]);const form=new FormData();form.set('image',image.blob,'memory.jpg');form.set('width',image.width);form.set('height',image.height);form.set('date',memoryDate);form.set('caption',caption);form.set('side',side);await api('/upload',form);successful++;}
        catch(error){failed.push({file:batch[i],reason:error.message});}
        $('#upload-progress').value=Math.round((i+1)/batch.length*100);
    }
    setFiles(failed.map(x=>x.file));await refresh();
    $('#upload-status').textContent=`${successful} photo(s) published.${failed.length?' '+failed.map(x=>x.file.name+': '+x.reason).join(' | '):' Your daily album is ready.'}`;
    notice(successful+' photo(s) published'+(failed.length?'; '+failed.length+' failed. '+failed.map(x=>x.file.name+': '+x.reason).join(' | '):'.'),failed.length>0);
},$('#upload-button'));};
document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.remove!==undefined){setFiles(selected.filter((_,i)=>i!==Number(target.dataset.remove)));return;}
    if(target.dataset.open){const p=photos.find(x=>x.id===target.dataset.open);if(!p?.src)return;const dialog=$('#photo-dialog');dialog.querySelector('img').src=p.src;dialog.querySelector('img').alt=p.caption||'Wedding memory';dialog.querySelector('p').textContent=p.caption;dialog.showModal();}
    if(target.dataset.addToBanner)run(async()=>{
        const id=target.dataset.addToBanner;
        const current=settings.bannerPhotoIds||[];
        if(current.includes(id))return notice('This photo is already in the moving banner.');
        if(current.length>=24)return notice('Moving banner has reached the 24-photo maximum.',true);
        const updated=[...current,id];
        await api('/admin/settings',{...settings,bannerPhotoIds:updated,heroPhoto:''});
        await refresh();notice('Photo added to moving banner! Reload homepage to see it.');
    },target);
    if(target.dataset.background)run(async()=>{const p=photos.find(x=>x.id===target.dataset.id);await api('/admin/settings',{...settings,[target.dataset.background]:p.src,...(target.dataset.background==='heroPhoto'?{bannerPhotoIds:[]}: {})});await refresh();notice('Background saved. Reload the homepage to see it.');},target);
    if(target.dataset.photo)run(async()=>{const p=photos.find(x=>x.id===target.dataset.photo);await api('/admin/photo',{id:p.id,status:target.dataset.action==='visibility'?(p.status==='hidden'?'published':'hidden'):p.status,featured:target.dataset.action==='feature'?!p.featured:p.featured});await refresh();notice('Photo updated.');},target);
    if(target.dataset.download)run(()=>downloadAlbum(target.dataset.download,Number(target.dataset.batch)),target);
});
document.addEventListener('submit',event=>{
    if(event.target.dataset.album){event.preventDefault();run(async()=>{const data=new FormData(event.target);await api('/admin/album',{date:event.target.dataset.album,title:data.get('title'),musicUrl:data.get('musicUrl'),archived:data.has('archived')});await refresh();notice('Album saved.');},event.submitter);}
    if(event.target.dataset.user){event.preventDefault();run(async()=>{const data=new FormData(event.target);await api('/admin/role',{uid:event.target.dataset.user,role:data.get('role'),disabled:data.has('disabled')});await refresh();notice('Account access updated.');},event.submitter);}
});
$('#photo-dialog .dialog-close').onclick=()=>$('#photo-dialog').close();
async function downloadAlbum(date,batch) {
    const list=photos.filter(p=>p.date===date && p.status==='published').slice(batch*20,batch*20+20),files=[],failures=[];
    notice('Preparing photo download. Keep this page open.');
    for(let i=0;i<list.length;i++) {const p=list[i];try{const response=await photoDownload(p);if(!response.ok)throw new Error();const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>3*1024*1024)throw new Error();files.push({name:`${date}-${batch*20+i+1}.jpg`,data:bytes});}catch(_){failures.push({caption:p.caption,url:p.src});}}
    files.push({name:'album-records.json',data:new TextEncoder().encode(JSON.stringify({date,photos:list,failedDownloads:failures},null,2))});
    const url=URL.createObjectURL(zipFiles(files));const a=document.createElement('a');a.href=url;a.download=`${date}-batch-${batch+1}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    notice(failures.length?`${failures.length} photo(s) could not be downloaded, possibly due to image-host restrictions. Their URLs are included in the ZIP for manual download.`:'Photo ZIP downloaded.',failures.length>0);
}
$('#export').onclick=event=>run(async()=>{await refresh();saveJSON('wedding-records-'+indiaDay()+'.json',{exportedAt:new Date().toISOString(),settings,photos,albums,users,audit});notice('Records exported. Download photo ZIPs separately for an image backup.');},event.target);
await run(async()=>{
    await initializeAuth(async user=>{
        $('#workspace').hidden=true;$('#login-panel').hidden=!(!user);$('#signout').hidden=!user;
        if(!user){profile=null;$('#identity').textContent='Family access';$('#login-panel').hidden=false;return;}
        try{await refresh();$('#login-panel').hidden=true;$('#workspace').hidden=false;setView(activeView);}
        catch(error){$('#login-panel').hidden=false;$('#resend-verification').hidden=demoMode || user.emailVerified !== false;$('#login-signout').hidden=false;notice(error.message,true);}
    });
    ['#email-login','#google-login','#register','#reset-password'].forEach(selector=>$(selector).disabled=false);
});

let bannerDraft = [];
function bannerEligible(photo) { return photo.status === 'published' && !albums.some(a => a.date === photo.date && a.archived); }
function renderBanner() {
    bannerDraft = [...(settings.bannerPhotoIds || [])];
    const form = $('#banner-form');
    for (const key of ['bannerKicker','bannerLinkText','bannerOverlay']) form.elements[key].value = settings[key];
    form.elements.bannerMotion.checked = settings.bannerMotion !== false;
    renderBannerPhotos();
}
function renderBannerPhotos() {
    $('#banner-selected').innerHTML = bannerDraft.map((id,index) => {
        const p = photos.find(p => p.id === id);
        return `<article class="photo-card">${p?.src ? `<img class="banner-thumb" src="${esc(p.src)}" alt="${esc(p.caption || 'Banner photograph')}" loading="lazy">` : ''}<div class="photo-info"><strong>Photo ${index+1}</strong><p>${p && bannerEligible(p) ? esc(p.caption || 'Wedding memory') : 'Unavailable: hidden, archived or removed. This photo will not appear.'}</p><div class="card-actions"><button type="button" class="text-button" data-banner-move="${index}" data-step="-1" ${index===0?'disabled':''}>Earlier</button><button type="button" class="text-button" data-banner-move="${index}" data-step="1" ${index===bannerDraft.length-1?'disabled':''}>Later</button><button type="button" class="text-button" data-banner-remove="${index}">Remove</button></div></div></article>`;
    }).join('') || '<p>No banner photos selected. Add several photos below to create the collage.</p>';
    $('#banner-library').innerHTML = photos.filter(p => bannerEligible(p) && !bannerDraft.includes(p.id)).map(p => `<button type="button" class="banner-choice" data-banner-add="${esc(p.id)}"><img src="${esc(p.thumbnail || p.src)}" loading="lazy" alt="${esc(p.caption || 'Wedding photograph')}"><span>+ Add to banner</span></button>`).join('') || '<p>No more published photos available. Upload photos above.</p>';
    updateBannerPreview();
}
function updateBannerPreview() {
    const preview = $('#banner-preview'), form = $('#banner-form');
    const chosen = bannerDraft.map(id => photos.find(p => p.id === id)).filter(p => p && bannerEligible(p));
    const sources = chosen.length ? chosen : settings.heroPhoto && !bannerDraft.length ? [{src:settings.heroPhoto}] : window.WEDDING.placeholders;
    preview.innerHTML = `<div class="banner-preview-grid">${Array.from({length:10},(_,i) => `<img src="${esc(sources[i%sources.length].src)}" alt="">`).join('')}</div><div class="banner-preview-shade"></div><div class="banner-preview-copy"><small>${esc(form.elements.bannerKicker.value)}</small><h2>${esc(settings.coupleNames)}</h2><h3>${esc(settings.headline)}</h3></div>`;
    preview.querySelector('.banner-preview-shade').style.backgroundColor = `rgba(0,0,0,${Number(form.elements.bannerOverlay.value)/100})`;
    preview.classList.toggle('animated', form.elements.bannerMotion.checked);
}
$('#banner-form').oninput = updateBannerPreview;
$('#banner-form').onclick = event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.bannerAdd) {
        if (bannerDraft.length >= 24) return notice('This banner can contain up to 24 photos. Remove one before adding another.',true);
        bannerDraft.push(button.dataset.bannerAdd);
    } else if (button.dataset.bannerRemove !== undefined) bannerDraft.splice(Number(button.dataset.bannerRemove),1);
    else if (button.dataset.bannerMove !== undefined) {
        const from=Number(button.dataset.bannerMove), to=from+Number(button.dataset.step);
        if(to>=0 && to<bannerDraft.length) [bannerDraft[from],bannerDraft[to]]=[bannerDraft[to],bannerDraft[from]];
    } else return;
    renderBannerPhotos();
};
$('#banner-form').onsubmit = event => { event.preventDefault(); run(async()=>{
    const form = event.target;
    await api('/admin/settings',{...settings,bannerPhotoIds:bannerDraft,bannerKicker:form.elements.bannerKicker.value,bannerLinkText:form.elements.bannerLinkText.value,bannerMotion:form.elements.bannerMotion.checked,bannerOverlay:Number(form.elements.bannerOverlay.value),heroPhoto:bannerDraft.length ? '' : settings.heroPhoto});
    await refresh(); renderBanner(); notice('Homepage banner saved. Open Preview homepage to see the animated collage.');
},event.submitter); };
$('#banner-upload').onclick = event => run(async()=>{
    const files = [...$('#banner-files').files];
    if (!files.length) throw new Error('Choose photographs first.');
    if (files.length + bannerDraft.length > 24) throw new Error('Choose fewer files: the banner has room for '+(24-bannerDraft.length)+' more photos.');
    const failures = []; let count = 0;
    const saveButton = $('#banner-form button[type=submit]') || $('#banner-form .save-bar button');
    saveButton.disabled = true;
    try {
        for (const file of files) {
            $('#banner-upload-status').textContent = 'Uploading '+file.name+'...';
            try {
                const image = await optimizePhoto(file), form = new FormData();
                form.set('image',image.blob,'banner.jpg');form.set('date',indiaDay());form.set('caption','');form.set('side','guest');
                const {photo} = await api('/upload',form); bannerDraft.push(photo.id); count++;
            } catch(error) { failures.push(file.name+': '+error.message); }
        }
        if (count > 0) {
            const form = $('#banner-form');
            await api('/admin/settings', {
                ...settings,
                bannerPhotoIds: bannerDraft,
                bannerKicker: form.elements.bannerKicker?.value || settings.bannerKicker || '',
                bannerLinkText: form.elements.bannerLinkText?.value || settings.bannerLinkText || '',
                bannerMotion: form.elements.bannerMotion ? form.elements.bannerMotion.checked : (settings.bannerMotion !== false),
                bannerOverlay: form.elements.bannerOverlay ? Number(form.elements.bannerOverlay.value) : (settings.bannerOverlay ?? 45),
                heroPhoto: ''
            });
        }
        await refresh(); renderBannerPhotos(); $('#banner-files').value='';
        $('#banner-upload-status').textContent = count+' photo(s) uploaded and saved to moving banner! '+(failures.length?failures.join(' | '):'Reload homepage to see them.');
        notice(count + ' photo(s) uploaded and saved to homepage banner!');
    } finally { saveButton.disabled = false; }
},event.target);
