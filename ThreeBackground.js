import * as THREE from 'three';

class ThreeBackground {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add objects
    const geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.3
    });
    this.torus = new THREE.Mesh(geometry, material);
    this.scene.add(this.torus);

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Start animation
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.torus) {
      this.torus.rotation.x += 0.01;
      this.torus.rotation.y += 0.005;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

export default ThreeBackground;