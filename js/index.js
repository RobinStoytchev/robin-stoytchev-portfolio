document.addEventListener('DOMContentLoaded', () => {
    // Language translation logic
    const languageSelect = document.getElementById('languageSelect');
    
    // Function to get all translatable elements and placeholders on the current page
    function getTranslatableElements() {
        const translatableElements = {
            text: document.querySelectorAll('[data-translate]'), // For text content
            placeholders: document.querySelectorAll('[data-placeholder-translate]') // For placeholders
        };
        // console.log('Translatable elements found:', { // Reduced logging for brevity
        //     textCount: translatableElements.text.length,
        //     placeholderCount: translatableElements.placeholders.length
        // });
        return translatableElements;
    }

    // Store original English text and placeholders
    const translatableElements = getTranslatableElements();
    const originalText = {};
    const originalPlaceholders = {};

    // Store original text for translatable elements
    translatableElements.text.forEach((element, index) => {
        originalText[index] = element.textContent.trim();
    });

    // Store original placeholders for translatable placeholders
    translatableElements.placeholders.forEach((element, index) => {
        originalPlaceholders[index] = element.getAttribute('placeholder') || '';
    });

    // --- MODIFIED LINE BELOW ---
    // Load persisted language from localStorage or default to 'en-us' (for English American)
    let currentLang = localStorage.getItem('selectedLanguage') || 'en-us'; 
    console.log('Loaded persisted language:', currentLang);

    // Set initial language in the select element
    if (languageSelect) {
        languageSelect.value = currentLang; // This will now correctly select "English (American)" if currentLang is 'en-us'
        console.log('Initial language set in select:', currentLang);
    }

    // --- CONSIDER MODIFYING THIS CONDITION FOR EFFICIENCY (See note below) ---
    // Load cached translations or translate on page load with persisted language
    // If currentLang is 'en-us' or 'en-gb', you might not need to call translateAll
    // if your originalText is already in the desired English variant.
    const englishVariants = ['en-us', 'en-gb']; // Define your English variants
    if (!englishVariants.includes(currentLang)) { // Only translate if not an English variant
        console.log('Translating content on page load with language:', currentLang);
        translateAll(currentLang);
    } else {
        console.log('Initial language is English, no translation needed on load.');
        // Ensure original English text is displayed (it should be by default)
        // This step might be redundant if elements already have correct English.
        translatableElements.text.forEach((element, index) => {
            if (element) element.textContent = originalText[index] || '';
        });
        translatableElements.placeholders.forEach((element, index) => {
            if (element) element.setAttribute('placeholder', originalPlaceholders[index] || '');
        });
    }


    // Handle language change
    if (languageSelect) {
        // console.log('Language select element found, adding change listener');
        languageSelect.addEventListener('change', async (event) => {
            console.log('Language changed to:', event.target.value);

            const targetLang = event.target.value;

            // Save the selected language to localStorage
            localStorage.setItem('selectedLanguage', targetLang);
            console.log('Saved language to localStorage:', targetLang);

            // --- MODIFIED BLOCK FOR HANDLING ENGLISH VARIANTS ---
            if (englishVariants.includes(targetLang)) {
                // Reset to original English if an English variant is selected
                console.log('Resetting to original English for variant:', targetLang);
                translatableElements.text.forEach((element, index) => {
                    if (element) {
                        element.textContent = originalText[index] || '';
                    }
                });
                translatableElements.placeholders.forEach((element, index) => {
                    if (element) {
                        element.setAttribute('placeholder', originalPlaceholders[index] || '');
                    }
                });
                return; // Skip translation call
            }

            // Translate all elements for non-English languages
            translateAll(targetLang);
        });
    } else {
        console.log('Language select element not found');
    }

    // Function to translate all elements (text and placeholders) with caching
    async function translateAll(targetLang) {
        console.log('Starting translation of all elements with language:', targetLang);

        const textPromises = Array.from(translatableElements.text).map(async (element, index) => {
            const text = originalText[index] || '';
            const translatedText = await translateText(text, targetLang);
            if (translatedText && element) {
                element.textContent = translatedText;
            }
        });

        await Promise.all(textPromises);

        const placeholderPromises = Array.from(translatableElements.placeholders).map(async (element, index) => {
            const placeholder = originalPlaceholders[index] || '';
            const translatedPlaceholder = await translateText(placeholder, targetLang);
            if (translatedPlaceholder && element) {
                element.setAttribute('placeholder', translatedPlaceholder);
            }
        });

        await Promise.all(placeholderPromises);
    }

    // Function to call the Netlify Function with caching
    async function translateText(text, targetLang) {
        // console.log(`Calling translateText with raw text: "${text}" and targetLang: ${targetLang}`);
        if (!text || text.trim() === '') {
            return null;
        }

        const cacheKey = `${text.trim()}-${targetLang}`;
        const cachedTranslation = localStorage.getItem(cacheKey);
        if (cachedTranslation) {
            // console.log('Returning cached translation:', cachedTranslation);
            return cachedTranslation;
        }

        try {
            // console.log('Sending request to DeepL via Netlify function');
            const response = await fetch('/.netlify/functions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text.trim(), targetLang }),
            });

            const data = await response.json();
            if (response.ok) {
                const translatedText = data.translatedText;
                localStorage.setItem(cacheKey, translatedText);
                return translatedText;
            } else {
                console.error('Translation error response:', data.error || 'Unknown error');
                return text; // Fallback to original text
            }
        } catch (error) {
            console.error('Fetch error details:', error);
            return text; // Fallback to original text
        }
    }


   // Dark mode toggle logic (unchanged)
    const headerToggle = document.getElementById('theme-switch');
    const stickyToggle = document.getElementById('sticky-theme-switch');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';

    html.setAttribute('data-theme', savedTheme);

    const syncToggles = (theme) => {
        const isDark = theme === 'dark';
        if (headerToggle) headerToggle.checked = isDark;
        if (stickyToggle) stickyToggle.checked = isDark;
    };

    syncToggles(savedTheme);

    const handleThemeChange = (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        syncToggles(newTheme);
    };

    if (headerToggle) headerToggle.addEventListener('change', handleThemeChange);
    if (stickyToggle) stickyToggle.addEventListener('change', handleThemeChange);

    // Sticky menu logic
    const stickyToggleCheckbox = document.querySelector('#sticky-nav-toggle');
    const stickyHamburger = document.querySelector('.sticky-hamburger');
    const navOverlay = document.querySelector('.nav-overlay');
    const stickyNav = document.querySelector('.sticky-nav');
    const stickyThemeContainer = document.querySelector('.sticky-theme-container');

    if (stickyToggleCheckbox && stickyHamburger && navOverlay && stickyNav && stickyThemeContainer) {
        stickyHamburger.addEventListener('click', () => {
            console.log('Sticky hamburger clicked');
            stickyNav.classList.toggle('active');
            navOverlay.classList.toggle('active');
            stickyThemeContainer.classList.toggle('hidden'); // Toggle visibility
        });

        navOverlay.addEventListener('click', () => {
            stickyNav.classList.remove('active');
            navOverlay.classList.remove('active');
            stickyThemeContainer.classList.remove('hidden'); // Show toggle
            stickyToggleCheckbox.checked = false;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && stickyNav.classList.contains('active')) {
                stickyNav.classList.remove('active');
                navOverlay.classList.remove('active');
                stickyThemeContainer.classList.remove('hidden'); // Show toggle
                stickyToggleCheckbox.checked = false;
            }
        });
    }

    // Smooth scroll for "Back to Top" link (unchanged)
    const backToTop = document.querySelector('.sticky-nav a[href="#top"]');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }   
});