export function initializeExperience(settings) {
    document.querySelectorAll('[data-site-photo]').forEach(image=>{
        const source=settings[image.dataset.sitePhoto];
        if(source){const fallback=image.src;image.onerror=()=>{image.onerror=null;image.src=fallback;};image.src=source;image.alt={groomPhoto:settings.groomName||'The groom',bridePhoto:settings.brideName||'The bride',venuePhoto:'Celebration venue'}[image.dataset.sitePhoto]||'Wedding memory';}
    });
    document.querySelectorAll('[data-story]').forEach(el=>{el.hidden=!el.textContent.trim()||/coming soon/i.test(el.textContent);});
    document.querySelectorAll('[data-couple$="bio"]').forEach(el=>{el.hidden=!el.textContent.trim();});
    document.querySelectorAll('[data-footer-couple],[data-couple-heading]').forEach(el=>el.textContent=settings.coupleNames||'Tarun & Shelu');
    const dates=(settings.events||[]).map(e=>e.date).sort();
    const format=value=>new Date(value+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    document.getElementById('event-range').textContent=dates.length ? format(dates[0])+(dates.length>1?' ? '+format(dates.at(-1)):'') : 'Celebration dates coming soon';
    const photos=[...(settings.couplePhoto?[{src:settings.couplePhoto,caption:'Together, always'}]:[]),...(settings.photos||[])].filter((photo,i,list)=>list.findIndex(p=>p.src===photo.src)===i).slice(0,8);
    const gallery=document.getElementById('selected-gallery');
    for(const photo of photos){const link=document.createElement('a');link.href=photo.src;link.dataset.memorySrc=photo.src;link.dataset.memoryCaption=photo.caption||'';const image=document.createElement('img');image.src=photo.thumbnail||photo.src;image.alt=photo.caption||'Wedding memory';image.loading='lazy';image.decoding='async';link.append(image);gallery.append(link);}
    if(!photos.length){gallery.classList.add('gallery-waiting');for(const name of ['haldi','mehendi','sangeet']){const img=document.createElement('img');img.src='img/wedding/'+name+'.svg';img.alt='Decorative wedding illustration';img.loading='lazy';gallery.append(img);}document.getElementById('gallery-note').textContent='Our favourite photographs will appear here.';}
    const dialog=document.getElementById('memory-viewer');let opener;
    document.addEventListener('click',event=>{const link=event.target.closest('[data-memory-src]');if(!link)return;event.preventDefault();opener=link;dialog.querySelector('img').src=link.dataset.memorySrc;dialog.querySelector('img').alt=link.dataset.memoryCaption||'Wedding memory';dialog.querySelector('p').textContent=link.dataset.memoryCaption||'';dialog.showModal();});
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>opener?.focus());
    document.querySelectorAll('.wedding-event img').forEach(img=>{img.onerror=()=>{img.onerror=null;img.src='img/wedding/blessings.svg';img.alt='Decorative wedding illustration';};});
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.06});document.querySelectorAll('.couple-card,.wedding-event,.selected-gallery a').forEach(el=>{el.classList.add('site-reveal');observer.observe(el);});}
}
