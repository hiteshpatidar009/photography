(() => {
    const more=document.getElementById('mobile-more');
    function closeMenu(){document.body.classList.remove('mobile-menu-open');more?.setAttribute('aria-expanded','false');}
    more?.addEventListener('click',()=>{const open=document.body.classList.toggle('mobile-menu-open');more.setAttribute('aria-expanded',String(open));});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
    document.addEventListener('click',event=>{if(!event.target.closest('.sidebar,#mobile-more'))closeMenu();});
    const links=[...document.querySelectorAll('.mobile-bottom-nav a')];
    function active(hash=location.hash || '#home'){
        for(const link of links){const url=new URL(link.href);const page=location.pathname.split('/').pop()||'index.html';const selected=url.pathname.split('/').pop()===page && (page!=='index.html'||url.hash===hash);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    }
    active();window.addEventListener('hashchange',()=>active());
    if(document.getElementById('home')){
        const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)active(visible.target.id==='services'?'#services':'#home');},{rootMargin:'-10% 0px -45% 0px',threshold:[0,.1,.5]});
        document.querySelectorAll('#home,#services').forEach(el=>observer.observe(el));
    }
})();
