document.addEventListener('DOMContentLoaded', () => {
    // Language translation logic
    const languageSelect = document.getElementById('languageSelect');
    
    // Function to determine the current page and return translatable elements
    function getTranslatableElements() {
        const path = window.location.pathname.toLowerCase();
        const translatableElements = {};

        if (path.includes('index.html') || path === '/' || path === '') {
            // Home page (index.html)
            translatableElements.introH2 = document.querySelector('#intro h2');
            translatableElements.introP = document.querySelector('#intro p');
            translatableElements.introButton = document.querySelector('#intro .cta-button span');
            translatableElements.featuredH2 = document.querySelector('#featured h2');
            translatableElements.featuredP = document.querySelector('#featured p');
            translatableElements.project1H3 = document.querySelector('.project-teaser:nth-child(1) h3');
            translatableElements.project1P = document.querySelector('.project-teaser:nth-child(1) p');
            translatableElements.project2H3 = document.querySelector('.project-teaser:nth-child(2) h3');
            translatableElements.project2P = document.querySelector('.project-teaser:nth-child(2) p');
            translatableElements.footerP = document.querySelector('footer p');
        } else if (path.includes('about.html')) {
            // About page
            translatableElements.cvSection = document.querySelector('.cv-section p');
            translatableElements.footerP = document.querySelector('footer p');
            // Add more specific elements for about.html as needed
        } else if (path.includes('contact.html')) {
            // Contact page
            translatableElements.contactH2 = document.querySelector('#contact h2');
            translatableElements.contactP = document.querySelector('#contact p');
            translatableElements.footerP = document.querySelector('footer p');
            // Add more specific elements for contact.html as needed
        } else if (path.includes('projects.html')) {
            // Projects page
            translatableElements.projectsH2 = document.querySelector('#projects h2');
            translatableElements.projectsP = document.querySelector('#projects p');
            translatableElements.footerP = document.querySelector('footer p');
            // Add more specific elements for projects.html as needed
        } else if (path.includes('project')) {
            // Individual project pages (e.g., project1.html, project2.html)
            translatableElements.projectH2 = document.querySelector('h2');
            translatableElements.projectP = document.querySelector('.project-content p');
            translatableElements.footerP = document.querySelector('footer p');
            // Add more specific elements for project pages as needed
        }

        return translatableElements;
    }

    // Get translatable elements for the current page
    const translatableElements = getTranslatableElements();

    // Store original English text for the current page
    const originalText = {};
    Object.keys(translatableElements).forEach((key) => {
        if (translatableElements[key]) {
            originalText[key] = translatableElements[key].textContent.trim();
        }
    });

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', async (event) => {
            const targetLang = event.target.value;

            if (targetLang === 'en') {
                // Reset to original English
                Object.keys(translatableElements).forEach((key) => {
                    if (translatableElements[key]) {
                        translatableElements[key].textContent = originalText[key] || '';
                    }
                });
                return;
            }

            // Translate all elements on the current page
            for (const [key, element] of Object.entries(translatableElements)) {
                if (element) {
                    const text = originalText[key] || '';
                    const translatedText = await translateText(text, targetLang);
                    if (translatedText) {
                        element.textContent = translatedText;
                    }
                }
            }
        });
    }

    // Function to call the Netlify Function
    async function translateText(text, targetLang) {
        try {
            const response = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, targetLang }),
            });

            const data = await response.json();
            if (response.ok) {
                return data.translatedText;
            } else {
                console.error('Translation error:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    // Dark mode toggle logic
    const toggle = document.getElementById('theme-switch');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';

    // Apply saved theme and toggle state immediately
    html.setAttribute('data-theme', savedTheme);
    if (toggle) {
        toggle.checked = savedTheme === 'dark';

        // Listen for toggle changes
        toggle.addEventListener('change', () => {
            const newTheme = toggle.checked ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Sticky menu logic
    const stickyMenu = document.querySelector('.sticky-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    const stickyNav = document.querySelector('.sticky-nav');

    if (stickyMenu && navOverlay && stickyNav) {
        stickyMenu.addEventListener('click', () => {
            console.log('Sticky menu clicked');
            stickyNav.classList.toggle('active');
            navOverlay.classList.toggle('active');
        });

        // Close menu when clicking outside or on overlay
        navOverlay.addEventListener('click', () => {
            stickyNav.classList.remove('active');
            navOverlay.classList.remove('active');
        });

        // Close menu with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && stickyNav.classList.contains('active')) {
                stickyNav.classList.remove('active');
                navOverlay.classList.remove('active');
            }
        });
    }

    // Smooth scroll for "Back to Top" link in sticky nav
    const backToTop = document.querySelector('.sticky-nav a[href="#top"]');

    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Modern smooth scroll, supported in most browsers
            });
        });
    }
});