import {runtime, demoMode} from './config.js';
import {api} from './store.js';
// Load editable content before starting the template, with a short offline fallback.
try {
    if(runtime.apiBase || demoMode){
        const data=await Promise.race([api('/public?home=1'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Content timeout')),5000))]);
        if(data.settings){
            const original=window.WEDDING;window.WEDDING={...original,...data.settings};
            const curated=data.featured || data.photos.filter(p=>p.featured);
            window.WEDDING.photos=[...original.photos,...curated];
            if(data.settings.heroPhoto)window.WEDDING.photos.unshift({src:data.settings.heroPhoto,caption:data.settings.coupleNames,width:1600,height:1200});
            const fields={'.intro-title':'coupleNames','.wedding-heading':'headline','.wedding-hero-copy':'welcome','[data-couple="groom-name"]':'groomName','[data-couple="bride-name"]':'brideName','[data-couple="groom-bio"]':'groomBio','[data-couple="bride-bio"]':'brideBio'};
            for(const [selector,key] of Object.entries(fields)){const el=document.querySelector(selector);if(el&&data.settings[key])el.textContent=data.settings[key];}
            document.title=(data.settings.coupleNames||'Tarun & Shelu')+' | Wedding Celebrations';
            document.querySelector('.facts-counter-number-years').textContent=String(window.WEDDING.events.length);
        }
    }
}catch(error){console.info('Showing the saved invitation while live content is unavailable.');}
for(const src of ['js/wedding.js','js/dynamic-works.js','js/basex-wall.js']){
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);}).catch(()=>{
        document.querySelector('#preloader').style.display='none';document.querySelector('.preloader-bg').style.display='none';
    });
}
