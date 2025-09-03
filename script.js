const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Configuración
const letters = 'Bianca';
const particles = [];
const heartParticles = [];
const floatingHearts = [];
const starCount = 200;
const stars = [];

// Crear estrellas
for (let i = 0; i < starCount; i++) {
    stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2,
        opacity: Math.random()
    });
}

// Función corazón
function heartPoint(t, scale = 15) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    return {
        x: width/2 + x*scale,
        y: height/2 - y*scale
    };
}

// Crear partículas de letras
const particleCount = 800;
for (let i = 0; i < particleCount; i++) {
    const t = (i / particleCount) * Math.PI * 2;
    const pos = heartPoint(t, Math.random() * 15 + 12);

    particles.push({
        letter: letters[Math.floor(Math.random() * letters.length)],
        x: Math.random() * width,
        y: Math.random() * height,
        tx: pos.x,
        ty: pos.y,
        size: Math.random() * 20 + 15,
        speed: Math.random() * 0.03 + 0.02,
        arrived: false
    });
}

// Corazones flotando
function createFloatingHeart() {
    floatingHearts.push({
        x: Math.random() * width,
        y: height + 20,
        size: Math.random() * 20 + 10,
        speed: Math.random() * 1 + 0.5,
        color: Math.random() > 0.5 ? '🖤' : '🩶'
    });
}

// Resize adaptativo
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Animación principal
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Dibujar estrellas
    for (let s of stars) {
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
    }

    // Mover partículas hacia su posición en corazón
    for (let p of particles) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if(dist < 1) p.arrived = true;

        if(!p.arrived) {
            p.x += dx * p.speed;
            p.y += dy * p.speed;
        }

        ctx.font = `${p.size}px Arial Black`;
        ctx.fillStyle = p.arrived ? 'rgba(255, 245, 210,1)' : 'rgba(255,245,210,0.6)';
        ctx.fillText(p.letter, p.x, p.y);
    }

    // Corazones flotando
    if(Math.random() < 0.02) createFloatingHeart();
    for(let i = floatingHearts.length-1; i >= 0; i--) {
        const h = floatingHearts[i];
        h.y -= h.speed;
        ctx.font = `${h.size}px Arial Black`;
        ctx.fillText(h.color, h.x, h.y);

        if(h.y < -50) floatingHearts.splice(i,1);
    }

    requestAnimationFrame(animate);
}

animate();
