console.log('test.js loaded');

// Target the correct <ul>
const list = document.querySelector('main.ui-craft ul');
const items = list.querySelectorAll('li');

const setIndex = (event) => {
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

list.addEventListener('focus', setIndex, true);
list.addEventListener('click', setIndex);
list.addEventListener('pointermove', setIndex);

const resync = () => {
  const w = Math.max(
    ...[...items].map((i) => {
      return i.offsetWidth;
    })
  );
  list.style.setProperty('--article-width', w);
};

window.addEventListener('resize', resync);
resync();
