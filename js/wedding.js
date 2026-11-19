// Build content before the template initializes its existing appearance animations.
(function () {
    const config = window.WEDDING;
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
    const safeUrl = value => {
        try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
        catch (_) { return ''; }
    };
    document.getElementById('wedding-events').innerHTML = config.events.map((event, index) => {
        const date = new Date(event.date + 'T12:00:00+05:30');
        const label = date.toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'});
        const map = safeUrl(event.mapUrl);
        return `<article class="wedding-event event-${escape(event.image)}">
            <div class="event-picture"><img src="${escape(event.photo || 'img/wedding/'+event.image+'.svg')}" alt="${event.photo ? escape(event.name) : 'Decorative '+escape(event.name)+' illustration'}" loading="lazy"><time datetime="${escape(event.date)}"><strong>${escape(event.date.slice(-2))}</strong><span>${escape(date.toLocaleDateString('en-GB',{month:'short',year:'numeric'}))}</span></time></div>
            <div class="event-body"><span class="event-hindi" lang="hi">${escape(event.hindi)}</span><h3>${escape(event.name)}</h3><p class="event-time">${escape(event.time || 'Time to be announced')}</p>${event.theme ? `<span class="dress-tag">${escape(event.theme)}</span>` : ''}<p class="event-venue">${escape(event.venue || 'Venue to be announced')}</p>${map ? `<a href="${escape(map)}" target="_blank" rel="noopener" class="site-text-link">Directions ?</a>` : ''}</div>
        </article>`;
    }).join('');
    document.querySelectorAll('[data-story]').forEach(el => { el.textContent = config.story[el.dataset.story]; });
    if (config.venue) document.getElementById('venue-details').textContent = config.venue;
    if (config.contactPhone) {
        const link = document.createElement('a');
        link.href = 'tel:' + config.contactPhone.replace(/[^+\d]/g, '');
        link.className = 'link-effect';
        link.textContent = [config.contactName, config.contactPhone].filter(Boolean).join(' · ');
        document.getElementById('family-contact').replaceChildren(link);
    }
    const map = safeUrl(config.mapUrl);
    if (map) {
        const link = document.createElement('a');
        link.href = map; link.textContent = 'View directions'; link.className = 'link-effect';
        link.target = '_blank'; link.rel = 'noopener';
        document.getElementById('map-details').replaceChildren(link);
    }
    const rsvp = safeUrl(config.rsvpUrl);
    if (rsvp) {
        const link = document.getElementById('rsvp-link');
        link.href = rsvp; link.hidden = false;
        document.getElementById('rsvp-summary').textContent = 'Open RSVP Details below to respond.';
        document.getElementById('rsvp-details').textContent = config.rsvpMessage || 'Please follow the link below to share your RSVP with our families.';
    } else if (config.rsvpMessage) {
        document.getElementById('rsvp-details').textContent = config.rsvpMessage;
    }
    // Preserve the template's click handlers and add keyboard access.
    document.querySelectorAll('.navigation-fire, .contact-modal-closer').forEach(el => {
        el.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); }
        });
    });
    function initializeWeddingAccessibility() {
        const modal = document.querySelector('.contact-modal');
        const launcher = document.querySelector('.contact-modal-launcher');
        const closer = document.querySelector('.contact-modal-closer');
        const menu = document.querySelector('.navigation-menu');
        const menuButton = document.querySelector('.navigation-fire');
        modal.inert = true;
        new MutationObserver(() => {
            const open = modal.classList.contains('open');
            modal.inert = !open;
            modal.setAttribute('aria-hidden', String(!open));
            (open ? closer : launcher).focus();
        }).observe(modal, {attributes: true, attributeFilter: ['class']});
        new MutationObserver(() => menuButton.setAttribute('aria-expanded', String(menu.classList.contains('show')))).observe(menu, {attributes: true, attributeFilter: ['class']});
        document.addEventListener('keydown', event => {
            if (modal.classList.contains('open')) {
                if (event.key === 'Escape') closer.click();
                if (event.key === 'Tab') {
                    const focusable = [...modal.querySelectorAll('a[href]:not([hidden]), [tabindex="0"]')];
                    const first = focusable[0], last = focusable[focusable.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
                }
            } else if (event.key === 'Escape' && menu.classList.contains('show')) { menuButton.click(); menuButton.focus(); }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeWeddingAccessibility);
    else initializeWeddingAccessibility();
})();
