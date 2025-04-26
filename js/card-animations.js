/* card-animations.js - Handle viewport-triggered animations for project cards on browsers without animation-timeline support */

document.addEventListener('DOMContentLoaded', () => {
    // Check if animation-timeline is unsupported
    if (!CSS.supports('animation-timeline', 'view()')) {
        const cards = document.querySelectorAll('#projects .project-card');

        // Create IntersectionObserver to trigger animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Add .is-visible class with a slight delay for staggered effect
                        setTimeout(() => {
                            entry.target.classList.add('is-visible');
                        }, index * 200); // 200ms delay per card
                        observer.unobserve(entry.target); // Stop observing once animated
                    }
                });
            },
            {
                root: null, // Use viewport
                threshold: 0.1, // Trigger when 10% of the card is visible
            }
        );

        // Observe each project card
        cards.forEach((card) => observer.observe(card));
    }
});