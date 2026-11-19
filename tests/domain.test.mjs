import test from 'node:test';
import assert from 'node:assert/strict';
import {indiaDay,validDate,validateSettings,assertUpload,publicPhoto,jpegDimensions} from '../js/app/domain.js';
import {encode,decode} from '../server/firestore.mjs';
import {zipFiles} from '../js/app/images.js';
test('memory dates use India midnight, not UTC midnight',()=>{
    assert.equal(indiaDay(new Date('2027-02-08T18:29:59Z')),'2027-02-08');
    assert.equal(indiaDay(new Date('2027-02-08T18:30:00Z')),'2027-02-09');
});
test('calendar rejects impossible dates and accepts leap days',()=>{assert.equal(validDate('2027-02-30'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2027-02-29'),false);});
test('uploads have no daily cap but still require active users and enabled uploads',()=>{
    const settings={uploadsEnabled:true,sideLimit:0,guestLimit:0,dailyLimit:0};
    for(const role of ['admin','groom','bride','guest'])assert.doesNotThrow(()=>assertUpload({role},settings));
    assert.throws(()=>assertUpload({role:'admin',disabled:true},settings),/cannot upload/);
    assert.throws(()=>assertUpload({role:'guest'},{uploadsEnabled:false}),/paused/);
});
test('settings reject unsafe URLs and ignore obsolete daily-limit fields',()=>{
    const base={startDate:'2027-02-08',sideLimit:10,guestLimit:5,dailyLimit:50,events:[]};
    assert.throws(()=>validateSettings({...base,musicUrl:'javascript:alert(1)'}),/https/);
    assert.equal(validateSettings({...base,sideLimit:500}).sideLimit,undefined);
    assert.equal(validateSettings(base).dailyLimit,undefined);
    assert.throws(()=>validateSettings({...base,events:[{name:'Haldi',date:'2027-02-30'}]}),/valid date/);
    assert.equal(validateSettings(base).uploadsEnabled,true);
});
test('public photo excludes uploader IDs and host deletion credentials',()=>{
    const photo=publicPhoto({id:'x',owner:'secret-user',deleteUrl:'secret',src:'https://example.com/x.jpg',status:'published'});
    assert.equal(photo.owner,undefined);assert.equal(photo.deleteUrl,undefined);assert.equal(photo.status,undefined);
});
test('JPEG size and dimensions validated from bytes',()=>{
    const bytes=new Uint8Array([255,216,255,192,0,11,8,3,32,4,176,1,1,17,0,255,217]);
    assert.deepEqual(jpegDimensions(bytes),{height:800,width:1200});
    assert.throws(()=>jpegDimensions(new Uint8Array([1,2,3])),/JPEG/);
});
test('Firestore values roundtrip nested content and empty arrays',()=>{const input={name:'मेहंदी',limit:10,enabled:false,list:[null,1.5,{}],empty:[]};assert.deepEqual(decode(encode(input)),input);});
test('ZIP export contains readable local and central entries',async()=>{
    const zip=zipFiles([{name:'memory.txt',data:new TextEncoder().encode('A wedding memory')}]);
    const buffer=await zip.arrayBuffer(),view=new DataView(buffer);
    assert.equal(view.getUint32(0,true),0x04034b50);assert.equal(view.getUint32(buffer.byteLength-22,true),0x06054b50);assert.equal(view.getUint16(buffer.byteLength-14,true),1);
});

test('banner settings preserve order, deduplicate IDs and validate shading',()=>{
    const base={startDate:'2027-02-08',events:[]};
    const a='a'.repeat(64), b='b'.repeat(64);
    const settings=validateSettings({...base,bannerPhotoIds:[b,a,b],bannerMotion:false,bannerOverlay:55});
    assert.deepEqual(settings.bannerPhotoIds,[b,a]);
    assert.equal(settings.bannerMotion,false);
    assert.equal(settings.bannerOverlay,55);
    assert.equal(validateSettings(base).bannerMotion,true);
    assert.throws(()=>validateSettings({...base,bannerPhotoIds:['../users/admin']}),/banner photos/);
    assert.throws(()=>validateSettings({...base,bannerPhotoIds:Array(25).fill(a)}),/banner photos/);
    assert.throws(()=>validateSettings({...base,bannerOverlay:100}),/shading/);
});

test('wedding photo settings allow HTTPS only',()=>{
 const base={startDate:'2027-02-08',events:[]};
 for(const field of ['couplePhoto','groomPhoto','bridePhoto','venuePhoto']){
  assert.equal(validateSettings({...base,[field]:'https://example.com/invitation'})[field],'https://example.com/invitation');
  assert.throws(()=>validateSettings({...base,[field]:'javascript:alert(1)'}),/https/);
 }
});

test('event photographs survive saving and reject unsafe sources',()=>{
 const event={name:'Haldi',date:'2027-02-09',photo:'https://i.ibb.co/event.jpg'};
 const base={startDate:'2027-02-08',events:[event]};
 assert.equal(validateSettings(base).events[0].photo,event.photo);
 assert.throws(()=>validateSettings({...base,events:[{...event,photo:'javascript:alert(1)'}]}),/https/);
});
