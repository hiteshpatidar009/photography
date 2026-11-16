import {MAX_IMAGE_BYTES, requireValue} from './domain.js';
export async function optimizePhoto(file) {
    requireValue(['image/jpeg','image/png','image/webp'].includes(file.type), 'Choose a JPEG, PNG, or WebP photo. Convert HEIC photos to JPEG first.');
    requireValue(file.size <= 20 * 1024 * 1024, 'Choose a photo under 20 MB.');
    const bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
    try {
        requireValue(bitmap.width >= 100 && bitmap.height >= 100, 'Photo is too small. Minimum 100 pixels per side.');
        const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        let blob;
        for (const quality of [.88,.8,.7,.6]) { blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',quality)); if (blob && blob.size <= MAX_IMAGE_BYTES) break; }
        requireValue(blob && blob.size <= MAX_IMAGE_BYTES, 'This image is too detailed. Resize it and try again.');
        return {blob, width: canvas.width, height: canvas.height};
    } finally { bitmap.close(); }
}
export function saveJSON(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
// Dependency-free ZIP (stored entries, no recompression). Use small album batches.
export function zipFiles(files) {
    const encoder = new TextEncoder(), parts = [], central = []; let offset = 0, centralSize = 0;
    const crc = bytes => { let n = -1; for (const byte of bytes) { n ^= byte; for (let k=0;k<8;k++) n = (n >>> 1) ^ (0xedb88320 & -(n & 1)); } return (n ^ -1) >>> 0; };
    const block = length => { const bytes = new Uint8Array(length); return {bytes, view: new DataView(bytes.buffer)}; };
    for (const file of files) {
        const name = encoder.encode(file.name), data = file.data, checksum = crc(data);
        const local = block(30); local.view.setUint32(0,0x04034b50,true); local.view.setUint16(4,20,true); local.view.setUint16(6,0x800,true); local.view.setUint32(14,checksum,true); local.view.setUint32(18,data.length,true); local.view.setUint32(22,data.length,true); local.view.setUint16(26,name.length,true);
        parts.push(local.bytes,name,data);
        const entry = block(46); entry.view.setUint32(0,0x02014b50,true); entry.view.setUint16(4,20,true); entry.view.setUint16(6,20,true); entry.view.setUint16(8,0x800,true); entry.view.setUint32(16,checksum,true); entry.view.setUint32(20,data.length,true); entry.view.setUint32(24,data.length,true); entry.view.setUint16(28,name.length,true); entry.view.setUint32(42,offset,true);
        central.push(entry.bytes,name); centralSize += 46+name.length; offset += 30+name.length+data.length;
    }
    const end = block(22); end.view.setUint32(0,0x06054b50,true); end.view.setUint16(8,files.length,true); end.view.setUint16(10,files.length,true); end.view.setUint32(12,centralSize,true); end.view.setUint32(16,offset,true);
    return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}
