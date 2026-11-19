// A single tiled surface. Movement never changes the selected photo order.
export function tileAt(column, row, length) { return ((row * 7 + column) % length + length) % length; }
export function mountCollage(viewport, wall, sources, moving = true) {
    let photos=sources, x=0, y=0, vx=0, vy=0, active=null, raf=0, last=0, pauseUntil=0;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'), tiles=new Map();
    wall.dataset.nativeCollage='true';
    function draw() {
        const mobile=viewport.clientWidth<=767;
        const width=mobile?Math.max(140,Math.min(200,viewport.clientWidth/2.4)):Math.max(160,Math.min(301,viewport.clientWidth/4));
        const height=mobile?width*1.35:Math.max(200,Math.min(320,viewport.clientHeight/2));
        const startX=Math.floor(-x/width)-1, startY=Math.floor(-y/height)-1, keep=new Set();
        for(let row=startY;row<=startY+Math.ceil(viewport.clientHeight/height)+2;row++) {
            for(let col=startX;col<=startX+Math.ceil(viewport.clientWidth/width)+2;col++) {
                const key=col+':'+row;keep.add(key);let tile=tiles.get(key);
                if(!tile){tile=document.createElement('img');tile.alt='';tile.draggable=false;tile.decoding='async';wall.append(tile);tiles.set(key,tile);}
                const photo=photos[tileAt(col,row,photos.length)];const src=typeof photo==='string'?photo:photo.src;
                if(tile.getAttribute('src')!==src)tile.src=src;
                Object.assign(tile.style,{left:col*width+'px',top:row*height+'px',width:width+'px',height:height+'px'});
            }
        }
        for(const [key,tile] of tiles)if(!keep.has(key)){tile.remove();tiles.delete(key);}
        wall.style.transform=`translate3d(${x}px,${y}px,0)`;
    }
    function tick(now) {
        const dt=last?Math.min((now-last)/1000,.05):0;last=now;
        if(!active){
            if(reduced.matches){vx=0;vy=0;}
            x+=vx*dt;y+=vy*dt;const decay=Math.exp(-5*dt);vx*=decay;vy*=decay;
            if(moving&&!reduced.matches&&now>pauseUntil){x-=18*dt;y-=7*dt;}
        }
        draw();raf=requestAnimationFrame(tick);
    }
    function down(e){
        if(e.button!==0||e.pointerType!=='mouse')return;
        active={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};vx=0;vy=0;
        viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');e.preventDefault();
    }
    function move(e){
        if(!active||active.id!==e.pointerId)return;
        const now=performance.now(),dt=Math.max((now-active.time)/1000,.016),dx=e.clientX-active.x,dy=e.clientY-active.y;
        x+=dx;y+=dy;vx=Math.max(-1800,Math.min(1800,dx/dt));vy=Math.max(-1800,Math.min(1800,dy/dt));
        active={id:e.pointerId,x:e.clientX,y:e.clientY,time:now};draw();
    }
    function release(e){
        if(!active||(e.pointerId!==undefined&&e.pointerId!==active.id))return;
        const id=active.id;if(performance.now()-active.time>100||e.type==='pointercancel'||e.type==='blur'){vx=0;vy=0;}
        active=null;pauseUntil=performance.now()+1200;viewport.classList.remove('is-dragging');
        if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);
    }
    viewport.addEventListener('pointerdown',down);viewport.addEventListener('pointermove',move);
    viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);viewport.addEventListener('lostpointercapture',release);window.addEventListener('blur',release);
    draw();raf=requestAnimationFrame(tick);
    return {update(next,animate){if(next?.length)photos=next;moving=animate;draw();},destroy(){cancelAnimationFrame(raf);viewport.removeEventListener('pointerdown',down);viewport.removeEventListener('pointermove',move);viewport.removeEventListener('pointerup',release);viewport.removeEventListener('pointercancel',release);viewport.removeEventListener('lostpointercapture',release);window.removeEventListener('blur',release);}};
}
