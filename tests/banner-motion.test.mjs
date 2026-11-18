import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tileAt} from '../js/app/collage.js';
test('collage indices stay valid while panning in every direction',()=>{
    for(const count of [1,7,24])for(let x=-60;x<=60;x++)for(let y=-40;y<=40;y++){
        const index=tileAt(x,y,count);assert.ok(index>=0&&index<count);
        assert.equal(index,tileAt(x+count,y,count));
    }
});
test('native collage starts before content fetch and legacy wall does not replace it',async()=>{
    const main=await readFile(new URL('../js/app/public.js',import.meta.url),'utf8');
    const legacy=await readFile(new URL('../js/basex-wall.js',import.meta.url),'utf8');
    assert.ok(main.indexOf('const collage = mountCollage')<main.indexOf("await api('/public?home=1')"));
    assert.match(legacy,/wallEl.dataset.nativeCollage === "true"/);
    assert.ok(!main.includes('heroBg.style.backgroundImage'));
});
