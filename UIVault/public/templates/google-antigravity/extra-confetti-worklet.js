registerPaint('extra-confetti', class {
  static get inputProperties() {
    return [
      '--extra-confettiNumber',
      '--extra-confettiLengthVariance',
      '--extra-confettiWeightVariance',
    ];
  }

  paint(ctx, size, props) {
    const count = parseInt(props.get('--extra-confettiNumber')) || 150;
    const lengthVar = parseFloat(props.get('--extra-confettiLengthVariance')) || 1;
    const weightVar = parseFloat(props.get('--extra-confettiWeightVariance')) || 1;

    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853',
      '#8AB4F8', '#F28B82', '#FDD663', '#81C995',
      '#ffffff33', '#aaaaaa22',
    ];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * size.width;
      const y = Math.random() * size.height;
      const length = (Math.random() * 12 + 4) * lengthVar;
      const weight = (Math.random() * 3 + 1) * weightVar;
      const angle = Math.random() * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = Math.random() * 0.6 + 0.2;
      ctx.fillRect(-weight / 2, -length / 2, weight, length);
      ctx.restore();
    }
  }
});
