import {runtime, demoMode} from './config.js';
import {api} from './store.js';
let publicCursor = '', publicBusy = false;
const seenPhotos = new Set();
function renderPublic(data) {
    const grid = document.getElementById('public-photo-grid');
    for (const photo of data.photos || []) {
        if (seenPhotos.has(photo.id)) continue;
        seenPhotos.add(photo.id);
        const link = document.createElement('a'); link.href = photo.src; link.target = '_blank'; link.rel = 'noopener';
        const image = document.createElement('img'); image.src = photo.thumbnail || photo.src; image.alt = photo.caption || 'A shared wedding memory'; image.loading = 'lazy'; image.decoding = 'async';
        const caption = document.createElement('span'); caption.textContent = photo.caption || photo.date;
        link.append(image, caption); grid.append(link);
    }
    publicCursor = data.cursor || '';
    document.getElementById('more-public-photos').hidden = !publicCursor;
    document.getElementById('public-photo-status').textContent = seenPhotos.size ? '' : publicCursor ? 'More memories are available. Continue loading below.' : 'Be the first to share a moment with us.';
}
document.getElementById('more-public-photos').onclick = async event => {
    if (publicBusy) return;
    publicBusy = true; event.target.disabled = true;
    try { renderPublic(await api('/public?cursor=' + encodeURIComponent(publicCursor))); }
    catch { document.getElementById('public-photo-status').textContent = 'Could not load more memories. Please try again.'; }
    finally { publicBusy = false; event.target.disabled = false; }
};
// Load editable content before starting the template, with a short offline fallback.
try {
    if(runtime.apiBase || demoMode){
        const data=await api('/public?home=1');
        renderPublic(data);
        if(data.settings){
            const original=window.WEDDING;window.WEDDING={...original,...data.settings};
            const curated=data.featured || data.photos.filter(p=>p.featured);
            window.WEDDING.photos=[...original.photos,...curated];
            window.WEDDING.backgroundPhotos = data.banner?.length ? data.banner : (data.settings.heroPhoto ? [{src:data.settings.heroPhoto,caption:data.settings.coupleNames}] : null);
            if (typeof window.renderHeroBoxGrid === 'function') {
                window.renderHeroBoxGrid(window.WEDDING.backgroundPhotos);
            }
            const heroGrid = document.getElementById('hero-photo-grid');
            if (heroGrid && data.settings) {
                heroGrid.classList.toggle('animated', data.settings.bannerMotion !== false);
            }
            if (window.WEDDING.backgroundPhotos?.length) {
                if (typeof window.updateWeddingWallPhotos === 'function') {
                    window.updateWeddingWallPhotos(window.WEDDING.backgroundPhotos);
                } else {
                    window._pendingBannerPhotos = window.WEDDING.backgroundPhotos;
                }
            }
            const overlay = document.querySelector('.overlay-home-wall') || document.querySelector('.hpg-overlay');
            if (overlay) overlay.style.backgroundColor = `rgba(0,0,0,${(data.settings.bannerOverlay ?? 45)/100})`;
            const fields={'.intro-subtitle':'bannerKicker','.wedding-hero-link':'bannerLinkText','.intro-title':'coupleNames','.wedding-heading':'headline','.wedding-hero-copy':'welcome','[data-couple="groom-name"]':'groomName','[data-couple="bride-name"]':'brideName','[data-couple="groom-bio"]':'groomBio','[data-couple="bride-bio"]':'brideBio'};
            for(const [selector,key] of Object.entries(fields)){const el=document.querySelector(selector);if(el&&data.settings[key])el.textContent=data.settings[key];}
            document.title=(data.settings.coupleNames||'Tarun & Shelu')+' | Wedding Celebrations';
            const counter = document.querySelector('.facts-counter-number-years');
            if (counter) counter.textContent=String(window.WEDDING.events.length);
        }
    }
}catch(error){
    const statusEl = document.getElementById('public-photo-status');
    if (statusEl) statusEl.textContent = 'Memories are temporarily unavailable. Please reload to try again.';
    console.info('Showing the saved invitation while live content is unavailable.');
}
const backdrop = (window.WEDDING.backgroundPhotos?.[0]?.src && !window.WEDDING.backgroundPhotos[0].src.endsWith('.svg')) ? window.WEDDING.backgroundPhotos[0].src : 'img/heroimgs/web/img1.jpg';
const heroBg = document.querySelector('.hero-bg');
if (heroBg) heroBg.style.backgroundImage = `url(${JSON.stringify(backdrop)})`;
const gridCells = document.querySelectorAll('.hero-photo-grid .hpg-cell');
if (gridCells.length && window.WEDDING.backgroundPhotos?.length) {
    const bgList = window.WEDDING.backgroundPhotos;
    gridCells.forEach((cell, idx) => {
        const photo = bgList[idx % bgList.length];
        if (photo?.src) cell.style.backgroundImage = `url(${JSON.stringify(photo.src)})`;
    });
}
for(const src of ['js/wedding.js','js/dynamic-works.js','js/basex-wall.js']){
    if (document.querySelector(`script[src="${src}"]`)) continue;
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);}).catch(()=>{
        document.querySelector('#preloader').style.display='none';document.querySelector('.preloader-bg').style.display='none';
    });
}
if (typeof window.renderHeroBoxGrid === 'function') {
    window.renderHeroBoxGrid(window.WEDDING?.backgroundPhotos);
}
