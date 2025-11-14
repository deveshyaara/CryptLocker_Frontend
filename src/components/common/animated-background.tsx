'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  trail: Array<{ x: number; y: number; opacity: number }>;
  type: 'normal' | 'glow' | 'fast';
}

interface GravityWell {
  x: number;
  y: number;
  strength: number;
  radius: number;
  phase: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const gravityWellsRef = useRef<GravityWell[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  const colors = [
    { r: 59, g: 130, b: 246 },   // primary blue
    { r: 16, g: 185, b: 129 },   // accent green
    { r: 139, g: 92, b: 246 },   // chart-4 purple
    { r: 99, g: 102, b: 241 },   // indigo
    { r: 236, g: 72, b: 153 },   // pink
  ];

  const createParticle = useCallback((width: number, height: number, type: 'normal' | 'glow' | 'fast' = 'normal'): Particle => {
    const colorIndex = Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];
    const baseRadius = type === 'fast' ? 1 : type === 'glow' ? 3 : 2;
    
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (type === 'fast' ? 1.5 : 0.8),
      vy: (Math.random() - 0.5) * (type === 'fast' ? 1.5 : 0.8),
      radius: baseRadius + Math.random() * 2,
      color: `rgba(${color.r}, ${color.g}, ${color.b}, ${type === 'glow' ? 0.6 : 0.4})`,
      opacity: type === 'glow' ? 0.8 : 0.4,
      life: Math.random() * 1000,
      maxLife: 1000 + Math.random() * 2000,
      trail: [],
      type,
    };
  }, []);

  const createParticles = useCallback((width: number, height: number): Particle[] => {
    const particleCount = Math.min(120, Math.floor((width * height) / 12000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const type = i % 10 === 0 ? 'glow' : i % 5 === 0 ? 'fast' : 'normal';
      particles.push(createParticle(width, height, type));
    }
    return particles;
  }, [createParticle]);

  const createGravityWells = useCallback((width: number, height: number): GravityWell[] => {
    const wells: GravityWell[] = [];
    const count = 3;
    
    for (let i = 0; i < count; i++) {
      wells.push({
        x: (width / (count + 1)) * (i + 1),
        y: height / 2,
        strength: 0.3 + Math.random() * 0.2,
        radius: 200 + Math.random() * 150,
        phase: (Math.PI * 2 / count) * i,
      });
    }
    return wells;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;

      canvas.width = newWidth;
      canvas.height = newHeight;

      const isInitialLoad = oldWidth === 0 || oldHeight === 0;
      const sizeChanged = Math.abs(newWidth - oldWidth) > 100 || Math.abs(newHeight - oldHeight) > 100;
      
      if (sizeChanged || isInitialLoad || particlesRef.current.length === 0) {
        particlesRef.current = createParticles(newWidth, newHeight);
        gravityWellsRef.current = createGravityWells(newWidth, newHeight);
      } else if (oldWidth > 0 && oldHeight > 0) {
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        particlesRef.current.forEach((p) => {
          p.x = Math.max(0, Math.min(newWidth, p.x * scaleX));
          p.y = Math.max(0, Math.min(newHeight, p.y * scaleY));
        });
        gravityWellsRef.current.forEach((w) => {
          w.x *= scaleX;
          w.y *= scaleY;
        });
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastMouseX = 0;
    let lastMouseY = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX;
      const newY = e.clientY;
      
      mouseRef.current = {
        x: newX,
        y: newY,
        vx: newX - lastMouseX,
        vy: newY - lastMouseY,
      };
      
      lastMouseX = newX;
      lastMouseY = newY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const gravityWells = gravityWellsRef.current;
      const time = timeRef.current;

      // Update gravity wells position (orbital motion)
      gravityWells.forEach((well, i) => {
        const orbitRadius = 150;
        well.x = (canvas.width / (gravityWells.length + 1)) * (i + 1) + Math.cos(time * 0.3 + well.phase) * orbitRadius;
        well.y = canvas.height / 2 + Math.sin(time * 0.3 + well.phase) * orbitRadius * 0.6;
      });

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Update life
        p.life += 1;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }

        // Gravity wells effect
        for (const well of gravityWells) {
          const dx = well.x - p.x;
          const dy = well.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < well.radius && distance > 0) {
            const force = (well.radius - distance) / well.radius;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * well.strength * 0.05;
            p.vy += Math.sin(angle) * force * well.strength * 0.05;
          }
        }

        // Mouse interaction with repulsion and attraction zones
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repulsionDistance = 80;
        const attractionDistance = 200;

        if (distance < repulsionDistance && distance > 0) {
          // Repulsion zone
          const force = (repulsionDistance - distance) / repulsionDistance;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 0.15;
          p.vy -= Math.sin(angle) * force * 0.15;
        } else if (distance < attractionDistance && distance > repulsionDistance) {
          // Attraction zone
          const force = (attractionDistance - distance) / (attractionDistance - repulsionDistance) * 0.3;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.05;
          p.vy += Math.sin(angle) * force * 0.05;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Boundary handling with soft bounce
        const bounceDamping = 0.7;
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -bounceDamping;
        } else if (p.x > canvas.width) {
          p.x = canvas.width;
          p.vx *= -bounceDamping;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy *= -bounceDamping;
        } else if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -bounceDamping;
        }

        // Velocity damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Limit velocity
        const maxVel = p.type === 'fast' ? 4 : 2.5;
        const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (vel > maxVel) {
          p.vx = (p.vx / vel) * maxVel;
          p.vy = (p.vy / vel) * maxVel;
        }

        // Update trail
        p.trail.push({ x: p.x, y: p.y, opacity: p.opacity });
        if (p.trail.length > (p.type === 'fast' ? 8 : 5)) {
          p.trail.shift();
        }

        // Draw trail with gradient
        if (p.trail.length > 1) {
          for (let j = 0; j < p.trail.length - 1; j++) {
            const point = p.trail[j];
            const nextPoint = p.trail[j + 1];
            const trailOpacity = (point.opacity * (j / p.trail.length)) * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.strokeStyle = p.color.replace(/[\d\.]+\)$/g, `${trailOpacity})`);
            ctx.lineWidth = p.type === 'glow' ? 2 : 1;
            ctx.stroke();
          }
        }

        // Draw particle with glow effect
        if (p.type === 'glow') {
          // Outer glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.5, p.color.replace(/[\d\.]+\)$/g, '0.2)'));
          gradient.addColorStop(1, p.color.replace(/[\d\.]+\)$/g, '0)'));
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Main particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      // Draw connections between nearby particles with dynamic opacity
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = particles[i].type === 'glow' || particles[j].type === 'glow' ? 150 : 120;

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.25;
            const colorIndex = Math.floor((i + j) % colors.length);
            const color = colors[colorIndex];
            
            // Create gradient line
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${colors[(colorIndex + 1) % colors.length].r}, ${colors[(colorIndex + 1) % colors.length].g}, ${colors[(colorIndex + 1) % colors.length].b}, ${opacity})`);
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw mouse connection with pulsing effect
      const mousePulse = Math.sin(time * 5) * 0.3 + 0.7;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 180;

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.4 * mousePulse;
          const color = colors[Math.floor(i % colors.length)];
          
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw gravity wells with visual indicator
      ctx.save();
      gravityWells.forEach((well) => {
        const gradient = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, well.radius);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${0.05 * Math.sin(time * 2 + well.phase)})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        ctx.beginPath();
        ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [createParticles, createGravityWells]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          background: 'transparent',
          display: 'block',
          width: '100%',
          height: '100%'
        }}
        aria-hidden="true"
      />
    </div>
  );
}
