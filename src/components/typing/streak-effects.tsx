"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const STREAK_TIERS = [
  { min: 5, label: "", color: "text-accent", particles: 2, shake: 0 },
  { min: 10, label: "Nice!", color: "text-accent", particles: 3, shake: 0 },
  { min: 25, label: "Great!", color: "text-accent-hover", particles: 5, shake: 1 },
  { min: 50, label: "Amazing!", color: "text-ink-error", particles: 7, shake: 1 },
  { min: 100, label: "GODLIKE!", color: "text-ink-error", particles: 10, shake: 1.5 },
] as const;

function getTier(streak: number) {
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TIERS[i].min) return STREAK_TIERS[i];
  }
  return null;
}

// Warm typewriter-themed particle colors
const PARTICLE_COLORS = [
  ["#c89b3c", "#d4a84c", "#b8892e"], // amber (5+)
  ["#c89b3c", "#d4a84c", "#e8c36a"], // bright amber (10+)
  ["#d4a84c", "#e8c36a", "#f0d890"], // gold (25+)
  ["#c45a4a", "#d4704a", "#c89b3c"], // warm red-amber (50+)
  ["#c45a4a", "#d4704a", "#e8c36a", "#f0d890"], // fire (100+)
];

function getParticleColors(streak: number): string[] {
  if (streak >= 100) return PARTICLE_COLORS[4];
  if (streak >= 50) return PARTICLE_COLORS[3];
  if (streak >= 25) return PARTICLE_COLORS[2];
  if (streak >= 10) return PARTICLE_COLORS[1];
  return PARTICLE_COLORS[0];
}

export function StreakEffects({
  streak,
  containerRef,
  shakeEnabled = true,
}: {
  streak: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  shakeEnabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const prevStreakRef = useRef(0);

  const spawnParticles = useCallback(
    (count: number, colors: string[]) => {
      const container = containerRef.current;
      if (!container) return;

      // Find the cursor element
      const cursor = container.querySelector("[data-cursor]");
      if (!cursor) return;

      const containerRect = container.getBoundingClientRect();
      const cursorRect = cursor.getBoundingClientRect();

      const cx = cursorRect.left - containerRect.left + cursorRect.width / 2;
      const cy = cursorRect.top - containerRect.top + cursorRect.height / 2;

      const maxParticles = 50;
      const spawnCount = Math.min(count, maxParticles - particlesRef.current.length);
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5, // bias upward
          life: 1,
          maxLife: 0.4 + Math.random() * 0.4,
          size: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    },
    [containerRef]
  );

  // Spawn particles on streak increase
  useEffect(() => {
    if (streak > prevStreakRef.current && streak >= 5) {
      const tier = getTier(streak);
      if (tier) {
        const colors = getParticleColors(streak);
        spawnParticles(tier.particles, colors);
      }
    }
    prevStreakRef.current = streak;
  }, [streak, spawnParticles]);

  // Screen shake
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tier = getTier(streak);
    if (!tier || tier.shake === 0 || !shakeEnabled) {
      container.style.transform = "";
      return;
    }

    if (streak > prevStreakRef.current || streak === prevStreakRef.current) {
      const intensity = tier.shake;
      const dx = (Math.random() - 0.5) * intensity * 2;
      const dy = (Math.random() - 0.5) * intensity * 2;
      container.style.transform = `translate(${dx}px, ${dy}px)`;
      const timeout = setTimeout(() => {
        container.style.transform = "";
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [streak, containerRef, shakeEnabled]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    function resizeCanvas() {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) observer.observe(containerRef.current);

    function animate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / p.maxLife;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 2 * dt; // gravity

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
    };
  }, [containerRef]);

  const tier = getTier(streak);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {tier && streak >= 5 && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none select-none">
          <div
            className={`flex flex-col items-end transition-all duration-150 ${tier.color}`}
          >
            <span
              className="font-bold font-typewriter tabular-nums"
              style={{
                fontSize: `${Math.min(1.2 + streak * 0.01, 2)}rem`,
                textShadow:
                  streak >= 50
                    ? "0 0 12px currentColor, 0 0 24px currentColor"
                    : streak >= 25
                      ? "0 0 8px currentColor"
                      : "none",
              }}
            >
              {streak}x
            </span>
            {tier.label && (
              <span
                className="text-xs font-semibold tracking-wider uppercase opacity-80"
                style={{
                  textShadow: streak >= 50 ? "0 0 8px currentColor" : "none",
                }}
              >
                {tier.label}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
