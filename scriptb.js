// scriptB.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/geometries/TextGeometry.js';

let fallingBs = [];
const maxB = 80;

const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_italic.typeface.json', font => {
    for(let i=0;i<maxB;i++){
        createB(font);
    }
});

function createB(font){
    const geometry = new TextGeometry("B", { font: font, size:1, height:0.1 });
    const material = new THREE.MeshStandardMaterial({ color:0xfff1e0, emissive:0xffd6a5, transparent:true, opacity:0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        (Math.random()-0.5)*120,
        80 + Math.random()*40,
        (Math.random()-0.5)*50
    );
    fallingBs.push({mesh, speed: 0.2+Math.random()*0.3});
    scene.add(mesh);
}

function animateB(){
    requestAnimationFrame(animateB);
    fallingBs.forEach((obj,i)=>{
        obj.mesh.position.y -= obj.speed;
        if(obj.mesh.position.y < -60){
            scene.remove(obj.mesh);
            fallingBs.splice(i,1);
            createB(obj.mesh.geometry.parameters.font);
        }
    });
}

animateB();