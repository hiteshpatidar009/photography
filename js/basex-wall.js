/*
  [JS Index]
*/


/*
  1. preloader
  2. navigation
    2.1. navigation launcher
	2.2. navigation OPEN/CLOSE
  3. animate elements
  4. facts counter
  5. owl carousel
  6. chart skills
  7. skills bar
  8. magnificPopup
  9. swiper slider
  10. contact form
    10.1. contact modal
  11. the Wall
*/


$(function() {
    "use strict";
	
	
	function finishWeddingLoading() {
		// 1. preloader
		$("#preloader").fadeOut(600);
		$(".preloader-bg").delay(400).fadeOut(600);
    }
    if (document.readyState === "complete") finishWeddingLoading();
    else $(window).on("load", finishWeddingLoading);
	
    // 2. navigation
    $(".page-scroll").on("click", function(e) {
        var $anchor = $(this);
        $("html, body").stop().animate({
            scrollTop: $($anchor.attr("href")).offset().top - 0
        }, 1500, 'easeInOutExpo');
        e.preventDefault();
    });
    // 2.1. navigation launcher
    $(".navigation-fire").on("click", function() {
        if ($(".introduction").hasClass("introduction-off")) {
            $(".introduction").removeClass("introduction-off").addClass("introduction-on");
            $("nav.navigation-menu").removeClass("show");
        } else {
            $(".introduction").removeClass("introduction-on").addClass("introduction-off");
            $("nav.navigation-menu").addClass("show");
        }
    });
    // 2.2. navigation OPEN/CLOSE
    $("nav.navigation-menu a").on("click", function() {
        if ($("nav.navigation-menu").hasClass("show")) {
            $("nav.navigation-menu").removeClass("show");
            $(".introduction").removeClass("introduction-off").addClass("introduction-on");
        } else {
            $("nav.navigation-menu").addClass("show");
        }
    });
	
    $(window).on("scroll", function() {
        // 3. animate elements
        if ($(this).scrollTop() > 50) {
            $(".to-top-arrow").addClass("show");
			$(".round-menu").addClass("direction");
			$(".round-menu").addClass("round-menu-no-bg");
			$(".logo").css("filter", "brightness(0)");
        } else {
            $(".to-top-arrow").removeClass("show");
			$(".round-menu").removeClass("direction");
			$(".round-menu").removeClass("round-menu-no-bg");
			$(".logo").css("filter", "none");
        }
    });
	
    // 4. facts counter
    $(".facts-counter-number, .facts-counter-number-years").appear(function() {
        var count = $(this);
        count.countTo({
            from: 0,
            to: count.html(),
            speed: 1200,
            refreshInterval: 60
        });
    });
	
    // 5. owl carousel
    $("#owl-carousel-testimonials").owlCarousel({
        loop: true,
        center: true,
        items: 1,
        margin: 0,
        autoplay: true,
        autoplaySpeed: 1000,
        autoplayTimeout: 4000,
        smartSpeed: 450,
        nav: false,
        animateOut: "fadeOut",
        animateIn: "fadeIn"
    });
    $("#owl-carousel-works").owlCarousel({
        loop: false,
        center: false,
        autoplay: false,
        autoplaySpeed: 1000,
        autoplayTimeout: 5000,
        smartSpeed: 450,
        nav: false,
        nav: true,
        navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
        navContainer: '.owl-nav-custom-works',
		items: 1,
		margin: 0
    });
    $("#owl-carousel-news").owlCarousel({
        loop: false,
        center: false,
        autoplay: false,
        autoplaySpeed: 1000,
        autoplayTimeout: 5000,
        smartSpeed: 450,
        nav: false,
        nav: true,
        navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
        navContainer: '.owl-nav-custom-news',
		items: 1,
		margin: 0
    });
	$("#owl-carousel-team").owlCarousel({
        loop: false,
        center: false,
        autoplay: false,
        autoplaySpeed: 1000,
        autoplayTimeout: 5000,
        smartSpeed: 450,
        nav: false,
        nav: true,
        navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
        navContainer: '.owl-nav-custom-team',
        responsive: {
            0: {
                items: 1,
                margin: 30
            },
            768: {
                items: 2,
                margin: 50
            },
            980: {
                items: 2,
                margin: 50
            },
            1240: {
                items: 3,
                margin: 50
            }
        }
    });
	$("#owl-carousel-news-1").owlCarousel({
		loop: false,
		center: false,
		autoplay: false,
		autoplaySpeed: 1000,
		autoplayTimeout: 5000,
		smartSpeed: 450,
		nav: false,
		nav: true,
		navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
		navContainer: '.owl-nav-custom-news-all.owl-nav-custom-news-1',
		responsive: {
			0: {
				items: 1,
				margin: 15
			},
			768: {
				items: 1,
				margin: 50
			},
			980: {
				items: 1,
				margin: 50
			},
			1240: {
				items: 2,
				margin: 50
			}
		}
	});
	$("#owl-carousel-news-2").owlCarousel({
		loop: false,
		center: false,
		autoplay: false,
		autoplaySpeed: 1000,
		autoplayTimeout: 5000,
		smartSpeed: 450,
		nav: false,
		nav: true,
		navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
		navContainer: '.owl-nav-custom-news-all.owl-nav-custom-news-2',
		responsive: {
			0: {
				items: 1,
				margin: 15
			},
			768: {
				items: 1,
				margin: 50
			},
			980: {
				items: 1,
				margin: 50
			},
			1240: {
				items: 2,
				margin: 50
			}
		}
	});
	$("#owl-carousel-news-3").owlCarousel({
		loop: false,
		center: false,
		autoplay: false,
		autoplaySpeed: 1000,
		autoplayTimeout: 5000,
		smartSpeed: 450,
		nav: false,
		nav: true,
		navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
		navContainer: '.owl-nav-custom-news-all.owl-nav-custom-news-3',
		responsive: {
			0: {
				items: 1,
				margin: 15
			},
			768: {
				items: 1,
				margin: 50
			},
			980: {
				items: 1,
				margin: 50
			},
			1240: {
				items: 2,
				margin: 50
			}
		}
	});
	$("#owl-carousel-news-4").owlCarousel({
		loop: false,
		center: false,
		autoplay: false,
		autoplaySpeed: 1000,
		autoplayTimeout: 5000,
		smartSpeed: 450,
		nav: false,
		nav: true,
		navText: ["<i class='ion-chevron-left'></i>", "<i class='ion-chevron-right'></i>"],
		navContainer: '.owl-nav-custom-news-all.owl-nav-custom-news-4',
		responsive: {
			0: {
				items: 1,
				margin: 15
			},
			768: {
				items: 1,
				margin: 50
			},
			980: {
				items: 1,
				margin: 50
			},
			1240: {
				items: 2,
				margin: 50
			}
		}
	});
	
    // 6. chart skills
    $(".chart-appear-skills").appear(function() {
        $(".chart-skills").easyPieChart({
            easing: "easeOutBounce",
            onStep: function(from, to, percent) {
                $(this.el).find(".percent-skills").text(Math.round(percent));
            }
        });
    });
	
    // 7. skills bar
    $(".show-skillbar").appear(function() {
        $(".skillbar").skillBars({
            from: 0,
            speed: 4000,
            interval: 100,
            decimals: 0
        });
    });
	
    // 8. magnificPopup
    $(".popup-photo").magnificPopup({
        type: "image",
        gallery: {
            enabled: false,
            tPrev: "",
            tNext: "",
            tCounter: "%curr% / %total%"
        },
        removalDelay: 100,
        mainClass: "mfp-fade",
        fixedContentPos: false
    });
	$(".popup-photo-gallery, .popup-photo-gallery-2").each(function() {
        $(this).magnificPopup({
            delegate: "a",
            type: "image",
            gallery: {
                enabled: true
            },
            removalDelay: 100,
            mainClass: "mfp-fade",
            fixedContentPos: false
        });
    });
	
	// 9. swiper slider
    var swiper = new Swiper(".swiper-container-wrapper .swiper-container", {
        preloadImages: false,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false
        },
        init: true,
        loop: false,
        speed: 1200,
        grabCursor: true,
        mousewheel: false,
        keyboard: true,
        simulateTouch: true,
        parallax: true,
        effect: "slide",
        pagination: false,
        navigation: {
            nextEl: ".slide-next",
            prevEl: ".slide-prev"
        },
		scrollbar: {
            el: ".swiper-scrollbar",
            draggable: true
        }
    });
    swiper.on("slideChangeTransitionStart", function() {
        $(".slider-progress-bar").removeClass("slider-active");
        $(".hero-bg").find("video").each(function() {
            this.pause();
        });
    });
    swiper.on("slideChangeTransitionEnd", function() {
        $(".slider-progress-bar").addClass("slider-active");
        $(".hero-bg").find("video").each(function() {
            this.play();
        });
    });
    swiper.on("slideChangeTransitionStart", function() {
        $(".slider-progress-bar").removeClass("slider-active");
    });
    swiper.on("slideChangeTransitionEnd", function() {
        $(".slider-progress-bar").addClass("slider-active");
    });

    // 12. image hover swap - auto convert -2 to color
    $(".hover-element").hover(
        function() {
            var $img = $(this).find("img");
            var src = $img.attr("src");
            if (src.indexOf("-2.") !== -1) {
                var colorSrc = src.replace("-2.jpg", ".jpg").replace("-2.JPG", ".JPG");
                $img.attr("src", colorSrc);
            }
        },
        function() {
            var $img = $(this).find("img");
            var src = $img.attr("src");
            if (src.indexOf("-2.") === -1) {
                var bwSrc = src.replace(".jpg", "-2.jpg").replace(".JPG", "-2.JPG");
                $img.attr("src", bwSrc);
            }
        }
    );
    var playButton = $(".swiper-slide-controls-play-pause-wrapper");
    function autoEnd() {
        playButton.removeClass("slider-on-off");
        swiper.autoplay.stop();
    }
    function autoStart() {
        playButton.addClass("slider-on-off");
        swiper.autoplay.start();
    }
    playButton.on("click", function() {
        if (playButton.hasClass("slider-on-off")) autoEnd();
        else autoStart();
        return false;
    });
	
	// 10. contact form
    $("form#form").on("submit", function() {
        $("form#form .error").remove();
        var s = !1;
        if ($(".requiredField").each(function() {
                if ("" === jQuery.trim($(this).val())) $(this).prev("label").text(), $(this).parent().append('<span class="error">This field is required</span>'), $(this).addClass(
                    "inputError"), s = !0;
                else if ($(this).hasClass("email")) {
                    var r = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
                    r.test(jQuery.trim($(this).val())) || ($(this).prev("label").text(), $(this).parent().append('<span class="error">Invalid email address</span>'), $(this).addClass(
                        "inputError"), s = !0);
                }
            }), !s) {
            $("form#form input.submit").fadeOut("normal", function() {
                $(this).parent().append("");
            });
            var r = $(this).serialize();
            $.post($(this).attr("action"), r, function() {
                $("form#form").slideUp("fast", function() {
                    $(this).before('<div class="success">Your email was sent successfully.</div>');
                });
            });
        }
        return !1;
    });
	// 10.1. contact modal
    $(".contact-modal-launcher, .contact-modal-closer").on("click", function(e) {
        e.preventDefault();
        if ($(".contact-modal").hasClass("open")) {
            $(".contact-modal").removeClass("open");
        } else {
            $(".contact-modal").addClass("open");
        }
    });
	
	
});


