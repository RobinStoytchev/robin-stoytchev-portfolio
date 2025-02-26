// Language toggle logic (run immediately)
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    // Reset and store original English text and attributes on each page load for consistency
    function resetOriginalEnglishData() {
        const originalEnglishData = new Map();
        document.querySelectorAll('p, h1, h2, h3, a, label, input, textarea, button, span').forEach(element => {
            const data = {};
            const text = element.textContent.trim();
            if (text && !['INPUT', 'TEXTAREA'].includes(element.tagName)) { // Only store text for non-input elements
                data.text = text; // Store text content for p, h2, label, button, span
                element.dataset.originalText = text; // Add data attribute for text content
            }
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                const placeholder = element.getAttribute('placeholder');
                if (placeholder) {
                    data.placeholder = placeholder; // Store placeholder for input/textarea
                    element.dataset.originalPlaceholder = placeholder; // Add data attribute for placeholder
                }
            }
            if (Object.keys(data).length > 0) {
                originalEnglishData.set(element, data); // Store all data for the element
            }
        });
        return originalEnglishData;
    }

    const originalEnglishData = resetOriginalEnglishData(); // Initialize on page load

    // Function to apply translations based on stored language
    async function applyTranslations(targetLanguage) {
        console.log('=== APPLY TRANSLATIONS STARTED ===');
        console.log('Applying translations for language:', targetLanguage);

        // Check if translations are cached for this specific language
        const cachedTranslations = localStorage.getItem(`translations_${targetLanguage}`);
        console.log('Cached translations for language:', cachedTranslations ? 'Found' : 'Not found');
        if (cachedTranslations) {
            const translations = JSON.parse(cachedTranslations);
            console.log('Parsed cached translations:', JSON.stringify(translations, null, 2)); // Debug: Log full cached data
            const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, a, label, input, textarea, button, span'))
                .filter(element => {
                    const data = originalEnglishData.get(element) || {};
                    return data.text || data.placeholder; // Filter out non-translatable elements (e.g., empty inputs, navigation duplicates)
                }); // Convert to array for order, filter translatable elements
            console.log('Total translatable elements found:', elements.length); // Debug: Log number of translatable elements
            let index = 0;
            let mismatches = 0;
            elements.forEach((element, i) => {
                const originalData = originalEnglishData.get(element) || {};
                const currentText = element.textContent.trim();
                const currentPlaceholder = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.getAttribute('placeholder') : null;
                console.log(`Element at index ${i} - Original Text: "${originalData.text || 'none'}", Original Placeholder: "${originalData.placeholder || 'none'}", Current Text: "${currentText}", Current Placeholder: "${currentPlaceholder}", Tag: ${element.tagName}, ID: ${element.id || 'none'}`); // Debug: Log element details
                if (Object.keys(originalData).length > 0 && index < translations.length) {
                    const elementId = element.id || `${element.tagName.toLowerCase()}_${i}`; // Use tag and index for unique ID
                    const cachedTranslation = translations.find(t => t.id === elementId && (t.originalText === originalData.text || t.originalPlaceholder === originalData.placeholder));
                    if (cachedTranslation) {
                        if (cachedTranslation.text && originalData.text === element.dataset.originalText) {
                            element.textContent = cachedTranslation.text; // Update text content
                            console.log(`Applied cached translated text at index ${i} (ID: ${elementId}, Original: ${originalData.text}, Current: ${currentText}) ->`, cachedTranslation.text); // Debug: Log cached text with index, ID, original, and current
                        }
                        if (cachedTranslation.placeholder && originalData.placeholder === element.dataset.originalPlaceholder) {
                            element.setAttribute('placeholder', cachedTranslation.placeholder); // Update placeholder
                            console.log(`Applied cached translated placeholder at index ${i} (ID: ${elementId}, Original: ${originalData.placeholder}) ->`, cachedTranslation.placeholder); // Debug: Log cached placeholder with index and ID
                        }
                        index++;
                    } else {
                        console.warn(`No matching cached translation for index ${i} (ID: ${elementId}, Original Text: ${originalData.text || 'none'}, Original Placeholder: ${originalData.placeholder || 'none'}, Current Text: ${currentText}, Current Placeholder: ${currentPlaceholder}), marking for retranslation...`);
                        mismatches++;
                    }
                }
            });
            console.log('Cached translations applied, index used:', index, 'Mismatches found:', mismatches);
            if (mismatches > 0) {
                console.log('Falling back to fresh translation due to mismatches...');
                await fetchAndApplyTranslations(targetLanguage, elements, originalEnglishData);
            } else {
                console.log('=== APPLY TRANSLATIONS COMPLETED (Cached) ===');
            }
            return;
        }

        // Fetch and apply fresh translations if no cache or mismatches
        await fetchAndApplyTranslations(targetLanguage, Array.from(document.querySelectorAll('p, h1, h2, h3, a, label, input, textarea, button, span'))
            .filter(element => {
                const data = originalEnglishData.get(element) || {};
                return data.text || data.placeholder; // Filter out non-translatable elements
            }), originalEnglishData);
    }

    // Function to fetch and apply fresh translations
    async function fetchAndApplyTranslations(targetLanguage, elements, originalEnglishData) {
        const texts = [];
        const placeholders = [];
        const elementsMap = new Map(); // Map to store element-index-ID-tag-data pairs for accurate matching
        elements.forEach((element, i) => {
            const data = originalEnglishData.get(element) || {};
            const originalText = data.text;
            const originalPlaceholder = data.placeholder;
            if (originalText || originalPlaceholder) {
                const elementId = element.id || `${element.tagName.toLowerCase()}_${i}`; // Use tag and index for unique ID
                if (originalText) texts.push(originalText);
                if (originalPlaceholder) placeholders.push(originalPlaceholder);
                elementsMap.set(i, { element, id: elementId, tag: element.tagName, text: originalText, placeholder: originalPlaceholder }); // Store element, index, ID, tag, and data
                console.log(`Collected original data at index ${i} (ID: ${elementId}, Tag: ${element.tagName}, Original Text: ${originalText || 'none'}, Original Placeholder: ${originalPlaceholder || 'none'}):`, { text: originalText, placeholder: originalPlaceholder }); // Debug: Log original data with index, ID, tag, and data
            }
        });

        if (texts.length === 0 && placeholders.length === 0) {
            console.warn('No text or placeholders to translate');
            console.log('=== APPLY TRANSLATIONS COMPLETED (No Text/Placeholders) ===');
            return;
        }

        const translationData = {};
        if (texts.length > 0) {
            console.log('Original texts to translate:', JSON.stringify(texts, null, 2)); // Debug: Log all original texts
            const textResponse = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: texts, // Send original English text for batch translation
                    target_lang: targetLanguage.toUpperCase(),
                    source_lang: 'EN' // Explicitly set source language to English
                })
            });
            console.log('Netlify function response status for texts:', textResponse.status); // Debug: Log response status
            if (!textResponse.ok) {
                const errorText = await textResponse.text();
                throw new Error(`HTTP error for texts! status: ${textResponse.status} - ${errorText}`);
            }
            const textData = await textResponse.json();
            console.log('Netlify function response data for texts:', JSON.stringify(textData, null, 2)); // Debug: Log full response with formatting
            translationData.texts = textData.translations || [];
        }

        if (placeholders.length > 0) {
            console.log('Original placeholders to translate:', JSON.stringify(placeholders, null, 2)); // Debug: Log all original placeholders
            const placeholderResponse = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: placeholders, // Send original English placeholders for batch translation
                    target_lang: targetLanguage.toUpperCase(),
                    source_lang: 'EN' // Explicitly set source language to English
                })
            });
            console.log('Netlify function response status for placeholders:', placeholderResponse.status); // Debug: Log response status
            if (!placeholderResponse.ok) {
                const errorText = await placeholderResponse.text();
                throw new Error(`HTTP error for placeholders! status: ${placeholderResponse.status} - ${errorText}`);
            }
            const placeholderData = await placeholderResponse.json();
            console.log('Netlify function response data for placeholders:', JSON.stringify(placeholderData, null, 2)); // Debug: Log full response with formatting
            translationData.placeholders = placeholderData.translations || [];
        }

        if (!translationData.texts.length && !translationData.placeholders.length) {
            console.warn('No translations found in response for texts or placeholders:', { texts: translationData.texts, placeholders: translationData.placeholders });
            console.log('=== APPLY TRANSLATIONS COMPLETED (No Translations) ===');
            return;
        }

        // Augment translations with IDs, tags, and original data for matching
        const translationsWithIds = [];
        let textIndex = 0, placeholderIndex = 0;
        elements.forEach((_, i) => {
            const { element, id, tag, text, placeholder } = elementsMap.get(i) || {};
            if (text || placeholder) {
                const translation = {};
                if (text && textIndex < translationData.texts.length) {
                    translation.text = translationData.texts[textIndex].text;
                    textIndex++;
                }
                if (placeholder && placeholderIndex < translationData.placeholders.length) {
                    translation.placeholder = translationData.placeholders[placeholderIndex].text;
                    placeholderIndex++;
                }
                if (Object.keys(translation).length > 0) {
                    translationsWithIds.push({
                        ...translation,
                        id,
                        tag,
                        originalText: text,
                        originalPlaceholder: placeholder
                    });
                }
            }
        });

        console.log('Translations with IDs, Tags, and Original Data:', JSON.stringify(translationsWithIds, null, 2)); // Debug: Log translations with IDs, tags, and original data

        // Apply translations back to elements using the map by index, ID, and tag, ensuring order matches
        let appliedCount = 0;
        texts.forEach((originalText, i) => {
            if (elementsMap.has(i)) {
                const { element, id, tag, text } = elementsMap.get(i);
                const currentText = element.textContent.trim();
                const translation = translationsWithIds.find(t => t.id === id && t.tag === tag && t.originalText === originalText);
                if (translation && translation.text) {
                    element.textContent = translation.text; // Update text content
                    console.log(`Translated text for index ${i} (ID: ${id}, Tag: ${tag}, Original: ${originalText}, Current: ${currentText}) ->`, translation.text); // Debug: Log translated text with index, ID, tag, original, and current
                    appliedCount++;
                } else {
                    console.warn(`No text translation found for index ${i} (ID: ${id}, Tag: ${tag}, Original: ${originalText}, Current: ${currentText})`);
                }
            }
        });
        placeholders.forEach((originalPlaceholder, i) => {
            const offset = texts.length + i;
            if (elementsMap.has(offset)) {
                const { element, id, tag, placeholder } = elementsMap.get(offset);
                const currentPlaceholder = element.getAttribute('placeholder');
                const translation = translationsWithIds.find(t => t.id === id && t.tag === tag && t.originalPlaceholder === originalPlaceholder);
                if (translation && translation.placeholder) {
                    element.setAttribute('placeholder', translation.placeholder); // Update placeholder
                    console.log(`Translated placeholder for index ${offset} (ID: ${id}, Tag: ${tag}, Original: ${originalPlaceholder}, Current: ${currentPlaceholder}) ->`, translation.placeholder); // Debug: Log translated placeholder with index, ID, tag, original, and current
                    appliedCount++;
                } else {
                    console.warn(`No placeholder translation found for index ${offset} (ID: ${id}, Tag: ${tag}, Original: ${originalPlaceholder}, Current: ${currentPlaceholder})`);
                }
            }
        });
        console.log('Translations applied, count:', appliedCount);
        // Cache the translations with IDs, tags, and original data for this language only
        localStorage.setItem(`translations_${targetLanguage}`, JSON.stringify(translationsWithIds));
        console.log('Cached translations for language:', `translations_${targetLanguage}`, JSON.stringify(translationsWithIds, null, 2));
        console.log('=== APPLY TRANSLATIONS COMPLETED (New Translation) ===');
    }

    // Apply stored language on page load
    const storedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Default to English
    console.log('Applying stored language on load:', storedLanguage);
    if (languageSelect) {
        languageSelect.value = storedLanguage; // Set dropdown to stored language
    }
    applyTranslations(storedLanguage);

    // Language toggle logic (run on change)
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLanguage = e.target.value;
            console.log('=== LANGUAGE TOGGLE STARTED (User Change) ===');
            console.log('Language changed to (user selection):', targetLanguage); // Debug: Log the selected language

            // Store the selected language in localStorage
            localStorage.setItem('selectedLanguage', targetLanguage);

            await applyTranslations(targetLanguage);
            console.log('=== LANGUAGE TOGGLE COMPLETED (User Change) ===');
        });
    } else {
        console.error('Language select element not found in DOM on load'); // Debug: Check if the select exists on load
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