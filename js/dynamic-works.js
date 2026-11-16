// Dynamic works data
const imageList = window.WEDDING.photos;

let currentPage = 0;
const imagesPerPage = 12;

// Resized copies made by optimize-images.py: 'web' for thumbnails, 'large' for the full-screen viewer
function sizedSrc(src, size) {
    const item = imageList.find(photo => photo.src === src);
    return (size === 'web' ? item.thumbnail : item.large) || src;
}

function escapeCaption(value) {
    return String(value || 'Tarun & Shelu').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}

// Generate dynamic CSS for background images
function generateDynamicCSS() {
    let css = '';
    imageList.forEach((item, index) => {
        const itemNumber = String(index + 1).padStart(2, '0');
        css += `.item-works-${itemNumber} { background-image: url(${sizedSrc(item.src, 'web')}); }\n`;
    });
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

// Generate works grid with pagination
function generateWorksGrid() {
    const worksGrid = document.querySelector('.works-grid');
    if (!worksGrid) return;
    
    worksGrid.innerHTML = '';
    
    // Get current page images
    const startIndex = currentPage * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const gridImages = imageList.slice(startIndex, endIndex);
    
    // Generate rows (4 items per row)
    for (let i = 0; i < gridImages.length; i += 4) {
        const row = document.createElement('div');
        row.className = 'row';
        
        for (let j = 0; j < 4 && (i + j) < gridImages.length; j++) {
            const localIndex = i + j;
            const globalIndex = startIndex + localIndex;
            const item = gridImages[localIndex];
            const itemNumber = String(globalIndex + 1).padStart(2, '0');
            
            row.innerHTML += `
                <div class="col-md-3">
                    <div class="inner-spacer">
                        <div class="circle-wrapper-full">
                            <div class="carousel-item-all item-works-${itemNumber}"></div>
                            <div class="center-container">
                                <div class="center-block">
                                    <div class="more-wraper-center item-folio">
                                        <a class="thumb-link" aria-label="${escapeCaption(item.caption)}" data-size="${item.width || 1200}x${item.height || 800}" href="${sizedSrc(item.src, 'large')}">
                                            <div class="more-button-bg-center more-button-circle"></div>
                                            <div class="more-button-txt-center">
                                                <span>View</span>
                                            </div>
                                        </a>
                                        <div class="item-folio__caption">${escapeCaption(item.caption)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="divider-m-2"></div>
                    </div>
                </div>
            `;
        }
        
        worksGrid.appendChild(row);
    }
}

// Generate carousel items
function generateCarousel() {
    const carousel = document.querySelector('.owl-carousel-works');
    if (!carousel) return;
    
    carousel.innerHTML = '';
    
    imageList.forEach((item, index) => {
        const itemNumber = String(index + 1).padStart(2, '0');
        
        const carouselItem = document.createElement('div');
        carouselItem.className = 'item';
        carouselItem.innerHTML = `
            <div class="circle-wrapper-full">
                <div class="carousel-item-all item-works-${itemNumber}"></div>
                <div class="center-container">
                    <div class="center-block">
                        <div class="more-wraper-center item-folio">
                            <a class="thumb-link" aria-label="${escapeCaption(item.caption)}" data-size="${item.width || 1200}x${item.height || 800}" href="${sizedSrc(item.src, 'large')}">
                                <div class="more-button-bg-center more-button-circle"></div>
                                <div class="more-button-txt-center">
                                    <span>View</span>
                                </div>
                            </a>
                            <div class="item-folio__caption">${escapeCaption(item.caption)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        carousel.appendChild(carouselItem);
    });
}

// Initialize dynamic works
function initDynamicWorks() {
    document.querySelector('.owl-nav-custom-works').hidden = imageList.length <= imagesPerPage;
    if (window.WEDDING.photos.length) document.getElementById('gallery-note').textContent = 'Our beautiful moments, gathered with love.';
    if (!imageList.length) { document.getElementById('gallery-note').textContent = 'Our favourite photographs will appear here soon.'; return; }
    generateDynamicCSS();
    generateWorksGrid();
    generateCarousel();

    // The template binds PhotoSwipe only once. Resolve the current page on each
    // click so dynamically replaced pages retain the same viewer and transitions.
    const grid = document.querySelector('.works-grid');
    grid.addEventListener('click', function(event) {
        const link = event.target.closest('.thumb-link');
        if (!link) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const links = Array.from(grid.querySelectorAll('.thumb-link'));
        const items = links.map(anchor => {
            const size = anchor.dataset.size.split('x').map(Number);
            return {src: anchor.href, w: size[0], h: size[1], title: anchor.parentElement.querySelector('.item-folio__caption').innerHTML};
        });
        new PhotoSwipe(document.querySelector('.pswp'), PhotoSwipeUI_Default, items,
            {index: links.indexOf(link), showHideOpacity: true}).init();
    }, true);
    
    // Connect navigation to grid pagination
    $('.owl-next').click(function() {
        const totalPages = Math.ceil(imageList.length / imagesPerPage);
        if (currentPage < totalPages - 1) {
            currentPage++;
            generateWorksGrid();
        }
    });
    
    $('.owl-prev').click(function() {
        if (currentPage > 0) {
            currentPage--;
            generateWorksGrid();
        }
    });
}

// Run when DOM is loaded
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDynamicWorks);
else initDynamicWorks();
