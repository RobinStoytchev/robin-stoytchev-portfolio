document.addEventListener('DOMContentLoaded', () => {
    // Language translation logic
    const languageSelect = document.getElementById('languageSelect');
    
    // Function to get all translatable elements on the current page
    function getTranslatableElements() {
        return document.querySelectorAll('[data-translate]');
    }

    // Store original English text for all translatable elements
    const translatableElements = getTranslatableElements();
    const originalText = {};
    
    translatableElements.forEach((element, index) => {
        originalText[index] = element.textContent.trim();
    });

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', async (event) => {
            const targetLang = event.target.value;

            if (targetLang === 'en') {
                // Reset to original English
                translatableElements.forEach((element, index) => {
                    if (element) {
                        element.textContent = originalText[index] || '';
                    }
                });
                return;
            }

            // Translate all elements on the current page
            translatableElements.forEach(async (element, index) => {
                const text = originalText[index] || '';
                const translatedText = await translateText(text, targetLang);
                if (translatedText) {
                    element.textContent = translatedText;
                }
            });
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