const btn = document.getElementById('creepy-btn');
const eyesEl = document.getElementById('eyes');
const pupils = [document.getElementById('pupil1'), document.getElementById('pupil2')];

function updateEyes(clientX, clientY) {
  const eyesRect = eyesEl.getBoundingClientRect();
  const eyesCenterX = eyesRect.left + eyesRect.width / 2;
  const eyesCenterY = eyesRect.top + eyesRect.height / 2;

  const dx = clientX - eyesCenterX;
  const dy = clientY - eyesCenterY;
  const angle = Math.atan2(-dy, dx) + Math.PI / 2;

  const visionRangeX = 180;
  const visionRangeY = 75;
  const distance = Math.hypot(dx, dy);

  const x = Math.sin(angle) * distance / visionRangeX;
  const y = Math.cos(angle) * distance / visionRangeY;

  const translateX = `${-50 + x * 50}%`;
  const translateY = `${-50 + y * 50}%`;

  pupils.forEach(p => {
    p.style.transform = `translate(${translateX}, ${translateY})`;
  });
}

btn.addEventListener('mousemove', (e) => {
  updateEyes(e.clientX, e.clientY);
});

btn.addEventListener('touchmove', (e) => {
  updateEyes(e.touches[0].clientX, e.touches[0].clientY);
});
