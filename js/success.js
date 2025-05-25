document.addEventListener('DOMContentLoaded', () => {
    const successContainer = document.getElementById('success-container');
    const relatedProjectsList = document.getElementById('related-projects-list');
    const toggleRelatedViewButton = document.getElementById('toggle-related-view');

    // Elements whose view-transition-name should be cleared after initial reveal.
    // These names correspond to the `view-transition-name` set in your HTML/CSS for initial load.
    const initialRevealElementsWithVTN = [
        // Elements from your problem description
        { selector: '.success-animation-wrapper', expectedVTN: 'status-icon' },
        { selector: '#success-heading', expectedVTN: 'main-title' },
        { selector: '#success-message-text', expectedVTN: 'status-message' }, // Using ID from your HTML
        { selector: 'a.button-primary', expectedVTN: 'cta-button' }, // Main CTA button

        // Potentially other elements from initial reveal if they also misbehave
        { selector: '#related-heading', expectedVTN: 'related-title' },
        { selector: '#toggle-related-view', expectedVTN: 'toggle-related-button' },
        { selector: '#related-projects-list', expectedVTN: 'related-list' }
    ];

    function clearInitialViewTransitionNames() {
        initialRevealElementsWithVTN.forEach(item => {
            const el = document.querySelector(item.selector) || document.getElementById(item.selector.substring(1)); // Handle ID and class selectors
            // Check if element exists and if its current VTN matches the one we want to clear
            if (el && el.style.viewTransitionName === item.expectedVTN) {
                el.style.viewTransitionName = 'none';
            }
        });
    }

    // --- Initial Page Reveal Animation ---
    if (!document.body.dataset.initialRevealDone) {
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                successContainer.classList.add('revealed');
            }).finished.then(() => {
                document.body.dataset.initialRevealDone = 'true';
                clearInitialViewTransitionNames(); // <--- ADD THIS
            });
        } else {
            successContainer.classList.add('revealed');
            document.body.dataset.initialRevealDone = 'true';
            clearInitialViewTransitionNames(); // <--- ADD THIS (for consistency, though no VT effect)
        }
    } else {
        // If already revealed (e.g., from bfcache or subsequent loads without full reload)
        successContainer.classList.add('revealed'); // Ensure it's revealed
        clearInitialViewTransitionNames(); // <--- ADD THIS to handle cases like bfcache
    }

    // --- Related Content Layout Toggle ---
    if (toggleRelatedViewButton && relatedProjectsList) {
        toggleRelatedViewButton.addEventListener('click', () => {
            const isCompact = relatedProjectsList.classList.contains('compact-layout');
            toggleRelatedViewButton.setAttribute('aria-pressed', String(!isCompact));

            const projectImages = relatedProjectsList.querySelectorAll('.related-project-card img');
            
            // Assign VTNs only to images participating in the layout toggle
            projectImages.forEach((img) => {
                const baseName = img.dataset.imageBase ? img.dataset.imageBase.split('/').pop() : (img.dataset.projectId || 'unknown');
                img.style.viewTransitionName = `layout-toggle-img-${baseName.replace(/[^\w-]/g, '')}`; // Ensure valid VTN
            });

            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    relatedProjectsList.classList.toggle('compact-layout');
                }).finished.then(() => {
                    // Clear VTNs from images after toggle animation
                    projectImages.forEach(img => {
                        img.style.viewTransitionName = '';
                    });
                });
            } else {
                relatedProjectsList.classList.toggle('compact-layout');
            }
        });
    }

    // --- Lightbox Functionality ---
    const lightboxElement = document.createElement('div');
    lightboxElement.id = 'lightbox';
    lightboxElement.className = 'lightbox';
    lightboxElement.setAttribute('aria-hidden', 'true');
    lightboxElement.innerHTML = `
        <img src="" alt="" id="lightbox-image" loading="lazy" decoding="async">
        <button class="lightbox__close-button" aria-label="Close lightbox">×</button>
    `;
    document.body.appendChild(lightboxElement);

    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseButton = lightboxElement.querySelector('.lightbox__close-button');
    const projectImageLinks = document.querySelectorAll('.related-project-card');

    let lastOpenedThumbnail = null;
    const DESKTOP_IMAGE_WIDTHS = [800, 1200, 1600, 2400];
    const MOBILE_BREAKPOINT = "(max-width: 767px)";
    const MOBILE_IMAGE_SUFFIX = "_mobile_800w.webp";

    function openLightbox(thumbElement) {
        lastOpenedThumbnail = thumbElement;
        const imageBase = thumbElement.dataset.imageBase;
        const thumbAlt = thumbElement.alt || thumbElement.closest('.related-project-card').querySelector('h3')?.textContent || 'Project Image';

        lightboxImage.srcset = '';
        lightboxImage.sizes = '';
        lightboxImage.src = '';

        lightboxImage.style.viewTransitionName = '';
        thumbElement.style.viewTransitionName = '';

        const isMobile = window.matchMedia(MOBILE_BREAKPOINT).matches;

        if (!imageBase) {
            console.warn("Lightbox: data-image-base attribute missing on thumbnail:", thumbElement);
            lightboxImage.src = thumbElement.src;
            lightboxImage.sizes = '90vw';
        } else {
            if (isMobile) {
                lightboxImage.src = imageBase + MOBILE_IMAGE_SUFFIX;
                lightboxImage.sizes = '90vw';
            } else {
                const desktopSrcset = DESKTOP_IMAGE_WIDTHS
                    .map(w => `${imageBase}_${w}w.webp ${w}w`)
                    .join(', ');
                lightboxImage.srcset = desktopSrcset;
                lightboxImage.sizes = '90vw';
                lightboxImage.src = `${imageBase}_${DESKTOP_IMAGE_WIDTHS[DESKTOP_IMAGE_WIDTHS.length - 1]}w.webp`;
            }
        }
        lightboxImage.alt = `Enlarged view of ${thumbAlt}`;

        if (document.startViewTransition) {
            thumbElement.style.viewTransitionName = 'gallery-image-vt';
            lightboxImage.style.viewTransitionName = 'gallery-image-vt';

            document.startViewTransition(() => {
                lightboxElement.classList.add('open');
                lightboxElement.setAttribute('aria-hidden', 'false');
            }).finished.then(() => {
                thumbElement.style.viewTransitionName = ''; // Clear after transition
                lightboxCloseButton.focus();
            });
        } else {
            lightboxElement.classList.add('open');
            lightboxElement.setAttribute('aria-hidden', 'false');
            lightboxCloseButton.focus();
        }
    }

    function closeLightbox() {
        if (!lastOpenedThumbnail || !lightboxElement.classList.contains('open')) return;

        // Ensure both thumbnail (if still valid) and lightbox image have the VTN for the closing transition
        if (lastOpenedThumbnail) {
            lastOpenedThumbnail.style.viewTransitionName = 'gallery-image-vt';
        }
        lightboxImage.style.viewTransitionName = 'gallery-image-vt';

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                lightboxElement.classList.remove('open');
                lightboxElement.setAttribute('aria-hidden', 'true');
            }).finished.then(() => {
                if (lastOpenedThumbnail) {
                    lastOpenedThumbnail.style.viewTransitionName = ''; // Clear VTN
                    if (document.body.contains(lastOpenedThumbnail) && lastOpenedThumbnail.offsetParent !== null) {
                        lastOpenedThumbnail.focus();
                    }
                }
                lightboxImage.style.viewTransitionName = ''; // Clear VTN
                lightboxImage.src = '';
                lightboxImage.srcset = '';
                lightboxImage.sizes = '';
                lastOpenedThumbnail = null;
            });
        } else {
            lightboxElement.classList.remove('open');
            lightboxElement.setAttribute('aria-hidden', 'true');
            if (lastOpenedThumbnail) {
                lastOpenedThumbnail.style.viewTransitionName = ''; // Clear VTN
                if (document.body.contains(lastOpenedThumbnail) && lastOpenedThumbnail.offsetParent !== null) {
                    lastOpenedThumbnail.focus();
                }
            }
            lightboxImage.style.viewTransitionName = ''; // Clear VTN
            lightboxImage.src = '';
            lightboxImage.srcset = '';
            lightboxImage.sizes = '';
            lastOpenedThumbnail = null;
        }
    }

    projectImageLinks.forEach(link => {
        const img = link.querySelector('img');
        if (img) {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openLightbox(img);
            });
        }
    });

    lightboxCloseButton.addEventListener('click', closeLightbox);
    lightboxElement.addEventListener('click', (event) => {
        if (event.target === lightboxElement) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightboxElement.classList.contains('open')) {
            closeLightbox();
        }
    });
});