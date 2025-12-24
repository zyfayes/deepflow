import { useEffect, useRef } from 'react';

interface LibraryEffectProps {
  className?: string;
}

export function LibraryEffect({ className }: LibraryEffectProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; rotation: number; rotationSpeed: number }>>([]);

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

    // Initialize particles (book pages)
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: 20 + Math.random() * 30,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02
        });
      }
    };
    initParticles();

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

      // Draw book page particles
      ctx.save();
      particlesRef.current.forEach((particle) => {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        // Draw book page shape
        ctx.fillStyle = 'rgba(255, 248, 220, 0.3)';
        ctx.strokeStyle = 'rgba(255, 248, 220, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.4);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        ctx.save();

        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      });
      ctx.restore();

      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      updateCanvasSize();
      initParticles();
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
        src="/assets/backgrounds/library-warm.mp4"
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

