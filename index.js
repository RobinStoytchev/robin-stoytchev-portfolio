// Language toggle logic (run immediately)
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLanguage = e.target.value;
            console.log('Language changed to:', targetLanguage); // Debug: Log the selected language

            // Clear cache for all languages to prevent mixed translations
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('translations_')) {
                    localStorage.removeItem(key);
                }
            });

            // Check if translations are cached for this specific language
            const cachedTranslations = localStorage.getItem(`translations_${targetLanguage}`);
            if (cachedTranslations) {
                const translations = JSON.parse(cachedTranslations);
                const elements = document.querySelectorAll('p, h1, h2, h3, a'); // Elements to translate
                console.log('Cached translations found:', translations); // Debug: Log cached data
                let index = 0;
                elements.forEach((element) => {
                    const text = element.textContent.trim();
                    if (text && index < translations.length) {
                        element.textContent = translations[index].text; // Extract the 'text' property
                        console.log('Applied cached translated text:', translations[index].text); // Debug: Log cached text
                        index++;
                    }
                });
                return;
            }

            // Collect all text to translate with element references
            const texts = [];
            const elementsMap = new Map(); // Map to store element-text pairs for accurate matching
            document.querySelectorAll('p, h1, h2, h3, a').forEach((element, i) => {
                const text = element.textContent.trim();
                if (text) {
                    texts.push(text);
                    elementsMap.set(text, element); // Store element by its text for matching
                    console.log(`Collected text ${i}:`, text); // Debug: Log collected text with index
                }
            });

            if (texts.length === 0) {
                console.warn('No text to translate');
                return;
            }

            try {
                const response = await fetch('/.netlify/functions/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: texts, // Send all text as an array for batch translation
                        target_lang: targetLanguage.toUpperCase(),
                        source_lang: 'EN' // Assuming English as the source language
                    })
                });
                console.log('Netlify function response status:', response.status); // Debug: Log response status

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log('Netlify function response data:', data); // Debug: Log full response

                if (data.translations && data.translations.length > 0) {
                    // Apply translations back to elements using the map, ensuring order matches
                    let index = 0;
                    texts.forEach((originalText) => {
                        if (index < data.translations.length && elementsMap.has(originalText)) {
                            const element = elementsMap.get(originalText);
                            element.textContent = data.translations[index].text; // Extract the 'text' property
                            console.log('Translated text for:', originalText, '->', data.translations[index].text); // Debug: Log translation
                            index++;
                        }
                    });
                    // Cache the translations for this language only
                    localStorage.setItem(`translations_${targetLanguage}`, JSON.stringify(data.translations));
                } else {
                    console.warn('No translations found in response:', data);
                }
            } catch (error) {
                console.error('Translation error:', error);
                alert('Translation failed. Please check your setup or try again later.'); // User-friendly error
            }
        });
    } else {
        console.error('Language select element not found in DOM'); // Debug: Check if the select exists
    }

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