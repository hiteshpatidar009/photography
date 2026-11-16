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
        return `<article class="row wedding-event">
            <div class="col-sm-3"><div class="inner-spacer">
                <div class="chart-wrapper event-date-ring"><span class="chart-skills chart-appear-skills" data-percent="100"><span class="percent-skills" aria-hidden="true"></span></span><span class="event-day">${escape(event.date.slice(-2))}<small>${escape(date.toLocaleDateString('en-GB', {month:'short', year:'numeric', timeZone:'Asia/Kolkata'}).toUpperCase())}</small></span></div>
            </div></div>
            <div class="col-sm-6"><div class="inner-spacer">
                <h2 class="section-subheading"><span lang="hi">${escape(event.hindi)}</span></h2><div class="divider-s"></div>
                <h3 class="post-title post-title-s">${escape(event.name)}</h3><div class="divider-s"></div>
                <div class="section-txt"><p><time datetime="${escape(event.date)}">${escape(label)}</time></p>
                <p class="event-theme theme-${escape(event.image)}">Dress code / theme: ${escape(event.theme)}</p>
                <p>Venue: ${escape(event.venue || 'To be announced')}<br>Time: ${escape(event.time || 'To be announced')}</p>
                ${map ? `<p><a class="link-effect" href="${escape(map)}" target="_blank" rel="noopener">View directions</a></p>` : ''}</div>
            </div></div>
            <div class="col-sm-3"><div class="inner-spacer"><img class="event-illustration" src="img/wedding/${escape(event.image)}.svg" alt="Decorative illustration for ${escape(event.name)}" width="1200" height="800" loading="lazy"></div></div>
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
