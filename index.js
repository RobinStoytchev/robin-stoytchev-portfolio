// Language toggle logic (run immediately)
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const targetLanguage = e.target.value;
            console.log('Language changed to:', targetLanguage); // Debug: Log the selected language

            // Clear cache only for the current language to prevent mixing, but keep others
            localStorage.removeItem(`translations_${targetLanguage}`);

            // Check if translations are cached for this specific language
            const cachedTranslations = localStorage.getItem(`translations_${targetLanguage}`);
            if (cachedTranslations) {
                const translations = JSON.parse(cachedTranslations);
                const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, a')); // Convert to array for order
                console.log('Cached translations found:', translations); // Debug: Log cached data
                let index = 0;
                elements.forEach((element, i) => {
                    const text = element.textContent.trim();
                    if (text && index < translations.length) {
                        // Use a unique identifier or index to match elements
                        const elementId = element.id || `element_${i}`; // Fallback to index if no ID
                        if (translations[index].id === elementId) { // Match by ID or index
                            element.textContent = translations[index].text; // Extract the 'text' property
                            console.log(`Applied cached translated text at index ${i} (ID: ${elementId}):`, translations[index].text); // Debug: Log cached text with index and ID
                            index++;
                        }
                    }
                });
                return;
            }

            // Collect all text to translate with element references, indices, and unique IDs
            const texts = [];
            const elementsMap = new Map(); // Map to store element-index-ID pairs for accurate matching
            Array.from(document.querySelectorAll('p, h1, h2, h3, a')).forEach((element, i) => {
                const text = element.textContent.trim();
                if (text) {
                    const elementId = element.id || `element_${i}`; // Use element ID or generate one
                    texts.push(text);
                    elementsMap.set(i, { element, id: elementId }); // Store element, index, and ID
                    console.log(`Collected text at index ${i} (ID: ${elementId}):`, text); // Debug: Log collected text with index and ID
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
                    // Augment translations with IDs for matching
                    const translationsWithIds = data.translations.map((trans, i) => ({
                        ...trans,
                        id: i < texts.length ? `element_${i}` : `element_${i}` // Match by index-based ID
                    }));

                    // Apply translations back to elements using the map by index and ID, ensuring order matches
                    let index = 0;
                    texts.forEach((_, i) => {
                        if (index < translationsWithIds.length && elementsMap.has(i)) {
                            const { element, id } = elementsMap.get(i);
                            const text = element.textContent.trim();
                            if (text) {
                                const translation = translationsWithIds.find(t => t.id === id);
                                if (translation) {
                                    element.textContent = translation.text; // Extract the 'text' property
                                    console.log(`Translated text for index ${i} (ID: ${id}, original: ${text}) ->`, translation.text); // Debug: Log translation with index and ID
                                    index++;
                                }
                            }
                        }
                    });
                    // Cache the translations with IDs for this language only
                    localStorage.setItem(`translations_${targetLanguage}`, JSON.stringify(translationsWithIds));
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