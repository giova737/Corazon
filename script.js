// script.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/geometries/TextGeometry.js';

let scene, camera, renderer;
let letters = [];
let heartPositions = [];
let animationPhase = 0;
let formationProgress = 0;

const floatingHearts = [];
const heartChars = ["🖤", "🩶"];

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 60;

    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, canvas:document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    createStars(200);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const point = new THREE.PointLight(0xffd6a5, 1.2);
    point.position.set(30,30,50);
    scene.add(point);

    const loader = new FontLoader();
    // Fuente cursiva
    loader.load('https://threejs.org/examples/fonts/helvetiker_italic.typeface.json', font => {
        createLetters(font);
        computeHeartPositions();
    });

    window.addEventListener('resize', onResize);
}

function createStars(count){
    const starsContainer = document.createElement('div');
    starsContainer.classList.add('stars');
    document.body.appendChild(starsContainer);
    for(let i=0;i<count;i++){
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.left = `${Math.random()*100}%`;
        star.style.top = `${Math.random()*100}%`;
        star.style.setProperty('--duration', `${Math.random()*5+3}s`);
        star.style.setProperty('--delay', `${Math.random()*5}s`);
        starsContainer.appendChild(star);
    }
}

function createLetters(font){
    const text = "Bianca";
    for(let i=0;i<500;i++){
        const geometry = new TextGeometry(text, { font: font, size:1, height:0.2 });
        const material = new THREE.MeshStandardMaterial({ color:0xfff1e0, emissive:0xffd6a5, emissiveIntensity:0.4 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            (Math.random()-0.5)*120,
            (Math.random()-0.5)*120,
            (Math.random()-0.5)*120
        );
        scene.add(mesh);
        letters.push(mesh);
    }
}

function computeHeartPositions(){
    const scale = 0.8;
    const total = letters.length;
    for(let i=0;i<total;i++){
        const t = (i/total)*Math.PI*2*3;
        const x = 16*Math.pow(Math.sin(t),3)*scale;
        const y = 13*Math.cos(t) -5*Math.cos(2*t) -2*Math.cos(3*t)-Math.cos(4*t);
        const z = (Math.random()-0.5)*2;
        heartPositions.push(new THREE.Vector3(x*scale, y*scale, z*scale));
    }
}

function animate(){
    requestAnimationFrame(animate);

    if(animationPhase===0 && heartPositions.length>0){
        formationProgress = Math.min(1, formationProgress + 0.002);
        letters.forEach((letter,i)=>{
            letter.position.lerpVectors(letter.position, heartPositions[i], formationProgress);
        });
        if(formationProgress>=1) animationPhase=1;
    }

    if(animationPhase===1){
        letters.forEach(letter=>{
            letter.rotation.y += 0.003;
            letter.rotation.x += 0.002;
        });
    }

    if(Math.random()<0.02) createFloatingHeart();
    floatingHearts.forEach((h,i)=>{
        h.position.y += 0.2;
        h.material.opacity -=0.002;
        if(h.position.y>window.innerHeight/10 || h.material.opacity<=0){
            scene.remove(h);
            floatingHearts.splice(i,1);
        }
    });

    renderer.render(scene,camera);
}

function createFloatingHeart(){
    const geometry = new TextGeometry(heartChars[Math.floor(Math.random()*2)], {size:1, height:0.1});
    const material = new THREE.MeshStandardMaterial({ color:0x888888, emissive:0xaaaaaa, transparent:true, opacity:0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        (Math.random()-0.5)*60,
        -30,
        (Math.random()-0.5)*20
    );
    scene.add(mesh);
    floatingHearts.push(mesh);
}

function onResize(){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
