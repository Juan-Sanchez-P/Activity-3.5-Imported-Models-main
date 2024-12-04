import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6b7280); // Muted gray-blue for overcast sky

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, 7);

// Renderer setup with more realistic settings
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Realistic Lighting
const directionalLight = new THREE.DirectionalLight(0xb0c4de, 1.5);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Fog for depth and atmosphere
scene.fog = new THREE.Fog(0x6b7280, 10, 25);

// Clock for animation
const clock = new THREE.Clock();

// Realistic Ground
const groundGeometry = new THREE.PlaneGeometry(15, 15, 100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2c3e50, // Deep, wet forest green
  roughness: 0.8,
  metalness: 0.2
});

// Add some displacement and roughness for terrain-like ground
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/textures/ground_displacement.jpg', (displacementMap) => {
  groundMaterial.displacementMap = displacementMap;
  groundMaterial.displacementScale = 0.1;
});

textureLoader.load('/textures/ground_roughness.jpg', (roughnessMap) => {
  groundMaterial.roughnessMap = roughnessMap;
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
ground.receiveShadow = true;
scene.add(ground);

// Enhanced Rain Particles
const rainGeometry = new THREE.BufferGeometry();
const rainCount = 15000;
const positionArray = new Float32Array(rainCount * 3);
const velocityArray = new Float32Array(rainCount * 3);

for (let i = 0; i < rainCount; i++) {
  positionArray[i * 3] = (Math.random() - 0.5) * 40;
  positionArray[i * 3 + 1] = Math.random() * 25;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 40;

  velocityArray[i * 3] = (Math.random() - 0.5) * 0.2;
  velocityArray[i * 3 + 1] = -(Math.random() * 0.7 + 0.6);
  velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
}

rainGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));

const rainMaterial = new THREE.PointsMaterial({
  color: 0xbdc3c7,  // Soft gray-blue for rain
  size: 0.04,
  transparent: true,
  opacity: 0.5
});

const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
scene.add(rainParticles);

// Realistic Puddle
const puddleGeometry = new THREE.CircleGeometry(2.5, 64);
const puddleMaterial = new THREE.MeshStandardMaterial({
  color: 0x34495e,
  transparent: true,
  opacity: 0.4,
  roughness: 1,
  metalness: 0
});
const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
puddle.rotation.x = -Math.PI / 2;
puddle.position.y = -0.15;
scene.add(puddle);

// Mist/Fog Particles
const mistGeometry = new THREE.BufferGeometry();
const mistCount = 5000;
const mistPositionArray = new Float32Array(mistCount * 3);

for (let i = 0; i < mistCount; i++) {
  mistPositionArray[i * 3] = (Math.random() - 0.5) * 30;
  mistPositionArray[i * 3 + 1] = Math.random() * 5;
  mistPositionArray[i * 3 + 2] = (Math.random() - 0.5) * 30;
}

mistGeometry.setAttribute('position', new THREE.BufferAttribute(mistPositionArray, 3));

const mistMaterial = new THREE.PointsMaterial({
  color: 0xecf0f1,
  size: 0.1,
  transparent: true,
  opacity: 0.1
});

const mistParticles = new THREE.Points(mistGeometry, mistMaterial);
scene.add(mistParticles);

// GLTF Model Loader
const gltfLoader = new GLTFLoader();
let mixer1, mixer2;

// Load Horsey model (similar to previous implementation)
gltfLoader.load(
  '/models/Horsey/horsey.gltf',
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 2 / maxDim;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.position.set(0, -0.05, -2);
    model.castShadow = true;
    scene.add(model);

    if (gltf.animations.length > 0) {
      mixer1 = new THREE.AnimationMixer(model);
      const desiredAnimations = ["course_cheval", "course_charette"];

      gltf.animations.forEach((clip) => {
        if (desiredAnimations.includes(clip.name)) {
          const action = mixer1.clipAction(clip);
          action.play();
        }
      });
    }
  },
  (error) => {
    console.error('Error loading Horsey model:', error);
  }
);

// Load Wolfy model (similar to previous implementation)
gltfLoader.load(
  '/models/Wolfy/Wolfy.gltf',
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 0.7 / maxDim;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.position.set(0, -0.05, 1);
    model.castShadow = true;
    scene.add(model);

    if (gltf.animations.length > 0) {
      mixer2 = new THREE.AnimationMixer(model);
      const desiredAnimations = ["course_cavalier", "course_loup"];

      gltf.animations.forEach((clip) => {
        if (desiredAnimations.includes(clip.name)) {
          const action = mixer2.clipAction(clip);
          action.play();
        }
      });
    }
  },
  (error) => {
    console.error('Error loading Wolfy model:', error);
  }
);

// Render loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer1) mixer1.update(delta);
  if (mixer2) mixer2.update(delta);

  // Update rain particles
  const positions = rainParticles.geometry.getAttribute('position');
  const velocities = rainParticles.geometry.getAttribute('velocity');

  for (let i = 0; i < rainCount; i++) {
    positions.array[i * 3 + 0] += velocities.array[i * 3 + 0];
    positions.array[i * 3 + 1] += velocities.array[i * 3 + 1];
    positions.array[i * 3 + 2] += velocities.array[i * 3 + 2];

    if (positions.array[i * 3 + 1] < -1) {
      positions.array[i * 3 + 1] = 25;
      positions.array[i * 3 + 0] = (Math.random() - 0.5) * 40;
      positions.array[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
  }

  positions.needsUpdate = true;

  // Subtle mist movement
  const mistPositions = mistParticles.geometry.getAttribute('position');
  for (let i = 0; i < mistCount; i++) {
    mistPositions.array[i * 3 + 1] -= 0.01;
    if (mistPositions.array[i * 3 + 1] < 0) {
      mistPositions.array[i * 3 + 1] = 5;
    }
  }
  mistPositions.needsUpdate = true;

  // Subtle puddle animation
  puddle.scale.x = 1 + Math.sin(clock.elapsedTime * 0.5) * 0.03;
  puddle.scale.y = 1 + Math.sin(clock.elapsedTime * 0.5) * 0.03;

  controls.update();
  renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation loop
animate();