// 11. the Wall
window.addEvent("domready", function() {
    var wallPhotos = window.WEDDING.photos.length ? window.WEDDING.photos : window.WEDDING.placeholders;
    var imagewall = Array.from({length: 36}, function(_, i) {
        var photo = wallPhotos[i % wallPhotos.length];
        return [photo.thumbnail || photo.src, [[photo.src, photo.caption || "Tarun &amp; Shelu"]]];
    });
    var maxLength = imagewall.length;
    var wallFluid = new Wall("wall", {
        "draggable": true,
		"slideshow": false, // continuous drift below replaces the tile-by-tile slideshow
        "speed": 1000,
        "showDuration": 4000,
        "transition": Fx.Transitions.Quad.easeOut,
        "inertia": true,
        "autoposition": false,
        "width": 301,
        "height": 320,
        "rangex": [-100, 100],
        "rangey": [-100, 100],
        callOnUpdate: function(items) {
            var root = Math.ceil(Math.sqrt(maxLength));
            document.id("wall").setStyle("margin-left", 0);
            var i = 0;
            (function() {
                try {
                    var position = ((Math.abs(items[i].y) % root) * root) + (Math.abs(items[i].x) % root);
                    if (position >= imagewall.length) {
                        position = position % imagewall.length;
                    }
                    var file = imagewall[position][0];
                    // if main file is empty, fallback to the first slideshow image (if present)
                    if (!file || file === "") {
                        if (imagewall[position][1] && imagewall[position][1].length && imagewall[position][1][0][0]) {
                            file = imagewall[position][1][0][0];
                        }
                    }
                    // Hide empty tiles
                    if (!file || file === "") {
                        items[i].node.setStyle('display', 'none');
                        i++;
                        if (i < items.length) {
                            var tmp = arguments.callee;
                            (function() {
                                tmp();
                            }).delay(10);
                        }
                        return;
                    }
                    // create image element safely and force it to fit the card
                    var img = new Element('img', { src: file, alt: '', 'aria-hidden': 'true' });
                    // ensure the item node hides overflow so images don't resize the card
                    try { items[i].node.setStyle('overflow', 'hidden'); } catch (e) {}
                    // apply styles so image fills the item without affecting layout
                    try {
                        img.setStyles({
                            width: '100%',
                            height: '100%',
                            'max-width': '100%',
                            'max-height': '100%',
                            display: 'block'
                        });
                        // object-fit is not supported by older Mootools setStyles in some cases,
                        // add it via style property if available
                        try { img.style.objectFit = 'cover'; } catch (e) {}
                    } catch (e) {}
                    img.inject(items[i].node).fade("hide").fade("in");
                    var list = new Element("ul");
                    list.setProperty("class", "slideshow")
                    for (var j = 0; j < imagewall[position][1].length; j++) {
                        var slide = new Element("li");
                        new Element("img", {
                            src: imagewall[position][1][j][0]
                        }).inject(slide);
                        var desc = new Element("span", {
                            html: imagewall[position][1][j][1]
                        });
                        var div = new Element("div");
                        div.setProperty("class", "wall-item-description");
                        desc.inject(div);
                        div.inject(slide);
                        slide.inject(list);
                    }
                    list.inject(items[i].node);
                    i++;
                    if (i < items.length) {
                        var tmp = arguments.callee;
                        (function() {
                            tmp();
                        }).delay(10);
                    } else {}
                } catch (e) {}
            })();
        }
    });
    window.setTimeout(function() {
        wallFluid.initWall();
        startWallDrift();
    }, 500);

    // continuous smooth drift of the wall (pauses while the user drags it)
    function startWallDrift() {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var wallEl = document.getElementById("wall");
        if (!wallEl) return;
        var vx = -24, vy = -12; // px per second
        var x = parseFloat(wallEl.style.left) || 0;
        var y = parseFloat(wallEl.style.top) || 0;
        var pausedUntil = 0;
        var dragging = false;
        var last = null;
        function pause() {
            dragging = true;
        }
        function resume() {
            if (!dragging) return;
            dragging = false;
            // let the drag inertia settle before drifting again
            pausedUntil = Date.now() + 1500;
        }
        wallEl.addEventListener("mousedown", pause);
        wallEl.addEventListener("touchstart", pause, { passive: true });
        window.addEventListener("mouseup", resume);
        window.addEventListener("touchend", resume);
        function step(now) {
            var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
            last = now;
            if (dragging || Date.now() < pausedUntil) {
                // pick up from wherever the user left the wall
                x = parseFloat(wallEl.style.left) || 0;
                y = parseFloat(wallEl.style.top) || 0;
            } else {
                x += vx * dt;
                y += vy * dt;
                if (x <= wallFluid.minx || x >= wallFluid.maxx) {
                    vx = -vx;
                    x = Math.min(Math.max(x, wallFluid.minx), wallFluid.maxx);
                }
                if (y <= wallFluid.miny || y >= wallFluid.maxy) {
                    vy = -vy;
                    y = Math.min(Math.max(y, wallFluid.miny), wallFluid.maxy);
                }
                wallEl.style.left = x + "px";
                wallEl.style.top = y + "px";
                var newTiles = wallFluid.updateWall();
                if (newTiles.length) wallFluid.options.callOnUpdate(newTiles);
            }
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
});