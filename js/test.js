console.log('test.js loaded');

const list = document.querySelector('main.ui-craft ul');
const items = list.querySelectorAll('li');

// Desktop interaction logic (unchanged)
const setIndex = (event) => {
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;
  if (!isDesktop) return; // Skip on mobile

  const closest = event.target.closest('li');
  if (closest) {
    const index = [...items].indexOf(closest);
    const cols = new Array(list.children.length)
      .fill()
      .map((_, i) => {
        items[i].dataset.active = (index === i).toString();
        return index === i ? '10fr' : '1fr';
      })
      .join(' ');

    list.style.setProperty('grid-template-columns', cols);
  }
};

// Desktop event listeners
list.addEventListener('focus', setIndex, true);
list.addEventListener('click', setIndex);
list.addEventListener('pointermove', setIndex);

// Mobile Intersection Observer for viewport detection
const setupIntersectionObserver = () => {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (!isMobile) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const li = entry.target;
        li.dataset.visible = entry.isIntersecting.toString();
      });
    },
    {
      root: null, // Use viewport as root
      rootMargin: '0px', // Trigger when fully in view
      threshold: 0.5, // Trigger when 50% of the element is visible
    }
  );

  items.forEach((item) => observer.observe(item));
};

// Resize and resync logic (updated to include observer setup)
const resync = () => {
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;
  if (isDesktop) {
    const w = Math.max(
      ...[...items].map((i) => i.offsetWidth)
    );
    list.style.setProperty('--article-width', w);
  }
  setupIntersectionObserver(); // Re-run observer setup on resize
};

// Initial setup and event listeners
window.addEventListener('resize', resync);
resync();