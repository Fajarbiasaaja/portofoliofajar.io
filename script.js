/* ===================================
   PORTFOLIO FAJAR SIDIQ - SCRIPTS v3.0
   =================================== */

/* ===================================
   TYPED TEXT ANIMATION
   =================================== */

const typedRoles = [
    'Web Developer 🚀',
    'RPL Student 🎓',
    'UI Designer ✨',
    'Problem Solver 💡',
    'Code Enthusiast 💻',
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimer = null;

function typeEffect() {
    const el = document.getElementById('typedText');
    if (!el) return;

    const currentRole = typedRoles[roleIndex];

    if (isDeleting) {
        el.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        el.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 60 : 100;

    if (!isDeleting && charIndex === currentRole.length) {
        speed = 2000; // Pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % typedRoles.length;
        speed = 400;
    }

    typingTimer = setTimeout(typeEffect, speed);
}

/* ===================================
   SCROLL REVEAL ANIMATION
   =================================== */

function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Animate skill bars when visible
                const skillBar = entry.target.querySelector('.skill-bar');
                if (skillBar) {
                    const pct = skillBar.getAttribute('data-pct');
                    setTimeout(() => {
                        skillBar.style.width = pct + '%';
                    }, 300);
                }
                // Animate all skill bars inside this element
                const skillBars = entry.target.querySelectorAll('.skill-bar');
                skillBars.forEach(bar => {
                    const pct = bar.getAttribute('data-pct');
                    setTimeout(() => {
                        bar.style.width = pct + '%';
                    }, 400);
                });
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
}

/* ===================================
   NAVBAR SCROLL EFFECT + ACTIVE LINK
   =================================== */

function initNavbar() {
    const navbar = document.getElementById('mainNavbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Scroll shadow
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        highlightActiveNav(sections, navLinks);
    }, { passive: true });

    // Smooth scroll + close mobile menu
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#') && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = navbar.offsetHeight + 8;
                    const top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
                // Close mobile menu
                const navCollapse = document.querySelector('.navbar-collapse');
                if (navCollapse && navCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            }
        });
    });
}

function highlightActiveNav(sections, navLinks) {
    let current = '';
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (scrollY >= top) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

/* ===================================
   FALLING STARS ANIMATION
   =================================== */

class FallingStar {
    constructor(canvasWidth, canvasHeight) {
        this.reset(canvasWidth, canvasHeight);
    }

    reset(w, h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h - h * 0.5;
        this.radius = Math.random() * 1.4 + 0.4;
        this.velocity = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.55 + 0.25;
        this.twinkleSpeed = Math.random() * 0.018 + 0.008;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
        // Random color tint
        this.hue = Math.random() > 0.7
            ? `rgba(180, 220, 255, ${this.opacity})`
            : `rgba(255, 255, 255, ${this.opacity})`;
    }

    update() {
        this.y += this.velocity;
        this.opacity += this.twinkleSpeed * this.twinkleDir;

        if (this.opacity > 0.9) this.twinkleDir = -1;
        else if (this.opacity < 0.15) this.twinkleDir = 1;

        if (this.y > this.canvasHeight + this.radius * 2) {
            this.reset(this.canvasWidth, this.canvasHeight);
            this.y = -this.radius;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Glow
        ctx.shadowColor = 'rgba(100, 190, 255, 0.8)';
        ctx.shadowBlur = this.radius * 5;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function initFallingStars() {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let animFrame;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        stars = [];
        for (let i = 0; i < 130; i++) {
            stars.push(new FallingStar(canvas.width, canvas.height));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.update();
            star.draw(ctx);
        });
        animFrame = requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();

    const debouncedResize = debounce(resizeCanvas, 250);
    window.addEventListener('resize', debouncedResize, { passive: true });
}

/* ===================================
   CONTACT FORM HANDLER
   =================================== */

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalHTML = submitBtn.innerHTML;

        // Validate
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const msg = document.getElementById('pesan');

        if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
            shakeForm(submitBtn);
            return;
        }

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Mengirim...';

        // Show toast and submit
        setTimeout(() => {
            showToast();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;

            // Delay actual submission so user sees the toast
            setTimeout(() => {
                form.submit();
            }, 2500);
        }, 700);
    });
}

function shakeForm(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => el.style.animation = '', 600);
}

function showToast() {
    const toastEl = document.getElementById('successToast');
    if (!toastEl) return;
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

/* ===================================
   IMAGE ZOOM MODAL
   =================================== */

function zoomImage(imageSrc, imageTitle) {
    const titleEl = document.getElementById('imageZoomLabel');
    const imgEl = document.getElementById('zoomImageSrc');

    if (titleEl) titleEl.textContent = imageTitle;
    if (imgEl) imgEl.src = imageSrc;

    const modal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
    modal.show();
}

/* ===================================
   SKILL BARS - ALSO TRIGGER ON SECTION VISIBLE
   =================================== */

function animateSkillBars() {
    const bars = document.querySelectorAll('.skill-bar[data-pct]');
    bars.forEach(bar => {
        const pct = bar.getAttribute('data-pct');
        bar.style.width = pct + '%';
    });
}

/* ===================================
   UTILITY: DEBOUNCE
   =================================== */

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/* ===================================
   CSS ANIMATION: SHAKE
   =================================== */

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-8px); }
    30% { transform: translateX(8px); }
    45% { transform: translateX(-6px); }
    60% { transform: translateX(6px); }
    75% { transform: translateX(-3px); }
    90% { transform: translateX(3px); }
}
`;
document.head.appendChild(shakeStyle);

/* ===================================
   INIT ALL ON DOM READY
   =================================== */

document.addEventListener('DOMContentLoaded', function () {
    initFallingStars();
    initScrollReveal();
    initNavbar();
    initContactForm();

    // Start typing animation
    setTimeout(typeEffect, 600);

    // Trigger skill bars for any already-visible sections
    setTimeout(animateSkillBars, 1200);
});

/* ===================================
   CONSOLE BRANDING
   =================================== */
console.log('%c✨ Portfolio Fajar Sidiq v3.0', 'color: #0099ff; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #0099ff44;');
console.log('%cRekayasa Perangkat Lunak | Politeknik Negeri Indramayu', 'color: #888; font-size: 12px;');
