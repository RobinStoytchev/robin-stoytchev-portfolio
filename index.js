document.addEventListener('DOMContentLoaded', () => {
    // Language translation logic
    const languageSelect = document.getElementById('languageSelect');
    
    // Original text elements to translate (add more as needed)
    const translatableElements = {
        introH2: document.querySelector('#intro h2'),
        introP: document.querySelector('#intro p'),
        introButton: document.querySelector('#intro .cta-button span'),
        featuredH2: document.querySelector('#featured h2'),
        featuredP: document.querySelector('#featured p'),
        project1H3: document.querySelector('.project-teaser:nth-child(1) h3'),
        project1P: document.querySelector('.project-teaser:nth-child(1) p'),
        project2H3: document.querySelector('.project-teaser:nth-child(2) h3'),
        project2P: document.querySelector('.project-teaser:nth-child(2) p'),
        footerP: document.querySelector('footer p'),
    };

    // Store original English text
    const originalText = {};
    Object.keys(translatableElements).forEach((key) => {
        originalText[key] = translatableElements[key].textContent.trim();
    });

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', async (event) => {
            const targetLang = event.target.value;

            if (targetLang === 'en') {
                // Reset to original English
                Object.keys(translatableElements).forEach((key) => {
                    translatableElements[key].textContent = originalText[key];
                });
                return;
            }

            // Translate all elements
            for (const [key, element] of Object.entries(translatableElements)) {
                const text = originalText[key];
                const translatedText = await translateText(text, targetLang);
                if (translatedText) {
                    element.textContent = translatedText;
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