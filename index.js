// Language translation and toggle logic
document.addEventListener('DOMContentLoaded', async () => {
    const languageSelect = document.getElementById('languageSelect');
    const TRANSLATABLE_ELEMENTS = ['p', 'h1', 'h2', 'h3', 'a', 'label', 'input', 'textarea', 'button', 'span'];

    // Initialize or retrieve stored language
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';

    // Mutation Observer to handle dynamic DOM changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            applyTranslations(currentLanguage);
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Store original English data globally for consistency
    let originalEnglishData = new Map();

    // Reset and store original English text and attributes
    async function resetOriginalEnglishData() {
        originalEnglishData.clear();
        const elements = document.querySelectorAll(TRANSLATABLE_ELEMENTS.join(','));
        elements.forEach(element => {
            const data = {};
            const text = element.textContent.trim();
            if (text && !['INPUT', 'TEXTAREA'].includes(element.tagName)) {
                const storedOriginal = element.dataset.originalText || text; // Use text directly as fallback
                data.text = storedOriginal;
                element.dataset.originalText = storedOriginal;
                console.log(`Original text for ${element.tagName} (ID: ${element.id || 'none'}):`, storedOriginal);
            }
            if (['INPUT', 'TEXTAREA'].includes(element.tagName)) {
                const placeholder = element.getAttribute('placeholder');
                if (placeholder) {
                    const storedOriginalPlaceholder = element.dataset.originalPlaceholder || placeholder;
                    data.placeholder = storedOriginalPlaceholder;
                    element.dataset.originalPlaceholder = storedOriginalPlaceholder;
                    console.log(`Original placeholder for ${element.tagName} (ID: ${element.id || 'none'}):`, storedOriginalPlaceholder);
                }
            }
            if (Object.keys(data).length > 0) {
                originalEnglishData.set(element, data);
            }
        });
        return originalEnglishData;
    }

    // Fetch translations from Netlify function
    async function fetchTranslations(texts, targetLanguage) {
        try {
            const response = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: texts,
                    target_lang: targetLanguage.toUpperCase(),
                    source_lang: 'EN'
                })
            });
            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status} - ${await response.text()}`);
            }
            const data = await response.json();
            console.log('DeepL API response:', JSON.stringify(data, null, 2));
            return data.translations.map(t => t.text);
        } catch (error) {
            console.error('Translation fetch error:', error);
            return [];
        }
    }
    
    // Apply translations to DOM elements
    async function applyTranslations(targetLanguage) {
        console.log('=== APPLY TRANSLATIONS STARTED ===');
        console.log('Applying translations for language:', targetLanguage);

        // Reset original data if needed (e.g., on navigation)
        await resetOriginalEnglishData();

        // Collect all translatable texts and placeholders
        const texts = [];
        const placeholders = [];
        const elementsMap = new Map();

        document.querySelectorAll(TRANSLATABLE_ELEMENTS.join(',')).forEach((element, index) => {
            const data = originalEnglishData.get(element) || {};
            const elementId = element.id || element.getAttribute('data-translate-id') || `${element.tagName.toLowerCase()}_${index}`;
            if (!element.id && !element.getAttribute('data-translate-id')) {
                element.setAttribute('data-translate-id', elementId); // Ensure unique ID for translation
            }
            if (data.text) texts.push({ text: data.text, element, type: 'text', id: elementId });
            if (data.placeholder) placeholders.push({ placeholder: data.placeholder, element, type: 'placeholder', id: elementId });
            elementsMap.set(elementId, { element, type: data.text ? 'text' : 'placeholder' });
        });

        // Check cache first
        const cacheKey = `translations_${targetLanguage}`;
        const cachedTranslations = localStorage.getItem(cacheKey);
        let translatedTexts = [];
        let translatedPlaceholders = [];

        if (cachedTranslations) {
            const cached = JSON.parse(cachedTranslations);
            translatedTexts = cached.texts || [];
            translatedPlaceholders = cached.placeholders || [];
            console.log('Using cached translations:', cached);
        }

        // If no cache or partial cache, fetch fresh translations
        if (!cachedTranslations || texts.length > translatedTexts.length || placeholders.length > translatedPlaceholders.length) {
            console.log('Fetching fresh translations...');
            if (texts.length > 0) {
                translatedTexts = await fetchTranslations(texts.map(t => t.text), targetLanguage);
            }
            if (placeholders.length > 0) {
                translatedPlaceholders = await fetchTranslations(placeholders.map(p => p.placeholder), targetLanguage);
            }

            // In applyTranslations, before caching
            if (!translatedTexts.length && !translatedPlaceholders.length) {
                console.warn('No valid translations received, skipping cache update');
                return;
            }
            localStorage.setItem(cacheKey, JSON.stringify({
                texts: translatedTexts,
                placeholders: translatedPlaceholders
            }));

            // Cache the new translations
            localStorage.setItem(cacheKey, JSON.stringify({
                texts: translatedTexts,
                placeholders: translatedPlaceholders
            }));
        }

        // Apply translations
        let appliedCount = 0;
        texts.forEach((item, i) => {
            if (i < translatedTexts.length) {
                item.element.textContent = translatedTexts[i];
                console.log(`Translated text for ID ${item.id} (Original: ${item.text}, New: ${translatedTexts[i]})`);
                appliedCount++;
            } else {
                console.warn(`No translation found for text at ID ${item.id}`);
            }
        });

        placeholders.forEach((item, i) => {
            if (i < translatedPlaceholders.length) {
                item.element.setAttribute('placeholder', translatedPlaceholders[i]);
                console.log(`Translated placeholder for ID ${item.id} (Original: ${item.placeholder}, New: ${translatedPlaceholders[i]})`);
                appliedCount++;
            } else {
                console.warn(`No translation found for placeholder at ID ${item.id}`);
            }
        });

        console.log('Translations applied, count:', appliedCount);
        console.log('=== APPLY TRANSLATIONS COMPLETED ===');
        currentLanguage = targetLanguage;
    }

    // Initialize with stored language
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        applyTranslations(currentLanguage);
    }

    // Handle language changes
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLanguage = e.target.value;
            console.log('Language changed to:', targetLanguage);
            localStorage.setItem('selectedLanguage', targetLanguage);
            await applyTranslations(targetLanguage);
        });
    }

    // Handle navigation for SPAs
    window.addEventListener('popstate', async () => {
        console.log('Navigation detected, reapplying translations...');
        await applyTranslations(currentLanguage);
    });

    // Clean up observer on unload
    window.addEventListener('unload', () => {
        observer.disconnect();
    });


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