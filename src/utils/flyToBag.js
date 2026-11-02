/* Add-to-bag flourish: a small copy of the product picture arcs into the header bag, which then jiggles. */

const BAG_SELECTOR = 'a[aria-label="Cart"]';
const FLIGHT_MS = 750;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function jiggleBag(bag) {
  bag.animate(
    [
      { transform: 'scale(1) rotate(0)' },
      { transform: 'scale(1.35) rotate(-14deg)', offset: 0.25 },
      { transform: 'scale(1.2) rotate(10deg)', offset: 0.5 },
      { transform: 'scale(1.1) rotate(-5deg)', offset: 0.75 },
      { transform: 'scale(1) rotate(0)' },
    ],
    { duration: 600, easing: 'ease-out' },
  );
  bag.querySelector('span')?.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.4 }, { transform: 'scale(1)' }],
    { duration: 500, easing: 'ease-out' },
  );
}

export function flyToBag(sourceEl, imageSrc) {
  const bag = document.querySelector(BAG_SELECTOR);
  if (!bag || prefersReducedMotion()) return;
  if (!sourceEl || !imageSrc) {
    jiggleBag(bag);
    return;
  }

  const from = sourceEl.getBoundingClientRect();
  const to = bag.getBoundingClientRect();
  const size = 90;
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - size / 2 - startX;
  const dy = to.top + to.height / 2 - size / 2 - startY;

  const flyer = document.createElement('img');
  flyer.src = imageSrc;
  flyer.alt = '';
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '9999px',
    border: '3px solid #E3BF72',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
    zIndex: '9999',
    pointerEvents: 'none',
  });
  document.body.appendChild(flyer);

  const flight = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.7)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.4 },
    ],
    { duration: FLIGHT_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  );
  flight.onfinish = () => {
    flyer.remove();
    jiggleBag(bag);
  };
  flight.oncancel = () => flyer.remove();
}
