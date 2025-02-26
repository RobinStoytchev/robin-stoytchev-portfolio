document.addEventListener('DOMContentLoaded', () => {
    // Language translation logic
    const languageSelect = document.getElementById('languageSelect');
    
    // Function to get all translatable elements and placeholders on the current page
    function getTranslatableElements() {
        const translatableElements = {
            text: document.querySelectorAll('[data-translate]'), // For text content
            placeholders: document.querySelectorAll('[data-placeholder-translate]') // For placeholders
        };
        console.log('Translatable elements found:', {
            textCount: translatableElements.text.length,
            placeholderCount: translatableElements.placeholders.length
        });
        return translatableElements;
    }

    // Store original English text and placeholders
    const translatableElements = getTranslatableElements();
    const originalText = {};
    const originalPlaceholders = {};

    // Store original text for translatable elements
    translatableElements.text.forEach((element, index) => {
        originalText[index] = element.textContent.trim();
        console.log(`Original text for index ${index}:`, originalText[index]);
    });

    // Store original placeholders for translatable placeholders
    translatableElements.placeholders.forEach((element, index) => {
        originalPlaceholders[index] = element.getAttribute('placeholder') || '';
        console.log(`Original placeholder for index ${index}:`, originalPlaceholders[index]);
    });

    // Load persisted language from localStorage or default to 'en'
    let currentLang = localStorage.getItem('selectedLanguage') || 'en';
    console.log('Loaded persisted language:', currentLang);

    // Set initial language in the select element
    if (languageSelect) {
        languageSelect.value = currentLang;
        console.log('Initial language set in select:', currentLang);
    }

    // Load cached translations or translate on page load with persisted language
    if (currentLang !== 'en') {
        console.log('Translating content on page load with language:', currentLang);
        translateAll(currentLang);
    }

    // Handle language change
    if (languageSelect) {
        console.log('Language select element found, adding change listener');
        languageSelect.addEventListener('change', async (event) => {
            console.log('Language changed to:', event.target.value);

            const targetLang = event.target.value;

            // Save the selected language to localStorage
            localStorage.setItem('selectedLanguage', targetLang);
            console.log('Saved language to localStorage:', targetLang);

            if (targetLang === 'en') {
                // Reset to original English
                console.log('Resetting to English');
                translatableElements.text.forEach((element, index) => {
                    if (element) {
                        element.textContent = originalText[index] || '';
                        console.log(`Reset text for index ${index} to:`, originalText[index] || '');
                    }
                });
                translatableElements.placeholders.forEach((element, index) => {
                    if (element) {
                        element.setAttribute('placeholder', originalPlaceholders[index] || '');
                        console.log(`Reset placeholder for index ${index} to:`, originalPlaceholders[index] || '');
                    }
                });
                return;
            }

            // Translate all elements
            translateAll(targetLang);
        });
    } else {
        console.log('Language select element not found');
    }

    // Function to translate all elements (text and placeholders) with caching and throttling
    async function translateAll(targetLang) {
        console.log('Starting translation of all elements with language:', targetLang);

        // Function to delay requests to respect DeepL's 5 requests/second limit
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // Translate text content with throttling (200ms delay per request, ~5 requests/second)
        console.log('Starting translation of text content');
        for (const element of translatableElements.text) {
            const index = Array.from(translatableElements.text).indexOf(element);
            const text = originalText[index] || '';
            console.log(`Translating text at index ${index}:`, text);
            const translatedText = await translateText(text, targetLang);
            if (translatedText) {
                element.textContent = translatedText;
                console.log(`Translated text for index ${index} to:`, translatedText);
            } else {
                console.log(`Failed to translate text at index ${index}, keeping original:`, text);
            }
            await delay(200); // Delay 200ms between requests (approx. 5 requests/second)
        }

        // Translate placeholders with throttling (200ms delay per request)
        console.log('Starting translation of placeholders');
        for (const element of translatableElements.placeholders) {
            const index = Array.from(translatableElements.placeholders).indexOf(element);
            const placeholder = originalPlaceholders[index] || '';
            console.log(`Translating placeholder at index ${index}:`, placeholder);
            const translatedPlaceholder = await translateText(placeholder, targetLang);
            if (translatedPlaceholder) {
                element.setAttribute('placeholder', translatedPlaceholder);
                console.log(`Translated placeholder for index ${index} to:`, translatedPlaceholder);
            } else {
                console.log(`Failed to translate placeholder at index ${index}, keeping original:`, placeholder);
            }
            await delay(200); // Delay 200ms between requests
        }
    }

    // Function to call the Netlify Function with caching
    async function translateText(text, targetLang) {
        console.log(`Calling translateText with raw text: "${text}" and targetLang: ${targetLang}`);
        if (!text || text.trim() === '') {
            console.log('Empty or whitespace-only text, returning null');
            return null;
        }

        const cacheKey = `${text.trim()}-${targetLang}`;
        const cachedTranslation = localStorage.getItem(cacheKey);
        if (cachedTranslation) {
            console.log('Returning cached translation:', cachedTranslation);
            return cachedTranslation;
        }

        try {
            console.log('Sending request to DeepL via Netlify function');
            const response = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text.trim(), targetLang }),
            });

            console.log('Fetch response status:', response.status);
            console.log('Fetch response headers:', response.headers);
            const data = await response.json();
            console.log('Raw API response:', data);
            if (response.ok) {
                const translatedText = data.translatedText;
                localStorage.setItem(cacheKey, translatedText); // Cache the translation
                console.log('Translation successful, result:', translatedText);
                return translatedText;
            } else {
                console.error('Translation error response:', data.error);
                console.warn(`Failed to translate "${text}" to ${targetLang}, falling back to original text`);
                return text; // Fallback to original text if translation fails
            }
        } catch (error) {
            console.error('Fetch error details:', error);
            console.warn(`Failed to translate "${text}" to ${targetLang}, falling back to original text`);
            return text; // Fallback to original text if fetch fails
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