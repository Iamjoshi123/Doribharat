/**
 * Doribharat Heritage — Global JavaScript
 * Handles: mobile menu, cart drawer, back-to-top, announcement dismissal
 */

(function () {
    'use strict';

    // ── Mobile Menu Toggle ──
    var menuToggle = document.getElementById('MobileMenuToggle');
    var mobileMenu = document.getElementById('MobileMenu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function () {
            var isOpen = mobileMenu.classList.toggle('is-open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // ── Cart Drawer Toggle ──
    var cartIcon = document.querySelector('[data-cart-toggle]');
    var cartDrawer = document.getElementById('CartDrawer');
    var cartOverlay = document.getElementById('CartOverlay');
    var cartClose = document.getElementById('CartDrawerClose');

    function openCart(e) {
        if (e) e.preventDefault();
        if (cartDrawer) cartDrawer.classList.add('is-open');
        if (cartOverlay) cartOverlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        if (cartDrawer) cartDrawer.classList.remove('is-open');
        if (cartOverlay) cartOverlay.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    if (cartIcon) cartIcon.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // ── Back to Top ──
    var backToTop = document.getElementById('BackToTop');

    if (backToTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTop.classList.add('is-visible');
            } else {
                backToTop.classList.remove('is-visible');
            }
        }, { passive: true });

        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Announcement Bar Dismissal ──
    var announcementClose = document.getElementById('AnnouncementClose');
    var announcementBar = document.getElementById('AnnouncementBar');

    if (announcementClose && announcementBar) {
        // Check if previously dismissed
        if (sessionStorage.getItem('announcement_dismissed')) {
            announcementBar.style.display = 'none';
        }

        announcementClose.addEventListener('click', function () {
            announcementBar.style.display = 'none';
            sessionStorage.setItem('announcement_dismissed', 'true');
        });
    }

    // ── Product Gallery Image Switch ──
    window.switchImage = function (thumb) {
        var mainImg = document.getElementById('ProductMainImage');
        if (mainImg) {
            mainImg.src = thumb.getAttribute('data-image-url');
            mainImg.style.animation = 'none';
            mainImg.offsetHeight; // force reflow
            mainImg.style.animation = 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        document.querySelectorAll('.product-gallery__thumb').forEach(function (t) {
            t.classList.remove('is-active');
        });
        thumb.classList.add('is-active');
    };

    // ── Product Quantity ──
    window.updateQty = function (delta) {
        var input = document.getElementById('ProductQty');
        if (!input) return;
        var current = parseInt(input.value) || 1;
        var next = Math.max(1, current + delta);
        input.value = next;
    };

    // ── Product Tabs ──
    window.switchTab = function (btn) {
        var tabName = btn.getAttribute('data-tab');
        document.querySelectorAll('.product-info__tab').forEach(function (t) {
            t.classList.remove('is-active');
        });
        document.querySelectorAll('.product-info__tab-content').forEach(function (c) {
            c.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        var content = document.querySelector('[data-tab-content="' + tabName + '"]');
        if (content) content.classList.add('is-active');
    };

    // ── Intersection Observer for Animations ──
    if ('IntersectionObserver' in window) {
        var animateElements = document.querySelectorAll('[data-animate]');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        animateElements.forEach(function (el) {
            observer.observe(el);
        });
    }

})();
