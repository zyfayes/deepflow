import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NightQuietEffectProps {
  className?: string;
}

export function NightQuietEffect({ className }: NightQuietEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Rain drops
  const rainDropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number }>>([]);
  const rainCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js for starfield
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }
    rendererRef.current = renderer;

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // Initialize rain canvas
    const rainCanvas = rainCanvasRef.current;
    if (rainCanvas) {
      const ctx = rainCanvas.getContext('2d');
      if (ctx) {
        rainCanvas.width = window.innerWidth;
        rainCanvas.height = window.innerHeight;

        // Initialize rain drops
        for (let i = 0; i < 200; i++) {
          rainDropsRef.current.push({
            x: Math.random() * rainCanvas.width,
            y: Math.random() * rainCanvas.height,
            speed: 2 + Math.random() * 3,
            length: 10 + Math.random() * 20
          });
        }
      }
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Rotate stars slowly
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005;
        starsRef.current.rotation.x += 0.0002;
      }

      // Render stars
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Draw rain
      const rainCanvas = rainCanvasRef.current;
      if (rainCanvas) {
        const ctx = rainCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
          ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
          ctx.lineWidth = 1;

          rainDropsRef.current.forEach((drop) => {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();

            drop.y += drop.speed;
            if (drop.y > rainCanvas.height) {
              drop.y = -drop.length;
              drop.x = Math.random() * rainCanvas.width;
            }
          });
        }
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);

        if (rainCanvasRef.current) {
          rainCanvasRef.current.width = window.innerWidth;
          rainCanvasRef.current.height = window.innerHeight;
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (starsRef.current) {
        starsRef.current.geometry.dispose();
        (starsRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <canvas
        ref={rainCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
    </div>
  );
}

