const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // Fond noir
  ctx.fillStyle = '#080814';
  ctx.fillRect(0, 0, s, s);

  // Slash gauche
  const grad1 = ctx.createLinearGradient(0, 0, s, s);
  grad1.addColorStop(0, 'rgba(255,107,43,0.6)');
  grad1.addColorStop(1, 'rgba(255,214,0,0.2)');
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.moveTo(s*0.15, s);
  ctx.lineTo(s*0.35, 0);
  ctx.lineTo(s*0.45, 0);
  ctx.lineTo(s*0.25, s);
  ctx.closePath();
  ctx.fill();

  // Slash droite
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(s*0.30, s);
  ctx.lineTo(s*0.50, 0);
  ctx.lineTo(s*0.60, 0);
  ctx.lineTo(s*0.40, s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // KAZMO texte
  const textGrad = ctx.createLinearGradient(0, 0, s, 0);
  textGrad.addColorStop(0, '#FF6B2B');
  textGrad.addColorStop(1, '#FFD600');
  ctx.fillStyle = textGrad;
  ctx.font = `900 ${s*0.22}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KAZMO', s*0.52, s*0.52);

  // Ligne sous KAZMO
  ctx.beginPath();
  ctx.moveTo(s*0.20, s*0.63);
  ctx.lineTo(s*0.80, s*0.63);
  ctx.strokeStyle = textGrad;
  ctx.lineWidth = s*0.015;
  ctx.stroke();

  // SPORT texte
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `700 ${s*0.09}px Arial`;
  ctx.letterSpacing = '0.3em';
  ctx.fillText('SPORT', s*0.52, s*0.74);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log('Generated: ' + filename + ' (' + size + 'x' + size + ')');
}

// Icône App Store 1024x1024
generateIcon(1024, './assets/icon.png');
// Splash screen 1284x2778 (iPhone)
const canvas2 = createCanvas(1284, 2778);
const ctx2 = canvas2.getContext('2d');
ctx2.fillStyle = '#080814';
ctx2.fillRect(0, 0, 1284, 2778);
const grad = ctx2.createLinearGradient(0, 0, 1284, 0);
grad.addColorStop(0, '#FF6B2B');
grad.addColorStop(1, '#FFD600');
ctx2.fillStyle = grad;
ctx2.font = '900 180px Arial';
ctx2.textAlign = 'center';
ctx2.textBaseline = 'middle';
ctx2.fillText('KAZMO', 642, 1389);
ctx2.beginPath();
ctx2.moveTo(200, 1480);
ctx2.lineTo(1084, 1480);
ctx2.strokeStyle = '#FF6B2B';
ctx2.lineWidth = 4;
ctx2.stroke();
ctx2.fillStyle = 'rgba(255,255,255,0.5)';
ctx2.font = '700 60px Arial';
ctx2.fillText('SPORT', 642, 1530);
fs.writeFileSync('./assets/splash.png', canvas2.toBuffer('image/png'));
console.log('Generated: splash.png (1284x2778)');
