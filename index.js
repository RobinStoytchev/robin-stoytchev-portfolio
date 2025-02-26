// Language toggle logic (run immediately)
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    // Store original English text in a data attribute or object for consistency
    const originalEnglishTexts = new Map();
    document.querySelectorAll('p, h1, h2, h3, a').forEach(element => {
        const text = element.textContent.trim();
        if (text) {
            originalEnglishTexts.set(element, text); // Store original English text
        }
    });

    // Function to apply translations based on stored language
    async function applyTranslations(targetLanguage) {
        console.log('=== APPLY TRANSLATIONS STARTED ===');
        console.log('Applying translations for language:', targetLanguage);

        // Check if translations are cached for this language
        const cachedTranslations = localStorage.getItem(`translations_${targetLanguage}`);
        console.log('Cached translations for language:', cachedTranslations ? 'Found' : 'Not found');
        if (cachedTranslations) {
            const translations = JSON.parse(cachedTranslations);
            console.log('Parsed cached translations:', JSON.stringify(translations, null, 2)); // Debug: Log full cached data
            const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, a')); // Convert to array for order
            console.log('Total elements found:', elements.length); // Debug: Log number of elements
            let index = 0;
            elements.forEach((element, i) => {
                const text = element.textContent.trim();
                console.log(`Element at index ${i} - Text: "${text}", Tag: ${element.tagName}, ID: ${element.id || 'none'}`); // Debug: Log element details
                if (text && index < translations.length) {
                    const elementId = element.id || `${element.tagName.toLowerCase()}_${i}`; // Use tag and index for unique ID
                    const cachedTranslation = translations.find(t => t.id === elementId && t.text === text);
                    if (cachedTranslation) {
                        element.textContent = cachedTranslation.text; // Extract the 'text' property
                        console.log(`Applied cached translated text at index ${i} (ID: ${elementId}, Original: ${text}) ->`, cachedTranslation.text); // Debug: Log cached text with index, ID, and original
                        index++;
                    } else {
                        console.warn(`No matching cached translation for index ${i} (ID: ${elementId}, Text: ${text}), skipping...`);
                    }
                }
            });
            console.log('Cached translations applied, index used:', index);
            console.log('=== APPLY TRANSLATIONS COMPLETED (Cached) ===');
            return;
        }

        // Collect original English text for translation
        const texts = [];
        const elementsMap = new Map(); // Map to store element-index-ID-tag pairs for accurate matching
        const elementsArray = Array.from(document.querySelectorAll('p, h1, h2, h3, a')); // Convert to array for order
        console.log('Total elements collected for translation:', elementsArray.length); // Debug: Log number of elements
        elementsArray.forEach((element, i) => {
            const originalText = originalEnglishTexts.get(element) || element.textContent.trim();
            if (originalText) {
                const elementId = element.id || `${element.tagName.toLowerCase()}_${i}`; // Use tag and index for unique ID
                texts.push(originalText);
                elementsMap.set(i, { element, id: elementId, tag: element.tagName }); // Store element, index, ID, and tag
                console.log(`Collected original text at index ${i} (ID: ${elementId}, Tag: ${element.tagName}):`, originalText); // Debug: Log original text with index, ID, and tag
            }
        });

        if (texts.length === 0) {
            console.warn('No text to translate');
            console.log('=== APPLY TRANSLATIONS COMPLETED (No Text) ===');
            return;
        }

        console.log('Original texts to translate:', JSON.stringify(texts, null, 2)); // Debug: Log all original texts
        try {
            const response = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: texts, // Send original English text for batch translation
                    target_lang: targetLanguage.toUpperCase(),
                    source_lang: 'EN' // Explicitly set source language to English
                })
            });
            console.log('Netlify function response status:', response.status); // Debug: Log response status

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Netlify function response data:', JSON.stringify(data, null, 2)); // Debug: Log full response with formatting

            if (data.translations && data.translations.length > 0) {
                // Augment translations with IDs and tags for matching
                const translationsWithIds = data.translations.map((trans, i) => ({
                    ...trans,
                    id: i < texts.length ? `${elementsMap.get(i).tag.toLowerCase()}_${i}` : `element_${i}`, // Match by tag and index-based ID
                    tag: elementsMap.get(i)?.tag || 'UNKNOWN' // Store tag for verification
                }));
                console.log('Translations with IDs and Tags:', JSON.stringify(translationsWithIds, null, 2)); // Debug: Log translations with IDs and tags

                // Apply translations back to elements using the map by index, ID, and tag, ensuring order matches
                let index = 0;
                texts.forEach((originalText, i) => {
                    if (index < translationsWithIds.length && elementsMap.has(i)) {
                        const { element, id, tag } = elementsMap.get(i);
                        const text = element.textContent.trim();
                        if (text) {
                            const translation = translationsWithIds.find(t => t.id === id && t.tag === tag);
                            if (translation) {
                                element.textContent = translation.text; // Extract the 'text' property
                                console.log(`Translated text for index ${i} (ID: ${id}, Tag: ${tag}, Original: ${originalText}) ->`, translation.text); // Debug: Log translation with index, ID, tag, and original
                                index++;
                            } else {
                                console.warn(`No translation found for index ${i} (ID: ${id}, Tag: ${tag}, Original: ${originalText})`);
                            }
                        }
                    }
                });
                console.log('Translations applied, index used:', index);
                // Cache the translations with IDs and tags for this language only
                localStorage.setItem(`translations_${targetLanguage}`, JSON.stringify(translationsWithIds));
                console.log('Cached translations for language:', `translations_${targetLanguage}`, JSON.stringify(translationsWithIds, null, 2));
            } else {
                console.warn('No translations found in response:', data);
            }
            console.log('=== APPLY TRANSLATIONS COMPLETED (New Translation) ===');
        } catch (error) {
            console.error('Translation error:', error);
            alert('Translation failed. Please check your setup or try again later.'); // User-friendly error
            console.log('=== APPLY TRANSLATIONS FAILED ===');
        }
    }

    // Apply stored language on page load
    const storedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Default to English
    console.log('Applying stored language on load:', storedLanguage);
    languageSelect.value = storedLanguage; // Set dropdown to stored language
    applyTranslations(storedLanguage);

    // Language toggle logic (run on change)
    languageSelect.addEventListener('change', async (e) => {
        const targetLanguage = e.target.value;
        console.log('=== LANGUAGE TOGGLE STARTED (User Change) ===');
        console.log('Language changed to (user selection):', targetLanguage); // Debug: Log the selected language

        // Store the selected language in localStorage
        localStorage.setItem('selectedLanguage', targetLanguage);

        await applyTranslations(targetLanguage);
        console.log('=== LANGUAGE TOGGLE COMPLETED (User Change) ===');
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