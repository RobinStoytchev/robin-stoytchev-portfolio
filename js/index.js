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


    // --- Form Logic ---
    const contactForm = document.querySelector('form[name="contact"]');

    // Proceed only if the contact form exists on the page
    if (contactForm) {
        // Select all input and textarea elements within the form that have the 'required' attribute
        const fieldsToValidate = contactForm.querySelectorAll(
            'input[required], textarea[required]'
        );

        // Loop through each field that needs validation
        fieldsToValidate.forEach(field => {
            // Listen for the 'invalid' event on each field
            // This event fires when a field fails its built-in validation constraints (e.g., on form submission attempt)
            field.addEventListener('invalid', () => {
                // Set aria-invalid to "true" when the field is invalid
                field.setAttribute('aria-invalid', 'true');
            });

            // Listen for the 'input' event on each field
            // This event fires whenever the user types or changes the value in the field
            field.addEventListener('input', () => {
                // Check the field's current validity state using the Constraint Validation API
                if (field.validity.valid) {
                    // If the field is currently valid, set aria-invalid to "false"
                    field.setAttribute('aria-invalid', 'false');
                } else {
                    // If the field is still invalid (or becomes invalid again), set aria-invalid to "true"
                    field.setAttribute('aria-invalid', 'true');
                }
            });
        });
    }

    // --- Theme Toggle Logic ---
    const headerToggleInput = document.getElementById('theme-switch');
    const stickyToggleInput = document.getElementById('sticky-theme-switch');
    const html = document.documentElement;

    // Function to determine initial theme (checks localStorage then system preference)
    function getInitialTheme() {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light'; // Default to light
    }

    const currentTheme = getInitialTheme();
    html.setAttribute('data-theme', currentTheme);

    const syncThemeTogglesAndLabels = (theme) => {
        const isDark = theme === 'dark';
        const newAriaLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';

        if (headerToggleInput) {
            headerToggleInput.checked = isDark;
            headerToggleInput.setAttribute('aria-label', newAriaLabel);
        }
        if (stickyToggleInput) {
            stickyToggleInput.checked = isDark;
            stickyToggleInput.setAttribute('aria-label', newAriaLabel);
        }
    };

    // Set initial state and ARIA labels for theme toggles
    syncThemeTogglesAndLabels(currentTheme);

    const handleThemeInputChange = (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        syncThemeTogglesAndLabels(newTheme); // Updates both toggles and their ARIA labels
    };

    if (headerToggleInput) headerToggleInput.addEventListener('change', handleThemeInputChange);
    if (stickyToggleInput) stickyToggleInput.addEventListener('change', handleThemeInputChange);

    // Optional: Listen for changes in system preference to update theme if no user preference is set
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme) {
        prefersDarkScheme.addEventListener('change', (event) => {
            if (!localStorage.getItem('theme')) { // Only update if user hasn't set a preference
                const systemTheme = event.matches ? 'dark' : 'light';
                html.setAttribute('data-theme', systemTheme);
                syncThemeTogglesAndLabels(systemTheme);
            }
        });
    }

    // --- Sticky Navigation Menu Logic ---
    const stickyNavToggleCheckbox = document.getElementById('sticky-nav-toggle');
    const stickyNavToggleLabel = document.querySelector('label[for="sticky-nav-toggle"]'); // The <label> element
    const navOverlay = document.querySelector('.nav-overlay');
    const stickyNav = document.querySelector('.sticky-nav');
    const stickyThemeContainer = document.querySelector('.sticky-theme-container');

    // Function to set the open/closed state of the sticky navigation
    function setStickyNavOpen(isOpen) {
        if (stickyNavToggleLabel) {
            stickyNavToggleLabel.setAttribute('aria-expanded', isOpen.toString());
            stickyNavToggleLabel.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        }
        if (stickyNav) {
            stickyNav.classList.toggle('active', isOpen);
        }
        if (navOverlay) {
            navOverlay.classList.toggle('active', isOpen);
        }
        if (stickyThemeContainer) {
            // Hide sticky theme toggle when sticky nav is open, show when closed
            stickyThemeContainer.classList.toggle('hidden', isOpen);
        }

        // Ensure the checkbox state is synced if changed programmatically
        if (stickyNavToggleCheckbox && stickyNavToggleCheckbox.checked !== isOpen) {
            stickyNavToggleCheckbox.checked = isOpen;
        }
        // console.log('Sticky nav state set. Is open:', isOpen);
    }


    if (stickyNavToggleCheckbox && stickyNavToggleLabel && navOverlay && stickyNav && stickyThemeContainer) {
        // Initialize sticky nav state (usually closed) based on checkbox's initial state
        setStickyNavOpen(stickyNavToggleCheckbox.checked);

        // Listen for changes on the checkbox (triggered by label click)
        stickyNavToggleCheckbox.addEventListener('change', () => {
            setStickyNavOpen(stickyNavToggleCheckbox.checked);
        });

        navOverlay.addEventListener('click', () => {
            if (stickyNav.classList.contains('active')) { // Only act if menu is open
                setStickyNavOpen(false); // This will also update checkbox.checked
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && stickyNav.classList.contains('active')) {
                setStickyNavOpen(false); // This will also update checkbox.checked
            }
        });
    }

    // --- Smooth scroll for "Back to Top" link (unchanged from your original) ---
    const backToTop = document.querySelector('.sticky-nav a[href="#top"]');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =============== CAROUSEEL ==================
    const carousel = document.querySelector('.image-carousel');
    if (!carousel) return; // Don't run if the carousel isn't on the page

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel-button.next');
    const prevButton = carousel.querySelector('.carousel-button.prev');
    const dotsNav = carousel.querySelector('.carousel-pagination .carousel-dots');

    const slideCount = slides.length;
    let currentIndex = 0;

    // --- Create Pagination Dots ---
    slides.forEach((_, i) => {
        const dotItem = document.createElement('li');
        dotItem.className = 'carousel-dot-item';
        const button = document.createElement('button');
        button.setAttribute('data-slide-to', i);
        button.setAttribute('aria-label', `Go to slide ${i + 1}`);
        if (i === 0) button.classList.add('is-active'); // Set initial active dot
        dotItem.appendChild(button);
        dotsNav.appendChild(dotItem);
    });

    const dots = Array.from(dotsNav.children).map(li => li.firstElementChild);

    // --- Core function to show a slide ---
    const showSlide = (targetIndex, direction) => {
        // Determine direction if not explicitly provided
        direction = direction || (targetIndex > currentIndex ? 'next' : 'prev');
        
        // Use View Transitions API if available
        if (document.startViewTransition) {
            carousel.dataset.transitionDirection = direction;
            document.startViewTransition(() => {
                updateDOM(targetIndex);
            }).finished.then(() => {
                // Clean up the data attribute after the transition is complete
                delete carousel.dataset.transitionDirection;
            });
        } else {
            // Fallback for browsers without View Transitions
            updateDOM(targetIndex);
        }
    };

    // --- Function to update all DOM elements ---
    const updateDOM = (targetIndex) => {
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === targetIndex);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('is-active', index === targetIndex);
        });

        currentIndex = targetIndex;
    };

    // --- Event Listeners for Buttons and Dots ---
    nextButton.addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % slideCount;
        showSlide(newIndex, 'next');
    });

    prevButton.addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + slideCount) % slideCount;
        showSlide(newIndex, 'prev');
    });

    dotsNav.addEventListener('click', e => {
        const dotButton = e.target.closest('button');
        if (!dotButton) return;

        const targetIndex = parseInt(dotButton.dataset.slideTo, 10);
        // Don't do anything if clicking the active dot
        if (targetIndex === currentIndex) return;

        showSlide(targetIndex);
    });

    // --- NEW: Swipe/Drag Handling ---
    let startX = 0;
    let endX = 0;
    let isSwiping = false;
    const swipeThreshold = 50; // Minimum pixels to be considered a swipe

    const handlePointerDown = (e) => {
        // Ignore if it's not a primary button click (e.g., right-click)
        if (e.button !== 0) return;
        
        startX = e.clientX;
        isSwiping = true;
        // Add a class for visual feedback (e.g., changing cursor)
        carousel.classList.add('is-swiping');
        
        // We listen on the window to catch the pointerup even if the cursor leaves the carousel
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
        if (!isSwiping) return;
        endX = e.clientX;
    };

    const handlePointerUp = () => {
        if (!isSwiping) return;

        carousel.classList.remove('is-swiping');
        
        const diffX = startX - endX;

        if (Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                // Swiped left (like pulling the next slide in from the right)
                nextButton.click();
            } else {
                // Swiped right (like pulling the previous slide in from the left)
                prevButton.click();
            }
        }
        
        isSwiping = false;
        // Clean up listeners
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    carousel.addEventListener('pointerdown', handlePointerDown);


    // --- Initialize Carousel ---
    // Ensure the first slide is active on page load without transitions
    updateDOM(0);
});