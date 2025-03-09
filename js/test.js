console.log('test.js loaded');

const list = document.querySelector('main.ui-craft ul');
const items = list.querySelectorAll('li');

const setIndex = (event) => {
  // Check screen size to apply logic only where needed
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;

  const closest = event.target.closest('li');
  if (closest) {
    const index = [...items].indexOf(closest);
    const cols = new Array(list.children.length)
      .fill()
      .map((_, i) => {
        items[i].dataset.active = (index === i).toString();
        return isDesktop && index === i ? '10fr' : '1fr';
      })
      .join(' ');

    // Only set grid columns on desktop
    if (isDesktop) {
      list.style.setProperty('grid-template-columns', cols);
    }
  }
};

// Desktop events
list.addEventListener('focus', setIndex, true);
list.addEventListener('click', setIndex);
list.addEventListener('pointermove', setIndex);

// Mobile/touch events
list.addEventListener('touchstart', setIndex, { passive: true });

// Resize and resync logic
const resync = () => {
  if (window.matchMedia('(min-width: 769px)').matches) {
    const w = Math.max(
      ...[...items].map((i) => {
        return i.offsetWidth;
      })
    );
    list.style.setProperty('--article-width', w);
  }
};

window.addEventListener('resize', resync);
resync();