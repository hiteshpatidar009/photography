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
for(const directory of ['css','fonts','js','photoswipe'])await cp(join(root,directory),join(out,directory),{recursive:true});
await mkdir(join(out,'img'),{recursive:true});
await cp(join(root,'img','wedding'),join(out,'img','wedding'),{recursive:true});
// Include configured couple photos if supplied. Old portfolio originals are not deployed.
try{await cp(join(root,'img','couple'),join(out,'img','couple'),{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('Built dist/: invitation, dashboard, diary and public assets. Server source and secrets are excluded.');
