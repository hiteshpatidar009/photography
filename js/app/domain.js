export const ROLES = ['admin', 'groom', 'bride', 'guest'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const INDIA = 'Asia/Kolkata';
export function indiaDay(date = new Date()) {
    const p = new Intl.DateTimeFormat('en-CA', {timeZone: INDIA, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
    return ['year', 'month', 'day'].map(key => p.find(x => x.type === key).value).join('-');
}
export function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function requireValue(condition, message, status = 400) {
    if (!condition) throw Object.assign(new Error(message), {status});
}
export function text(value, max = 300) { return String(value ?? '').trim().slice(0, max); }
export function httpsUrl(value) {
    if (!value) return '';
    try { const u = new URL(value); if (u.protocol === 'https:' && !u.username && !u.password) return u.href; } catch (_) {}
    throw Object.assign(new Error('Use a full https:// URL.'), {status: 400});
}
export function validateSettings(input) {
    requireValue(input && typeof input === 'object', 'Invalid website settings.');
    const result = {};
    for (const key of ['coupleNames', 'groomName', 'brideName', 'groomBio', 'brideBio', 'headline', 'welcome', 'venue', 'contactName', 'contactPhone', 'rsvpMessage']) result[key] = text(input[key], 1500);
    for (const key of ['mapUrl', 'rsvpUrl', 'heroPhoto', 'musicUrl']) result[key] = httpsUrl(input[key]);
    result.story = {meeting: text(input.story?.meeting, 3000), memories: text(input.story?.memories, 3000)};
    requireValue(validDate(input.startDate), 'Choose a valid diary start date.');
    result.startDate = input.startDate;
    result.uploadsEnabled = input.uploadsEnabled !== false;
    requireValue(Array.isArray(input.events) && input.events.length <= 20, 'Maximum 20 events.');
    result.events = input.events.map(e => {
        requireValue(validDate(e.date) && text(e.name), 'Each event needs a name and valid date.');
        return {name: text(e.name, 100), hindi: text(e.hindi, 100), date: e.date, theme: text(e.theme), venue: text(e.venue), time: text(e.time, 100), mapUrl: httpsUrl(e.mapUrl), image: ['blessings', 'haldi', 'mehendi', 'ganga', 'sangeet'].includes(e.image) ? e.image : 'blessings'};
    }).sort((a, b) => a.date.localeCompare(b.date));
    return result;
}
export function assertUpload(user, settings) {
    requireValue(user && ROLES.includes(user.role) && !user.disabled, 'This account cannot upload.', 403);
    requireValue(settings.uploadsEnabled, 'Uploads are paused by the admin.', 403);
}
export function publicPhoto(p) {
    return Object.fromEntries(['id', 'src', 'thumbnail', 'width', 'height', 'caption', 'date', 'side', 'featured', 'createdAt'].map(key => [key, p[key]]));
}
export function albumLabel(date, startDate) {
    const n = Math.floor((Date.parse(date) - Date.parse(startDate)) / 86400000) + 1;
    return n > 0 ? `Day ${n}` : 'Before the celebrations';
}
export function jpegDimensions(bytes) {
    requireValue(bytes.length <= MAX_IMAGE_BYTES && bytes[0] === 255 && bytes[1] === 216, 'Upload an optimized JPEG under 2 MB.');
    let offset = 2;
    while (offset + 9 < bytes.length) {
        requireValue(bytes[offset] === 255, 'Invalid JPEG image.');
        const marker = bytes[offset + 1];
        if (marker === 218 || marker === 217) break;
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
        requireValue(length >= 2 && offset + 2 + length <= bytes.length, 'Invalid JPEG segment.');
        if ([192, 193, 194].includes(marker)) {
            const height = (bytes[offset + 5] << 8) | bytes[offset + 6], width = (bytes[offset + 7] << 8) | bytes[offset + 8];
            requireValue(width >= 100 && height >= 100 && width <= 2400 && height <= 2400, 'Photo dimensions must be between 100 and 2400 pixels.');
            return {width, height};
        }
        offset += length + 2;
    }
    throw Object.assign(new Error('Cannot read JPEG dimensions.'), {status: 400});
}
