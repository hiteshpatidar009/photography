import {demoMode} from './config.js';
import {api, defaults} from './store.js';
import {albumLabel} from './domain.js';
const $ = s => document.querySelector(s), esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let photos=[],albums=[],settings=defaults(),cursor='',slides=[],index=0,timer=null,playing=false;
$('#demo-banner').hidden=!demoMode;
function filtered(){return photos.filter(p=>($('#side').value==='all'||p.side===$('#side').value)&&($('#date').value==='all'||p.date===$('#date').value));}
function render(){
    const list=filtered(),dates=[...new Set(list.map(p=>p.date))].sort().reverse();
    $('#diary-albums').innerHTML=dates.map(date=>{const album=albums.find(a=>a.date===date),items=list.filter(p=>p.date===date),cover=items.find(p=>p.featured)||items[0];return `<article class="album-card"><img class="album-cover" loading="lazy" src="${esc(cover.thumbnail||cover.src)}" alt="${esc(cover.caption||'Wedding memory')}"><p class="eyebrow">${esc(albumLabel(date,settings.startDate))} · ${esc(date)}</p><h2>${esc(album?.title||'Little moments, together')}</h2><p>${items.length} memories loaded · ${[...new Set(items.map(p=>p.side==='guest'?'Guests':p.side+'’s side'))].map(esc).join(' & ')}</p><button class="button secondary" data-album="${esc(date)}">Play these memories ↗</button></article>`;}).join('')||'<div class="empty"><h3>The best moments are on their way.</h3><p>Family photographs will appear here as they are shared. <a href="admin.html">Be the first to add a memory.</a></p></div>';
    $('#photo-count').textContent=list.length+' memories loaded';$('#load-more').hidden=!cursor;
}
async function load(){
    $('#load-more').disabled=true;
    try{const data=await api('/public'+(cursor?'?cursor='+encodeURIComponent(cursor):''));settings={...defaults(),...(data.settings||{})};albums=data.albums;photos=[...new Map([...photos,...data.photos].map(p=>[p.id,p])).values()];cursor=data.cursor;
        const selected=$('#date').value;$('#date').innerHTML='<option value="all">Every day</option>'+[...new Set(photos.map(p=>p.date))].sort().reverse().map(date=>`<option>${date}</option>`).join('');$('#date').value=selected;render();
    }catch(error){$('#notice').textContent=error.message;$('#notice').hidden=false;render();}finally{$('#load-more').disabled=false;}
}
$('#load-more').onclick=load;$('#side').onchange=render;$('#date').onchange=render;
function show(){const p=slides[index];$('#slide-photo').src=p.src;$('#slide-photo').alt=p.caption||'Wedding memory';$('#slide-caption').textContent=p.caption||'A moment to keep.';$('#position').textContent=`${index+1} / ${slides.length}`;}
function pause(){clearInterval(timer);timer=null;playing=false;$('#play').textContent='Play';}
function play(){pause();playing=true;$('#play').textContent='Pause';timer=setInterval(()=>{index=(index+1)%slides.length;show();},4500);}
async function playMusic(){try{await $('#music').play();$('#sound').textContent='Music on';$('#music-status').textContent='';}catch(_){$('#sound').textContent='Music off';$('#music-status').textContent='Music could not play. Check the track URL or try the music button again.';}}
document.addEventListener('click',event=>{const button=event.target.closest('[data-album]');if(!button)return;const date=button.dataset.album;slides=filtered().filter(p=>p.date===date).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));if(!slides.length)return;index=0;show();$('#slideshow').showModal();play();const track=albums.find(a=>a.date===date)?.musicUrl||settings.musicUrl;$('#music-status').textContent='';$('#sound').hidden=!track;$('#music').pause();$('#music').removeAttribute('src');$('#music').load();$('#sound').textContent='Music off';if(track){$('#music').src=track;playMusic();}});
$('#play').onclick=()=>{if(playing){pause();$('#music').pause();$('#sound').textContent='Music off';}else play();};
$('#next').onclick=()=>{index=(index+1)%slides.length;show();};$('#previous').onclick=()=>{index=(index-1+slides.length)%slides.length;show();};
$('#sound').onclick=()=>{if($('#music').paused)playMusic();else{$('#music').pause();$('#sound').textContent='Music off';}};
$('#slideshow .dialog-close').onclick=()=>$('#slideshow').close();$('#slideshow').addEventListener('close',()=>{pause();$('#music').pause();});
document.addEventListener('keydown',event=>{if(!$('#slideshow').open)return;if(event.key==='ArrowRight')$('#next').click();if(event.key==='ArrowLeft')$('#previous').click();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();$('#music').pause();$('#sound').textContent='Music off';}});
await load();
