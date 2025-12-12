// Dynamic works data
const imageList = [
    {src: 'img/heroimgs/img1.jpg'},
    {src: 'img/heroimgs/img3.JPG'},
    {src: 'img/heroimgs/img4.JPG'},
    {src: 'img/heroimgs/img5.JPG'},
    {src: 'img/heroimgs/img6.JPG'},
    {src: 'img/heroimgs/img7.jpg'},
    {src: 'img/heroimgs/img8.jpg'},
    {src: 'img/heroimgs/img9.jpg'},
    {src: 'img/heroimgs/img10.jpg'},
    {src: 'img/heroimgs/img11.jpg'},
    {src: 'img/heroimgs/img12.jpg'},
    {src: 'img/heroimgs/img13.jpg'},
    {src: 'img/heroimgs/img14.jpg'},
    {src: 'img/heroimgs/img15.JPG'},
    {src: 'img/heroimgs/img16.JPG'},
    {src: 'img/new-images/img17.jpg'},
    {src: 'img/new-images/img18.JPG'},
    {src: 'img/new-images/img19.jpg'},
    {src: 'img/new-images/img20.jpg'},
    {src: 'img/new-images/img21.JPG'},
    {src: 'img/new-images/img22.JPG'},
    {src: 'img/new-images/img23.jpg'},
    {src: 'img/new-images/img24.jpg'},
    {src: 'img/new-images/img25.jpg'},
    {src: 'img/new-images/img26.jpg'},
    {src: 'img/new-images/img27.JPG'},
    {src: 'img/new-images/img28.JPG'}
];

let currentPage = 0;
const imagesPerPage = 12;

// Generate dynamic CSS for background images
function generateDynamicCSS() {
    let css = '';
    imageList.forEach((item, index) => {
        const itemNumber = String(index + 1).padStart(2, '0');
        css += `.item-works-${itemNumber} { background-image: url(${item.src}); }\n`;
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
                                        <a class="thumb-link" data-size="1920x1280" href="${item.src}">
                                            <div class="more-button-bg-center more-button-circle"></div>
                                            <div class="more-button-txt-center">
                                                <span>View</span>
                                            </div>
                                        </a>
                                        <div class="item-folio__caption">Lorem Ipsum is simply dummy text.</div>
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
                            <a class="thumb-link" data-size="1920x1280" href="${item.src}">
                                <div class="more-button-bg-center more-button-circle"></div>
                                <div class="more-button-txt-center">
                                    <span>View</span>
                                </div>
                            </a>
                            <div class="item-folio__caption">Lorem Ipsum is simply dummy text.</div>
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
    generateDynamicCSS();
    generateWorksGrid();
    generateCarousel();
    
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
document.addEventListener('DOMContentLoaded', initDynamicWorks);