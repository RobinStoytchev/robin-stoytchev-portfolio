// Check if animation-timeline: view() is unsupported
if (!CSS.supports('animation-timeline', 'view()')) {
    const cards = document.querySelectorAll('#projects .project-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Stop observing once animated
          }
        });
      },
      {
        root: null, // Use viewport
        threshold: 0.1, // Trigger when 10% of card is visible
        rootMargin: '0px 0px -50% 0px' // Mimic animation-range: entry 10% cover 50%
      }
    );

    cards.forEach((card) => observer.observe(card));
  }