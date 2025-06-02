// projects.js
document.addEventListener('DOMContentLoaded', () => {
    let lastAction = 'next'; // To determine animation direction

    document.querySelectorAll('.pagination-link, .pagination-button').forEach(element => {
        element.addEventListener('click', e => {
            e.preventDefault();
            
            const currentPageId = document.querySelector('.pagination-link.active')?.getAttribute('data-page');
            let newPageId;

            if (element.classList.contains('pagination-link')) {
                newPageId = element.getAttribute('data-page');
                // Determine direction based on current vs new page index
                const pages = Array.from(document.querySelectorAll('.pagination-link'));
                const currentIndex = pages.findIndex(p => p.getAttribute('data-page') === currentPageId);
                const newIndex = pages.findIndex(p => p.getAttribute('data-page') === newPageId);
                lastAction = newIndex > currentIndex ? 'next' : 'prev';

            } else if (element.classList.contains('pagination-button')) {
                const action = element.getAttribute('data-action');
                if (element.classList.contains('disabled')) return;

                lastAction = action; // 'prev' or 'next'
                const pages = Array.from(document.querySelectorAll('.pagination-link'));
                const currentIndex = pages.findIndex(p => p.getAttribute('data-page') === currentPageId);
                
                if (action === 'prev' && currentIndex > 0) {
                    newPageId = pages[currentIndex - 1].getAttribute('data-page');
                } else if (action === 'next' && currentIndex < pages.length - 1) {
                    newPageId = pages[currentIndex + 1].getAttribute('data-page');
                }
            }

            if (newPageId && newPageId !== currentPageId) {
                showPage(newPageId, lastAction); // Pass the action to showPage
                updatePagination(newPageId);
            }
        });
    });

    function showPage(pageId, direction = 'next') {
        // Fallback for browsers that don't support View Transitions
        if (!document.startViewTransition) {
            console.log("View Transitions not supported, falling back.");
            performPageChange(pageId);
            return;
        }

        // --- View Transition Logic ---
        // Dynamically set animation classes on the document root or body
        // This allows CSS to pick up different animations for old/new
        document.documentElement.dataset.transitionDirection = direction;

        document.startViewTransition(() => {
            // This promise should resolve when the DOM update is complete
            return new Promise(resolve => {
                performPageChange(pageId);
                resolve();
            });
        }).finished.then(() => {
            // Clean up the data attribute after transition
            delete document.documentElement.dataset.transitionDirection;
        });
    }
    
    function performPageChange(pageId) {
        // Hide all project grids
        document.querySelectorAll('.project-grid').forEach(grid => {
            grid.classList.add('hidden');
        });
        // Show the target project grid
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            pageElement.classList.remove('hidden');
        }
        // NO MORE .animate-in or animationend listener needed here!
    }


    function updatePagination(activePageId) {
        const links = document.querySelectorAll('.pagination-link');
        if (links.length) {
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === activePageId) {
                    link.classList.add('active');
                }
            });
            const pages = Array.from(links);
            const currentIndex = pages.findIndex(p => p.getAttribute('data-page') === activePageId);
            const prevButton = document.querySelector('.pagination-button[data-action="prev"]');
            const nextButton = document.querySelector('.pagination-button[data-action="next"]');
            if (prevButton) prevButton.classList.toggle('disabled', currentIndex === 0);
            if (nextButton) nextButton.classList.toggle('disabled', currentIndex === pages.length - 1);
        }
    }

    // Initialize first page
    const firstPageLink = document.querySelector('.pagination-link');
    if (firstPageLink) {
        const initialPageId = firstPageLink.getAttribute('data-page');
        // For initial load, we probably don't want an animation, so just call performPageChange
        performPageChange(initialPageId);
        updatePagination(initialPageId);
    }

    // Truncate project card descriptions (remains the same)
    document.querySelectorAll('.project-card p').forEach((paragraph) => {
        const text = paragraph.textContent;
        if (text.length > 80) { // Adjust character limit as needed
            paragraph.textContent = text.substring(0, 77) + '...';
        }
    });
});