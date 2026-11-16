import {mkdir, copyFile, cp, readdir, rm} from 'node:fs/promises';
import {resolve, join, relative} from 'node:path';
import {configurePublic} from './configure.mjs';
await configurePublic(undefined, process.argv.includes('--demo'));
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist');
if(relative(root,out)!=='dist')throw new Error('Invalid build destination.');
await mkdir(out,{recursive:true});
// Only remove stale files inside this dedicated build output.
for(const entry of await readdir(out))await rm(join(out,entry),{recursive:true,force:true});
for(const file of ['index.html','admin.html','diary.html'])await copyFile(join(root,file),join(out,file));
for(const directory of ['css','fonts','js','photoswipe','the-wall'])await cp(join(root,directory),join(out,directory),{recursive:true});
await mkdir(join(out,'img'),{recursive:true});
for(const dir of ['wedding','heroimgs','new-images','couple']){
    try{await cp(join(root,'img',dir),join(out,'img',dir),{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
}
for(const file of ['logo.png','Logo-web.png']){
    try{await copyFile(join(root,'img',file),join(out,'img',file));}catch(error){if(error.code!=='ENOENT')throw error;}
}
console.log('Built dist/: invitation, dashboard, diary and public assets. Server source and secrets are excluded.');
