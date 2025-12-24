import { useEffect, useRef } from 'react';

interface SnowCityEffectProps {
  className?: string;
}

export function SnowCityEffect({ className }: SnowCityEffectProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Array<{ x: number; y: number; speed: number; size: number; opacity: number }>>([]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();

    // Initialize snowflakes
    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < 150; i++) {
        snowflakesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 2,
          size: 2 + Math.random() * 4,
          opacity: 0.5 + Math.random() * 0.5
        });
      }
    };
    initSnowflakes();

    // Video event handlers
    const handleVideoLoaded = () => {
      video.play().catch(console.error);
    };

    video.addEventListener('loadeddata', handleVideoLoaded);
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Draw snowflakes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      snowflakesRef.current.forEach((flake) => {
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();

        // Update flake position
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y * 0.01) * 0.5; // Slight horizontal drift

        // Reset if off screen
        if (flake.y > canvas.height) {
          flake.y = -flake.size;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x < -flake.size) {
          flake.x = canvas.width + flake.size;
        }
        if (flake.x > canvas.width + flake.size) {
          flake.x = -flake.size;
        }
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      updateCanvasSize();
      initSnowflakes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      video.removeEventListener('loadeddata', handleVideoLoaded);
    };
  }, []);

  return (
    <div className={className} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src="/assets/backgrounds/city-night-snow.mp4"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      />
      <canvas
        ref={canvasRef}
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

