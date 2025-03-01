// projects.js

// Pagination logic
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pagination-link, .pagination-button').forEach(element => {
        element.addEventListener('click', e => {
            e.preventDefault();
            
            // Handle page number clicks
            if (element.classList.contains('pagination-link')) {
                const pageId = element.getAttribute('data-page');
                showPage(pageId);
                updatePagination(pageId);
            }
            
            // Handle Previous/Next buttons
            if (element.classList.contains('pagination-button')) {
                const currentPage = document.querySelector('.pagination-link.active')?.getAttribute('data-page');
                const pages = Array.from(document.querySelectorAll('.pagination-link'));
                const currentIndex = pages.findIndex(p => p.getAttribute('data-page') === currentPage);
                const action = element.getAttribute('data-action');
                
                if (action === 'prev' && currentIndex > 0) {
                    const newPage = pages[currentIndex - 1].getAttribute('data-page');
                    showPage(newPage);
                    updatePagination(newPage);
                } else if (action === 'next' && currentIndex < pages.length - 1) {
                    const newPage = pages[currentIndex + 1].getAttribute('data-page');
                    showPage(newPage);
                    updatePagination(newPage);
                }
            }
        });
    });

    function showPage(pageId) {
        document.querySelectorAll('.project-grid').forEach(grid => {
            grid.classList.add('hidden');
        });
        const pageElement = document.getElementById(pageId);
        if (pageElement) {
            pageElement.classList.remove('hidden');
            pageElement.classList.add('animate-in');
            pageElement.addEventListener('animationend', () => {
                pageElement.classList.remove('animate-in');
            }, { once: true });
        }
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

    // Initialize first page if on projects.html
    const firstPage = document.querySelector('.pagination-link');
    if (firstPage) {
        const initialPageId = firstPage.getAttribute('data-page');
        showPage(initialPageId);
        updatePagination(initialPageId);
    }

    document.querySelectorAll('.project-card p').forEach((paragraph) => {
        const text = paragraph.textContent;
        if (text.length > 80) {
            paragraph.textContent = text.substring(0, 77) + '...';
        }
    });
});