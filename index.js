// Dark mode toggle logic (run immediately)
const toggle = document.getElementById('theme-switch');
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';

// Apply saved theme and toggle state immediately
html.setAttribute('data-theme', savedTheme);
if (toggle) {
    toggle.checked = savedTheme === 'dark';
}

// Listen for toggle changes
if (toggle) {
    toggle.addEventListener('change', () => {
        const newTheme = toggle.checked ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Language toggle logic (run immediately)
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLanguage = e.target.value;
            console.log('Language changed to:', targetLanguage); // Debug: Log the selected language

            const elements = document.querySelectorAll('p, h1, h2, h3, a'); // Elements to translate
            console.log('Elements to translate:', elements.length); // Debug: Log number of elements

            for (const element of elements) {
                const text = element.textContent.trim();
                if (text) {
                    console.log('Translating text:', text); // Debug: Log the text being translated
                    try {
                        const response = await fetch('/.netlify/functions/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: text,
                                target_lang: targetLanguage.toUpperCase(),
                                source_lang: 'EN' // Assuming English as the source language
                            })
                        });
                        console.log('Netlify function response status:', response.status); // Debug: Log response status

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();
                        console.log('Netlify function response data:', data); // Debug: Log full response

                        if (data.translations && data.translations.length > 0) {
                            element.textContent = data.translations[0].text;
                            console.log('Translated text:', data.translations[0].text); // Debug: Log translated text
                        } else {
                            console.warn('No translations found in response:', data);
                        }
                    } catch (error) {
                        console.error('Translation error:', error);
                        alert('Translation failed. Please check your setup or try again later.'); // User-friendly error
                    }
                }
            }
        });
    } else {
        console.error('Language select element not found in DOM'); // Debug: Check if the select exists
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