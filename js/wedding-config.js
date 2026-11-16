// Edit this file when the couple's photographs and invitation details are ready.
// Dates below are celebration dates, not an assumed wedding ceremony date.
window.WEDDING = {
    story: {
        meeting: 'Our story, in our own words — coming soon.',
        memories: 'A little space for our favourite memories — coming soon.'
    },
    venue: '',
    mapUrl: '',
    contactName: '',
    contactPhone: '',
    rsvpUrl: '',
    rsvpMessage: '',
    // Only add photographs confirmed to be Tarun and Shelu.
    // {src: 'img/couple/photo.jpg', thumbnail: 'img/couple/web/photo.jpg',
    //  large: 'img/couple/large/photo.jpg', width: 1600, height: 1200, caption: 'Your caption'}
    photos: [],
    placeholders: [
        {src: 'img/wedding/blessings.svg', width: 1200, height: 800, caption: 'Blessings — illustrated placeholder; couple photographs coming soon.'},
        {src: 'img/wedding/haldi.svg', width: 1200, height: 800, caption: 'Togetherness — illustrated placeholder; couple photographs coming soon.'},
        {src: 'img/wedding/mehendi.svg', width: 1200, height: 800, caption: 'New beginnings — illustrated placeholder; couple photographs coming soon.'},
        {src: 'img/wedding/sangeet.svg', width: 1200, height: 800, caption: 'Celebration — illustrated placeholder; couple photographs coming soon.'}
    ],
    events: [
        {name: 'Mata Poojan', hindi: 'माता पूजन', date: '2027-02-08', theme: 'As per invitation', image: 'blessings', venue: '', time: '', mapUrl: ''},
        {name: 'Haldi', hindi: 'हल्दी', date: '2027-02-09', theme: 'Lavender', image: 'haldi', venue: '', time: '', mapUrl: ''},
        {name: 'Mehendi', hindi: 'मेहंदी', date: '2027-02-10', theme: 'Pista Green', image: 'mehendi', venue: '', time: '', mapUrl: ''},
        {name: 'Ganga Poojan', hindi: 'गंगा पूजन', date: '2027-02-11', theme: 'Rajputani Dress', image: 'ganga', venue: '', time: '', mapUrl: ''},
        {name: 'Mahila Sangeet Night', hindi: 'महिला संगीत नाइट', date: '2027-02-13', theme: 'As per invitation', image: 'sangeet', venue: '', time: '', mapUrl: ''}
    ]
};

// Dynamic box-by-box hero collage (12+ boxes arranged with a single loop)
window.renderHeroBoxGrid = function(photos) {
    var grid = document.getElementById('hero-photo-grid');
    if (!grid) return;
    var fallback = [
        'img/heroimgs/web/img1.jpg', 'img/heroimgs/web/img3.jpg', 'img/heroimgs/web/img4.jpg',
        'img/heroimgs/web/img5.jpg', 'img/heroimgs/web/img6.jpg', 'img/heroimgs/web/img7.jpg',
        'img/heroimgs/web/img8.jpg', 'img/heroimgs/web/img9.jpg', 'img/heroimgs/web/img10.jpg',
        'img/heroimgs/web/img11.jpg', 'img/heroimgs/web/img12.jpg', 'img/heroimgs/web/img13.jpg',
        'img/heroimgs/web/img14.jpg', 'img/heroimgs/web/img15.jpg', 'img/heroimgs/web/img16.jpg'
    ];
    var getValid = function(arr) {
        if (!arr || !arr.length) return null;
        var valid = arr.filter(function(p) {
            var src = typeof p === 'string' ? p : (p.src || p.url || p.thumbnail || '');
            return src && !src.endsWith('.svg');
        });
        return valid.length ? valid : null;
    };
    var list = getValid(photos)
        || getValid(window.WEDDING && window.WEDDING.backgroundPhotos)
        || getValid(window.WEDDING && window.WEDDING.photos)
        || fallback;

    var count = 18; // 12+ box grid arranged via 1 single loop
    grid.innerHTML = Array.from({length: count}, function(_, i) {
        var item = list[i % list.length];
        var src = typeof item === 'string' ? item : (item.src || item.url || item.thumbnail || '');
        return '<div class="hero-box-item"><img src="' + src + '" alt="Tarun &amp; Shelu" loading="eager"></div>';
    }).join('');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.renderHeroBoxGrid(); });
} else {
    window.renderHeroBoxGrid();
}
