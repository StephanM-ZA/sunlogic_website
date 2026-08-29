function dlInitParticles(canvas) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const COUNT = 40;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2,
      vy: 0.1 + Math.random() * 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 247, 233, 0.15)';
    particles.forEach(function(p) {
      p.y -= p.vy;
      if (p.y < 0) { p.y = height; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.dl-particles').forEach(dlInitParticles);
});
