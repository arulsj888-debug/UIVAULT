// Pause on hover is handled via CSS animation-play-state
// Click a card to bring it to front
const carousel = document.querySelector('.a3d');
const cards = document.querySelectorAll('.card');
const N = cards.length;
let current = 0;

cards.forEach((card, i) => {
  card.addEventListener('click', () => {
    current = i;
    const angle = -(i * (360 / N));
    carousel.style.transform = `rotateY(${angle}deg)`;
    carousel.style.animation = 'none';
  });
});

// Double-click to resume auto-spin
carousel.addEventListener('dblclick', () => {
  carousel.style.animation = 'spin 32s linear infinite';
  carousel.style.transform = '';
});
