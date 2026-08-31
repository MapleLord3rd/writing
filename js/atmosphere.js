/* ============================================================
   ATMOSPHERE & THEME ENGINE — THE ARCHIVE
   Clean, modular architecture for Website Modes & Reading Themes
   High-performance GPU-friendly Canvas & CSS Visual Effects
   ============================================================ */

(function () {
  'use strict';

  // ——— Configuration Constants ———
  const STORAGE_KEY_MODE = 'website-mode';
  const STORAGE_KEY_THEME = 'reading-theme';

  const DEFAULT_MODE = 'dark';
  const DEFAULT_THEME = 'minimalist';

  // ——— SYSTEM 1: Website Atmosphere Modes ———
  const WEBSITE_MODES = {
    dark: {
      id: 'dark',
      name: 'Dark',
      icon: '🌑',
      desc: 'Sophisticated low-light charcoal environment with warm ambient dust',
      effect: 'dust'
    },
    magic: {
      id: 'magic',
      name: 'Magic',
      icon: '✨',
      desc: 'Cosmic twilight with glowing dust, sparkles & enchanted bursts',
      effect: 'magicParticles'
    },
    forest: {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      desc: 'Peaceful deep-green woods with falling canopy leaves',
      effect: 'leaves'
    },
    ocean: {
      id: 'ocean',
      name: 'Ocean',
      icon: '🌊',
      desc: 'Calm aquatic depths with rising translucent bubbles',
      effect: 'bubbles'
    },
    sunset: {
      id: 'sunset',
      name: 'Sunset',
      icon: '🌅',
      desc: 'Warm golden horizon with animated volumetric sunlight rays',
      effect: 'sunRays'
    },
    cosmos: {
      id: 'cosmos',
      name: 'Cosmos',
      icon: '🌌',
      desc: 'Deep-space starfield with parallax, shooting stars & distant asteroids',
      effect: 'cosmosSpace'
    },
    rain: {
      id: 'rain',
      name: 'Rain',
      icon: '🌧️',
      desc: 'Peaceful grey skies with continuous gentle rain streaks',
      effect: 'rain'
    },
    autumn: {
      id: 'autumn',
      name: 'Autumn',
      icon: '🍂',
      desc: 'Warm amber tones with swaying autumn leaves',
      effect: 'autumnLeaves'
    },
    winter: {
      id: 'winter',
      name: 'Winter',
      icon: '❄️',
      desc: 'Quiet frost with slow drifting snowflakes & wind gusts',
      effect: 'snow'
    },
    sakura: {
      id: 'sakura',
      name: 'Sakura',
      icon: '🌸',
      desc: 'Soft pink spring with drifting cherry blossoms',
      effect: 'petals'
    },
    vintage: {
      id: 'vintage',
      name: 'Vintage',
      icon: '📜',
      desc: 'Warm parchment, nostalgic film grain, dust & subtle scratches',
      effect: 'vintageFilm'
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight',
      icon: '🌙',
      desc: 'Deep navy night with moonlit starfield and celestial calm',
      effect: 'midnightSky'
    }
  };

  // ——— SYSTEM 2: Reading Themes ———
  const READING_THEMES = {
    minimalist: {
      id: 'minimalist',
      name: 'Minimalist',
      icon: '◻️',
      desc: 'Clean neutral background with maximum focus on prose'
    },
    paper: {
      id: 'paper',
      name: 'Paper',
      icon: '📜',
      desc: 'Warm textured sheet of paper with soft natural shadows'
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight',
      icon: '🌙',
      desc: 'Dark navy reading surface with gentle starlight'
    },
    library: {
      id: 'library',
      name: 'Library',
      icon: '📚',
      desc: 'Warm dark-brown wood with soft reading-lamp glow'
    },
    typewriter: {
      id: 'typewriter',
      name: 'Typewriter',
      icon: '⌨️',
      desc: 'Aged manuscript paper with monospace type'
    },
    forest: {
      id: 'forest',
      name: 'Forest',
      icon: '🌿',
      desc: 'Natural green surface with gentle leaf accents'
    },
    dream: {
      id: 'dream',
      name: 'Dream',
      icon: '🌌',
      desc: 'Soft purple/pink gradients with floating light'
    },
    ink: {
      id: 'ink',
      name: 'Ink & Quill',
      icon: '🖋️',
      desc: 'Classic parchment with subtle ink calligraphy details'
    }
  };

  const ATMOSPHERE_EFFECTS = {
    dark: 'dust',
    magic: 'magicParticles',
    forest: 'leaves',
    ocean: 'bubbles',
    sunset: 'sunRays',
    cosmos: 'cosmosSpace',
    rain: 'rain',
    autumn: 'autumnLeaves',
    winter: 'snow',
    sakura: 'petals',
    vintage: 'vintageFilm',
    midnight: 'midnightSky'
  };

  // ——— Atmosphere Engine ———
  class AtmosphereEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.elementsContainer = null;
      this.activeEffect = null;
      this.currentMode = DEFAULT_MODE;
      this.animationFrameId = null;
      this.particles = [];
      this.meteors = [];
      this.bursts = [];
      this.asteroids = [];
      this.sunRays = [];
      this.isPaused = false;
      this.reducedMotion = false;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.lastTime = 0;

      // Effect registries
      this.effectRenderers = {};
      this.initEffectRenderers();
    }

    init(canvasId = 'atmosphereCanvas', elementsContainerId = 'atmosphereElements') {
      this.canvas = document.getElementById(canvasId);
      this.elementsContainer = document.getElementById(elementsContainerId);

      if (!this.canvas) {
        console.warn('Atmosphere canvas not found');
        return;
      }

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.checkReducedMotion();
      this.handleResize();

      window.addEventListener('resize', () => this.handleResize(), { passive: true });

      // Pause when tab is inactive to preserve CPU / battery
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });

      // Watch prefers-reduced-motion preference changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
          this.reducedMotion = e.matches;
          if (this.activeEffect) {
            this.setEffect(this.activeEffect, this.currentMode);
          }
        });
      }
    }

    checkReducedMotion() {
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    handleResize() {
      if (!this.canvas) return;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      if (this.ctx) {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }

      // Re-seed particles if currently running
      if (this.activeEffect && this.effectRenderers[this.activeEffect]?.init) {
        this.effectRenderers[this.activeEffect].init(this);
      }
    }

    pause() {
      this.isPaused = true;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    resume() {
      if (!this.isPaused) return;
      this.isPaused = false;
      if (this.activeEffect) {
        this.loop(performance.now());
      }
    }

    setEffect(effectName, modeId) {
      // 1. Cancel existing animation frame
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // 2. Clear canvas and containers
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
      if (this.elementsContainer) {
        this.elementsContainer.innerHTML = '';
      }

      // 3. Reset state arrays
      this.particles = [];
      this.meteors = [];
      this.bursts = [];
      this.asteroids = [];
      this.sunRays = [];
      this.activeEffect = effectName;
      this.currentMode = modeId;

      if (!effectName || this.reducedMotion) {
        return;
      }

      const renderer = this.effectRenderers[effectName];
      if (renderer && renderer.init) {
        renderer.init(this);
      }

      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }

    loop(currentTime) {
      if (this.isPaused || !this.activeEffect) return;

      const dt = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
      this.lastTime = currentTime;

      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const renderer = this.effectRenderers[this.activeEffect];
        if (renderer && renderer.updateAndDraw) {
          renderer.updateAndDraw(this, dt);
        }
      }

      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    // ——— Effect Renderers Registry ———
    initEffectRenderers() {

      // ============================================================
      // 1. DUST PARTICLES (Dark Mode & Base Ambient)
      // ============================================================
      this.effectRenderers.dust = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 18 : 36;
          engine.particles = [];

          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 1.5 + 0.5,
              opacity: Math.random() * 0.35 + 0.1,
              baseOpacity: Math.random() * 0.35 + 0.1,
              dx: (Math.random() - 0.5) * 0.15,
              dy: (Math.random() - 0.5) * 0.15 - 0.05,
              pulseSpeed: Math.random() * 0.8 + 0.4,
              pulseOffset: Math.random() * Math.PI * 2
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;
          const color = '230, 225, 215';

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx;
            p.y += p.dy;

            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            if (p.y < -10) p.y = engine.height + 10;
            if (p.y > engine.height + 10) p.y = -10;

            const currentOpacity = p.baseOpacity * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed + p.pulseOffset));

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${currentOpacity})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(${color}, ${currentOpacity * 0.5})`;
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }
      };

      // ============================================================
      // 2. MAGIC ENCHANTED ENVIRONMENT (Magic Mode)
      // Living enchanted atmosphere: luminous ambient mana motes + active supernatural events
      // ============================================================
      this.effectRenderers.magicParticles = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const moteCount = isMobile ? 22 : 38;
          engine.particles = [];
          engine.events = [];
          engine.sparkles = [];

          // 1. Continuous Enchanted Mana Motes & Stardust
          const manaHues = [
            '192, 132, 252', // Ethereal purple
            '236, 72, 153',  // Fuchsia mana
            '56, 189, 248',  // Arcane cyan
            '251, 191, 36',  // Starlight gold
            '168, 85, 247'   // Deep violet
          ];

          for (let i = 0; i < moteCount; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 2.2 + 0.8,
              color: manaHues[i % manaHues.length],
              baseOpacity: Math.random() * 0.45 + 0.25,
              dx: (Math.random() - 0.5) * 0.25,
              dy: -(Math.random() * 0.45 + 0.15), // gentle upward float
              swayFreq: Math.random() * 0.8 + 0.3,
              swayAmp: Math.random() * 20 + 8,
              pulseSpeed: Math.random() * 0.9 + 0.4,
              pulseOffset: Math.random() * Math.PI * 2
            });
          }

          // Trigger first supernatural manifestation almost immediately (0.8s)
          engine.eventTimer = performance.now() + 800;
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          // 1. Soft Atmospheric Magic Glow
          const cx = engine.width * 0.5;
          const cy = engine.height * 0.4;
          const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(engine.width, engine.height) * 0.65);
          glowGrad.addColorStop(0, 'rgba(192, 132, 252, 0.06)');
          glowGrad.addColorStop(0.35, 'rgba(236, 72, 153, 0.03)');
          glowGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.015)');
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save();
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.rect(0, 0, engine.width, engine.height);
          ctx.fill();
          ctx.restore();

          // 2. Render Continuous Mana Motes
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.y += p.dy;
            p.x += p.dx + Math.sin(time * p.swayFreq + i) * 0.35;

            // Loop smoothly around boundaries
            if (p.y < -15) {
              p.y = engine.height + 15;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -15) p.x = engine.width + 15;
            if (p.x > engine.width + 15) p.x = -15;

            const pulse = 0.65 + 0.35 * Math.sin(time * p.pulseSpeed + p.pulseOffset);
            const currentOpacity = p.baseOpacity * pulse;

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${currentOpacity})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${p.color}, ${currentOpacity * 0.8})`;
            ctx.fill();

            // Specular core on larger mana sparks
            if (p.r > 1.8) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.9})`;
              ctx.fill();
            }
            ctx.restore();
          }

          // 3. Supernatural Event Scheduler (Active, visible manifestations)
          if (performance.now() > engine.eventTimer && engine.events.length < 2) {
            const eventTypes = ['circle', 'rune', 'passingSpell', 'glyphs', 'fireflies', 'ripple', 'burst', 'orb'];
            const chosen = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const x = Math.random() * (engine.width * 0.7) + engine.width * 0.15;
            const y = Math.random() * (engine.height * 0.6) + engine.height * 0.2;
            const size = Math.random() * 70 + 60;
            const rotate = Math.random() * Math.PI * 2;
            const duration = 6000 + Math.random() * 5000;

            // Next event in 2.5 - 5 seconds
            engine.eventTimer = performance.now() + 3000 + Math.random() * 2500;

            const magicColors = [
              { stroke: '#c084fc', fill: 'rgba(192, 132, 252, 0.18)', glow: '#c084fc' },
              { stroke: '#f472b6', fill: 'rgba(244, 114, 182, 0.18)', glow: '#f472b6' },
              { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.18)', glow: '#38bdf8' },
              { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.18)', glow: '#fbbf24' }
            ];
            const col = magicColors[Math.floor(Math.random() * magicColors.length)];

            engine.events.push({
              type: chosen, x, y, size, rotate,
              birth: performance.now(), life: duration,
              fadeIn: 1200, fadeOut: 1800, progress: 0,
              col
            });
          }

          // 4. Render Active Supernatural Events
          for (let e = engine.events.length - 1; e >= 0; e--) {
            const ev = engine.events[e];
            const elapsed = performance.now() - ev.birth;
            ev.progress = Math.min(1, elapsed / ev.life);

            // Smooth fade in and fade out envelope
            const fadeInFactor = Math.min(1, elapsed / ev.fadeIn);
            const remaining = ev.life - elapsed;
            const fadeOutFactor = Math.max(0, Math.min(1, remaining / ev.fadeOut));
            const opacity = fadeInFactor * fadeOutFactor * 0.88;

            if (opacity <= 0.01 || ev.progress >= 1) {
              engine.events.splice(e, 1);
              continue;
            }

            ctx.save();
            ctx.translate(ev.x, ev.y);
            ctx.globalAlpha = opacity;

            if (ev.type === 'circle') {
              // Detailed Arcane Magic Circle with rotating rings & runes
              ctx.rotate(ev.rotate + time * 0.15);
              ctx.strokeStyle = ev.col.stroke;
              ctx.fillStyle = ev.col.fill;
              ctx.shadowBlur = 14;
              ctx.shadowColor = ev.col.glow;

              // Outer Ring
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(0, 0, ev.size * 0.5, 0, Math.PI * 2);
              ctx.stroke();

              // Inner Ring
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.arc(0, 0, ev.size * 0.38, 0, Math.PI * 2);
              ctx.stroke();

              // Rotating Triangle / Star Inscription
              const points = 6;
              ctx.beginPath();
              for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2 + time * 0.1;
                const r = i % 2 === 0 ? ev.size * 0.38 : ev.size * 0.22;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.stroke();
              ctx.fill();

              // Glowing Central Sigil
              ctx.fillStyle = '#ffffff';
              ctx.font = `${Math.round(ev.size * 0.24)}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✦', 0, 0);

            } else if (ev.type === 'rune') {
              // Glowing Ancient Runic Glyph
              ctx.rotate(ev.rotate + Math.sin(time * 0.5) * 0.1);
              ctx.strokeStyle = ev.col.stroke;
              ctx.fillStyle = ev.col.fill;
              ctx.lineWidth = 2.0;
              ctx.shadowBlur = 16;
              ctx.shadowColor = ev.col.glow;

              // Diamond Frame
              const s = ev.size * 0.35;
              ctx.beginPath();
              ctx.moveTo(0, -s);
              ctx.lineTo(s * 0.8, 0);
              ctx.lineTo(0, s);
              ctx.lineTo(-s * 0.8, 0);
              ctx.closePath();
              ctx.stroke();
              ctx.fill();

              // Center Rune Symbol
              ctx.fillStyle = '#ffffff';
              ctx.font = `${Math.round(ev.size * 0.32)}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const runes = ['ᛟ', 'ᚱ', 'ᚨ', 'ᚦ', 'ᛏ', 'ᛒ'];
              ctx.fillText(runes[Math.floor(ev.rotate * 10) % runes.length], 0, 0);

            } else if (ev.type === 'passingSpell') {
              // Sweeping Comet-like Magic Arc
              const trailProgress = ev.progress;
              const arcX = Math.cos(trailProgress * Math.PI) * (ev.size * 1.4);
              const arcY = Math.sin(trailProgress * Math.PI) * (ev.size * 0.7);

              ctx.strokeStyle = ev.col.stroke;
              ctx.lineWidth = 3.0;
              ctx.shadowBlur = 18;
              ctx.shadowColor = ev.col.glow;

              ctx.beginPath();
              ctx.arc(0, 0, ev.size * 0.7, 0, trailProgress * Math.PI * 2);
              ctx.stroke();

              // Glowing Spell Head
              ctx.beginPath();
              ctx.arc(arcX, arcY, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();

            } else if (ev.type === 'glyphs') {
              // Ethereal Floating Glyphs
              const glyphChars = ['✧', '✦', 'ᛟ', 'ᚱ', '✦'];
              ctx.font = '20px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowBlur = 12;
              ctx.shadowColor = ev.col.glow;

              for (let g = 0; g < glyphChars.length; g++) {
                const gx = (g - 2) * (ev.size * 0.28) + Math.sin(time * 1.5 + g) * 6;
                const gy = -ev.progress * 40 + Math.cos(time + g) * 8;
                ctx.fillStyle = ev.col.stroke;
                ctx.fillText(glyphChars[g], gx, gy);
              }

            } else if (ev.type === 'fireflies') {
              // Dancing Whispering Wisps
              const count = 7;
              for (let f = 0; f < count; f++) {
                const fx = Math.sin(time * 1.4 + f * 1.2) * (ev.size * 0.5);
                const fy = Math.cos(time * 1.1 + f * 0.9) * (ev.size * 0.4);
                const fr = 2.5 + Math.sin(time * 3 + f) * 1.0;

                ctx.save();
                ctx.beginPath();
                ctx.arc(fx, fy, fr, 0, Math.PI * 2);
                ctx.fillStyle = ev.col.stroke;
                ctx.shadowBlur = 14;
                ctx.shadowColor = ev.col.glow;
                ctx.fill();

                // Core glint
                ctx.beginPath();
                ctx.arc(fx, fy, fr * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.restore();
              }

            } else if (ev.type === 'ripple') {
              // Dimensional Arcane Energy Pulse
              const r = ev.size * 0.5 * ev.progress;
              ctx.strokeStyle = ev.col.stroke;
              ctx.lineWidth = 2.2 * (1 - ev.progress * 0.5);
              ctx.shadowBlur = 15;
              ctx.shadowColor = ev.col.glow;

              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.stroke();

              // Secondary faint ripple
              if (r > 15) {
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
                ctx.stroke();
              }

            } else if (ev.type === 'burst') {
              // Radiant Starlight Bloom
              const rays = 12;
              const fr = ev.size * 0.45 * Math.sin(ev.progress * Math.PI);
              ctx.fillStyle = ev.col.stroke;
              ctx.shadowBlur = 14;
              ctx.shadowColor = ev.col.glow;

              for (let p = 0; p < rays; p++) {
                const angle = (p / rays) * Math.PI * 2 + time * 0.2;
                const px = Math.cos(angle) * fr;
                const py = Math.sin(angle) * fr;

                ctx.beginPath();
                ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }

            } else if (ev.type === 'orb') {
              // Luminous Wandering Mana Orb with Satellites
              const ox = Math.sin(time * 0.7) * (ev.size * 0.4);
              const oy = Math.cos(time * 0.5) * (ev.size * 0.25);

              ctx.beginPath();
              ctx.arc(ox, oy, 7, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 20;
              ctx.shadowColor = ev.col.glow;
              ctx.fill();

              // Outer halo
              ctx.beginPath();
              ctx.arc(ox, oy, 14, 0, Math.PI * 2);
              ctx.fillStyle = ev.col.fill;
              ctx.fill();

              // Orbiting tiny sparks
              for (let s = 0; s < 3; s++) {
                const sAngle = time * 2.5 + (s / 3) * Math.PI * 2;
                const sx = ox + Math.cos(sAngle) * 16;
                const sy = oy + Math.sin(sAngle) * 16;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = ev.col.stroke;
                ctx.fill();
              }
            }

            ctx.restore();
          }
        }
      };
      // 3. CANOPY LEAVES (Forest Mode)
      // ============================================================
      this.effectRenderers.leaves = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 14 : 26;
          engine.particles = [];

          const leafColors = [
            'rgba(34, 197, 94, 0.65)',   // vibrant green
            'rgba(74, 222, 128, 0.60)',  // soft spring green
            'rgba(21, 128, 61, 0.70)',   // deep forest emerald
            'rgba(163, 230, 53, 0.55)'   // lime glint
          ];

          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 4 + 2.5,
              dx: Math.random() * 0.4 + 0.2,
              dy: Math.random() * 0.6 + 0.3, // slow gentle fall
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.03,
              swayFreq: Math.random() * 0.8 + 0.4,
              swayAmp: Math.random() * 0.6 + 0.3,
              swayOffset: Math.random() * Math.PI * 2,
              color: leafColors[i % leafColors.length]
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx + Math.sin(time * p.swayFreq + p.swayOffset) * p.swayAmp;
            p.y += p.dy;
            p.rot += p.rotSpeed;

            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x > engine.width + 20) p.x = -20;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 4. AQUATIC BUBBLES (Ocean Mode)
      // ============================================================
      this.effectRenderers.bubbles = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 18 : 34;
          engine.particles = [];

          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 3.5 + 1.2,
              dy: -(Math.random() * 0.7 + 0.35),
              wobbleFreq: Math.random() * 1.2 + 0.6,
              wobbleAmp: Math.random() * 0.8 + 0.3,
              wobbleOffset: Math.random() * Math.PI * 2,
              opacity: Math.random() * 0.5 + 0.3
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.y += p.dy;
            p.x += Math.sin(time * p.wobbleFreq + p.wobbleOffset) * 0.35;

            if (p.y < -20) {
              p.y = engine.height + 20;
              p.x = Math.random() * engine.width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);

            // Bubble body
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity * 0.15})`;
            ctx.fill();

            // Bubble rim highlight
            ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.75})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Specular reflection glint
            ctx.beginPath();
            ctx.arc(-p.r * 0.32, -p.r * 0.32, Math.max(0.6, p.r * 0.24), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.85})`;
            ctx.fill();

            ctx.restore();
          }
        }
      };

      // ============================================================
      // 5. VOLUMETRIC SUNLIGHT RAYS & DUSK MOTES (Sunset Mode)
      // Warm golden hour sunlight radiating from the top right with soft motes
      // ============================================================
      this.effectRenderers.sunRays = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const moteCount = isMobile ? 22 : 40;
          engine.particles = [];

          const moteColors = ['251, 146, 60', '245, 158, 11', '244, 63, 94', '254, 215, 170'];
          for (let i = 0; i < moteCount; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 2.2 + 0.9,
              color: moteColors[i % moteColors.length],
              baseOpacity: Math.random() * 0.4 + 0.2,
              dx: -(Math.random() * 0.35 + 0.1), // gentle drift down and to the left
              dy: Math.random() * 0.35 + 0.15,
              pulseSpeed: Math.random() * 0.8 + 0.3,
              pulseOffset: Math.random() * Math.PI * 2,
              swayFreq: Math.random() * 0.6 + 0.25,
              swayAmp: Math.random() * 12 + 4
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          // 1. Soft radial golden sunlight wash originating from the TOP RIGHT
          const cx = engine.width * 0.92;
          const cy = -20;
          const maxDist = Math.hypot(engine.width, engine.height) * 0.95;

          const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
          glowGrad.addColorStop(0, 'rgba(251, 146, 60, 0.14)');
          glowGrad.addColorStop(0.25, 'rgba(245, 158, 11, 0.09)');
          glowGrad.addColorStop(0.55, 'rgba(244, 63, 94, 0.04)');
          glowGrad.addColorStop(0.85, 'rgba(147, 51, 234, 0.015)');
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.save();
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.rect(0, 0, engine.width, engine.height);
          ctx.fill();
          ctx.restore();

          // 2. Angled Volumetric Golden Light Rays from Top-Right down-left
          const swayX = Math.sin(time * 0.35) * 30;
          const rayOriginX = cx + swayX;
          const rayOriginY = cy;

          ctx.save();
          // Primary broad golden beam
          const beamGrad = ctx.createLinearGradient(rayOriginX, rayOriginY, engine.width * 0.3, engine.height * 0.85);
          beamGrad.addColorStop(0, 'rgba(251, 146, 60, 0.12)');
          beamGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.07)');
          beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(rayOriginX - 80, rayOriginY);
          ctx.lineTo(rayOriginX + 160, rayOriginY);
          ctx.lineTo(engine.width * 0.45 + 180, engine.height);
          ctx.lineTo(engine.width * 0.15 - 50, engine.height);
          ctx.closePath();
          ctx.fill();

          // Secondary soft ambient ray
          const beamGrad2 = ctx.createLinearGradient(rayOriginX + 50, rayOriginY, engine.width * 0.6, engine.height * 0.9);
          beamGrad2.addColorStop(0, 'rgba(254, 215, 170, 0.09)');
          beamGrad2.addColorStop(0.5, 'rgba(249, 115, 22, 0.04)');
          beamGrad2.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = beamGrad2;
          ctx.beginPath();
          ctx.moveTo(rayOriginX + 30, rayOriginY);
          ctx.lineTo(rayOriginX + 220, rayOriginY);
          ctx.lineTo(engine.width * 0.75 + 100, engine.height);
          ctx.lineTo(engine.width * 0.5 - 30, engine.height);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // 3. Golden dusk motes drifting through the sunlight
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx + Math.sin(time * p.swayFreq + i) * 0.35;
            p.y += p.dy + Math.sin(time * 0.5 + i * 0.7) * 0.2;

            if (p.x < -15) { p.x = engine.width + 15; p.y = Math.random() * engine.height; }
            if (p.y > engine.height + 15) { p.y = -15; p.x = Math.random() * engine.width; }

            const opacity = Math.max(0.1, p.baseOpacity * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed + p.pulseOffset)));
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${p.color}, ${opacity * 0.8})`;
            ctx.fill();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 6. COSMOS LIVING SPACE SCENE (Cosmos Mode)
      // Depth parallax starfield, twinkling stars, multi-directional shooting stars, & large realistic asteroids
      // ============================================================
      this.effectRenderers.cosmosSpace = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const starCount = isMobile ? 45 : 85;
          engine.particles = [];
          engine.meteors = [];
          engine.meteorSparks = [];
          engine.asteroids = [];

          // 1. Layered Parallax Starfield
          for (let i = 0; i < starCount; i++) {
            const depth = Math.random(); // 0 = distant tiny, 1 = bright foreground
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: depth > 0.85 ? Math.random() * 1.6 + 1.1 : Math.random() * 0.9 + 0.4,
              depth,
              dx: (depth * 0.04 + 0.01), // subtle slow cosmic drift
              twinkleSpeed: Math.random() * 1.5 + 0.5,
              twinkleOffset: Math.random() * Math.PI * 2,
              hasFlare: depth > 0.90
            });
          }

          // 2. Large Realistic Asteroids with Pseudo-Fixed Majestic Orbital Drifting
          const asteroidConfigs = isMobile ? [
            { anchorXRatio: 0.15, anchorYRatio: 0.22, baseRadius: 48, orbitRx: 28, orbitRy: 18, orbitSpeed: 0.045, rotSpeed: 0.005, isLarge: true },
            { anchorXRatio: 0.85, anchorYRatio: 0.68, baseRadius: 36, orbitRx: 30, orbitRy: 20, orbitSpeed: 0.035, rotSpeed: -0.007, isLarge: true },
            { anchorXRatio: 0.70, anchorYRatio: 0.15, baseRadius: 22, orbitRx: 20, orbitRy: 14, orbitSpeed: 0.060, rotSpeed: 0.009, isLarge: false }
          ] : [
            { anchorXRatio: 0.14, anchorYRatio: 0.24, baseRadius: 84, orbitRx: 55, orbitRy: 35, orbitSpeed: 0.038, rotSpeed: 0.004, isLarge: true },
            { anchorXRatio: 0.86, anchorYRatio: 0.65, baseRadius: 65, orbitRx: 45, orbitRy: 28, orbitSpeed: 0.030, rotSpeed: -0.006, isLarge: true },
            { anchorXRatio: 0.72, anchorYRatio: 0.18, baseRadius: 42, orbitRx: 35, orbitRy: 22, orbitSpeed: 0.050, rotSpeed: 0.008, isLarge: true },
            { anchorXRatio: 0.32, anchorYRatio: 0.82, baseRadius: 28, orbitRx: 30, orbitRy: 18, orbitSpeed: 0.042, rotSpeed: -0.010, isLarge: false },
            { anchorXRatio: 0.52, anchorYRatio: 0.08, baseRadius: 20, orbitRx: 25, orbitRy: 15, orbitSpeed: 0.065, rotSpeed: 0.012, isLarge: false }
          ];

          engine.asteroids = asteroidConfigs.map((cfg, idx) => {
            const numVerts = cfg.isLarge ? 18 : 12;
            const vertices = [];
            const seed = Math.random() * 100;
            for (let v = 0; v < numVerts; v++) {
              const angle = (v / numVerts) * Math.PI * 2;
              const noise = 0.82 + 0.18 * Math.sin(angle * 3 + seed) + 0.09 * Math.cos(angle * 5 + seed * 1.5);
              vertices.push({
                x: Math.cos(angle) * cfg.baseRadius * noise,
                y: Math.sin(angle) * cfg.baseRadius * noise
              });
            }

            // Realistic 3D Surface Craters
            const craters = [];
            if (cfg.isLarge) {
              const craterCount = cfg.baseRadius > 60 ? 5 : 3;
              for (let c = 0; c < craterCount; c++) {
                const cAngle = Math.random() * Math.PI * 2;
                const cDist = Math.random() * (cfg.baseRadius * 0.65);
                craters.push({
                  cx: Math.cos(cAngle) * cDist,
                  cy: Math.sin(cAngle) * cDist,
                  cr: Math.random() * (cfg.baseRadius * 0.18) + (cfg.baseRadius * 0.08)
                });
              }
            }

            // Surface Geological Ridge Lines
            const ridges = [];
            if (cfg.isLarge) {
              for (let r = 0; r < 2; r++) {
                ridges.push({
                  x1: (Math.random() - 0.5) * cfg.baseRadius * 0.8,
                  y1: (Math.random() - 0.5) * cfg.baseRadius * 0.8,
                  x2: (Math.random() - 0.5) * cfg.baseRadius * 0.8,
                  y2: (Math.random() - 0.5) * cfg.baseRadius * 0.8
                });
              }
            }

            return {
              anchorXRatio: cfg.anchorXRatio,
              anchorYRatio: cfg.anchorYRatio,
              baseRadius: cfg.baseRadius,
              orbitRx: cfg.orbitRx,
              orbitRy: cfg.orbitRy,
              orbitSpeed: cfg.orbitSpeed,
              orbitPhase: (idx / asteroidConfigs.length) * Math.PI * 2,
              rotSpeed: cfg.rotSpeed,
              rot: Math.random() * Math.PI * 2,
              vertices,
              craters,
              ridges,
              isLarge: cfg.isLarge,
              opacity: 0.95
            };
          });

          // Schedule first shooting star quickly (1.2 - 2.5 seconds after entering mode)
          engine.nextMeteorTime = performance.now() + 1200 + Math.random() * 1300;
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          // 1. Render Starfield
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx;
            if (p.x > engine.width + 5) p.x = -5;

            const twinkle = Math.pow(Math.sin(time * p.twinkleSpeed + p.twinkleOffset), 4);
            const currentOpacity = 0.2 + 0.8 * twinkle;

            ctx.save();
            ctx.fillStyle = '#eae4f8';
            ctx.globalAlpha = currentOpacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            // 4-point glint on bright prominent stars
            if (p.hasFlare && twinkle > 0.65) {
              ctx.strokeStyle = `rgba(167, 139, 250, ${twinkle * 0.75})`;
              ctx.lineWidth = 0.8;
              const len = p.r * 2.8;
              ctx.beginPath();
              ctx.moveTo(p.x - len, p.y);
              ctx.lineTo(p.x + len);
              ctx.moveTo(p.x, p.y - len);
              ctx.lineTo(p.x, p.y + len);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 2. Render Large Realistic Asteroids with Pseudo-Fixed Orbital Motion
          for (let a = 0; a < engine.asteroids.length; a++) {
            const ast = engine.asteroids[a];

            // Pseudo-fixed majestic orbital floating around anchor
            const anchorX = engine.width * ast.anchorXRatio;
            const anchorY = engine.height * ast.anchorYRatio;
            const posX = anchorX + Math.cos(time * ast.orbitSpeed + ast.orbitPhase) * ast.orbitRx;
            const posY = anchorY + Math.sin(time * ast.orbitSpeed * 0.7 + ast.orbitPhase) * ast.orbitRy;
            ast.rot += ast.rotSpeed;

            ctx.save();
            ctx.translate(posX, posY);
            ctx.rotate(ast.rot);

            // Soft ambient cosmic back-glow on lit silhouette
            ctx.shadowBlur = ast.isLarge ? 18 : 8;
            ctx.shadowColor = 'rgba(196, 181, 253, 0.45)';

            // Realistic directional 3D spherical shading (starlight from top-left)
            const grad = ctx.createRadialGradient(
              -ast.baseRadius * 0.35, -ast.baseRadius * 0.35, ast.baseRadius * 0.1,
              0, 0, ast.baseRadius * 1.15
            );
            grad.addColorStop(0, '#94a3b8');               // Bright highlit face
            grad.addColorStop(0.35, '#475569');            // Mid rocky tone
            grad.addColorStop(0.70, '#1e1b4b');            // Deep cosmic indigo shadow
            grad.addColorStop(1, '#090d16');               // Dark umbra side

            ctx.fillStyle = grad;
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)'; // Starlight rim reflection
            ctx.lineWidth = ast.isLarge ? 1.5 : 1.0;

            // Draw smooth organic craggy polygon
            ctx.beginPath();
            if (ast.vertices && ast.vertices.length > 0) {
              const verts = ast.vertices;
              ctx.moveTo(verts[0].x, verts[0].y);
              for (let v = 0; v < verts.length; v++) {
                const next = verts[(v + 1) % verts.length];
                const midX = (verts[v].x + next.x) * 0.5;
                const midY = (verts[v].y + next.y) * 0.5;
                ctx.quadraticCurveTo(verts[v].x, verts[v].y, midX, midY);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }

            // Draw 3D Illuminated Surface Craters
            if (ast.craters) {
              for (let c = 0; c < ast.craters.length; c++) {
                const cr = ast.craters[c];

                // Inner crater shadow bowl
                ctx.save();
                ctx.beginPath();
                ctx.arc(cr.cx, cr.cy, cr.cr, 0, Math.PI * 2);
                ctx.fillStyle = '#090d16';
                ctx.fill();

                // Raised illuminated crater rim crescent (facing top-left light)
                ctx.beginPath();
                ctx.arc(cr.cx - cr.cr * 0.15, cr.cy - cr.cr * 0.15, cr.cr * 0.9, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)';
                ctx.lineWidth = 1.0;
                ctx.stroke();
                ctx.restore();
              }
            }

            // Draw Surface Geological Ridge Lines
            if (ast.ridges) {
              ctx.save();
              ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
              ctx.lineWidth = 1.0;
              for (let r = 0; r < ast.ridges.length; r++) {
                const rd = ast.ridges[r];
                ctx.beginPath();
                ctx.moveTo(rd.x1, rd.y1);
                ctx.lineTo(rd.x2, rd.y2);
                ctx.stroke();
              }
              ctx.restore();
            }

            ctx.restore();
          }

          // 3. Multi-Directional Shooting Stars (Diverse spawn zones & trajectory angles)
          if (performance.now() > engine.nextMeteorTime && engine.meteors.length === 0) {
            // Next meteor in 4.5 - 8.0 seconds
            engine.nextMeteorTime = performance.now() + 4500 + Math.random() * 3500;

            // Choose from 4 diverse trajectory patterns across the sky
            const trajectoryType = Math.floor(Math.random() * 4);
            let startX, startY, angle;

            if (trajectoryType === 0) {
              // Top-Left to Down-Right
              startX = Math.random() * (engine.width * 0.45) - 20;
              startY = Math.random() * (engine.height * 0.25) - 20;
              angle = 0.55 + Math.random() * 0.25; // ~32° to 46° down-right
            } else if (trajectoryType === 1) {
              // Top-Right to Down-Left
              startX = Math.random() * (engine.width * 0.45) + (engine.width * 0.55);
              startY = Math.random() * (engine.height * 0.25) - 20;
              angle = Math.PI - (0.55 + Math.random() * 0.25); // ~134° to 148° down-left
            } else if (trajectoryType === 2) {
              // Left Horizon sweep
              startX = -20;
              startY = Math.random() * (engine.height * 0.35);
              angle = 0.35 + Math.random() * 0.22; // ~20° to 33° shallow sweep
            } else {
              // Right Horizon sweep
              startX = engine.width + 20;
              startY = Math.random() * (engine.height * 0.35);
              angle = Math.PI - (0.35 + Math.random() * 0.22); // ~147° to 160° shallow sweep
            }

            const speed = Math.random() * 10 + 16;
            const length = Math.random() * 120 + 220; // Long, striking tail (220 - 340px)

            // Dynamic cosmic color tints
            const colorPalettes = [
              { trail: '192, 132, 252', core: '255, 255, 255', glow: '#c084fc' }, // Violet / White
              { trail: '56, 189, 248',  core: '255, 255, 255', glow: '#38bdf8' }, // Starlight Cyan
              { trail: '244, 114, 182', core: '255, 255, 255', glow: '#f472b6' }, // Cosmic Rose
              { trail: '251, 191, 36',  core: '255, 255, 255', glow: '#fbbf24' }  // Golden Stardust
            ];
            const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

            engine.meteors.push({
              x: startX,
              y: startY,
              dx: Math.cos(angle) * speed,
              dy: Math.sin(angle) * speed,
              angle,
              length,
              palette,
              life: 1.0,
              decay: 0.90 // ~1.15s sweep across the sky
            });
          }

          // Render active meteor sparks
          if (engine.meteorSparks) {
            for (let s = engine.meteorSparks.length - 1; s >= 0; s--) {
              const spk = engine.meteorSparks[s];
              spk.life -= dt * 2.2;
              spk.x += spk.dx;
              spk.y += spk.dy;
              if (spk.life <= 0) {
                engine.meteorSparks.splice(s, 1);
                continue;
              }
              ctx.save();
              ctx.beginPath();
              ctx.arc(spk.x, spk.y, spk.r * spk.life, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${spk.color}, ${spk.life * 0.9})`;
              ctx.shadowBlur = 6;
              ctx.shadowColor = '#ffffff';
              ctx.fill();
              ctx.restore();
            }
          }

          // Draw active meteor
          for (let m = engine.meteors.length - 1; m >= 0; m--) {
            const met = engine.meteors[m];
            met.x += met.dx;
            met.y += met.dy;
            met.life -= dt * met.decay;

            // Spawn trailing spark particles
            if (engine.meteorSparks && Math.random() < 0.65) {
              engine.meteorSparks.push({
                x: met.x + (Math.random() - 0.5) * 6,
                y: met.y + (Math.random() - 0.5) * 6,
                dx: -Math.cos(met.angle) * (Math.random() * 2 + 1),
                dy: -Math.sin(met.angle) * (Math.random() * 2 + 1),
                r: Math.random() * 1.8 + 0.8,
                color: met.palette.trail,
                life: 1.0
              });
            }

            if (met.life <= 0 || met.x < -100 || met.x > engine.width + 150 || met.y > engine.height + 150) {
              engine.meteors.splice(m, 1);
              continue;
            }

            const tailX = met.x - Math.cos(met.angle) * met.length;
            const tailY = met.y - Math.sin(met.angle) * met.length;

            ctx.save();

            // Pass 1: Wide diffuse bloom trail
            const bloomGrad = ctx.createLinearGradient(tailX, tailY, met.x, met.y);
            bloomGrad.addColorStop(0, `rgba(${met.palette.trail}, 0)`);
            bloomGrad.addColorStop(0.5, `rgba(${met.palette.trail}, ${met.life * 0.35})`);
            bloomGrad.addColorStop(1, `rgba(${met.palette.trail}, ${met.life * 0.75})`);
            ctx.strokeStyle = bloomGrad;
            ctx.lineWidth = 7.5;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Pass 2: Bright luminous beam
            const grad = ctx.createLinearGradient(tailX, tailY, met.x, met.y);
            grad.addColorStop(0, `rgba(${met.palette.trail}, 0)`);
            grad.addColorStop(0.6, `rgba(${met.palette.trail}, ${met.life * 0.85})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${met.life * 0.98})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Pass 3: Pure white intense inner core
            const coreGrad = ctx.createLinearGradient(tailX + (met.x - tailX) * 0.4, tailY + (met.y - tailY) * 0.4, met.x, met.y);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            coreGrad.addColorStop(1, `rgba(255, 255, 255, ${met.life})`);
            ctx.strokeStyle = coreGrad;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(tailX + (met.x - tailX) * 0.4, tailY + (met.y - tailY) * 0.4);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Glowing meteor head with intense bloom
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 22;
            ctx.shadowColor = met.palette.glow;
            ctx.beginPath();
            ctx.arc(met.x, met.y, 3.4, 0, Math.PI * 2);
            ctx.fill();

            // Outer head corona
            ctx.fillStyle = `rgba(${met.palette.trail}, ${met.life * 0.7})`;
            ctx.beginPath();
            ctx.arc(met.x, met.y, 6.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      };

      // ============================================================
      // 7. GENTLE RAIN (Rain Mode)
      // ============================================================
      this.effectRenderers.rain = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 40 : 80;
          engine.particles = [];
          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              len: Math.random() * 16 + 10,
              speed: Math.random() * 8 + 14,
              opacity: Math.random() * 0.4 + 0.25
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.y += p.speed;
            p.x -= 1.8; // gentle diagonal slant
            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -20) p.x = engine.width + 20;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2.5, p.y + p.len);
          }
          ctx.stroke();
        }
      };

      // ============================================================
      // 8. AUTUMN LEAVES (Autumn Mode)
      // ============================================================
      this.effectRenderers.autumnLeaves = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 14 : 26;
          engine.particles = [];
          const colors = ['rgba(249, 115, 22, 0.75)', 'rgba(217, 119, 6, 0.75)', 'rgba(180, 83, 9, 0.75)', 'rgba(239, 68, 68, 0.70)'];
          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 4 + 2.8,
              dx: Math.random() * 0.8 + 0.3,
              dy: Math.random() * 0.7 + 0.35,
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.04,
              color: colors[i % colors.length]
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.rot += p.rotSpeed;

            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x > engine.width + 20) p.x = -20;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 9. WINTER SNOWFLAKES (Winter Mode)
      // ============================================================
      this.effectRenderers.snow = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 26 : 55;
          engine.particles = [];
          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 2 + 1.2,
              opacity: Math.random() * 0.5 + 0.35,
              dx: (Math.random() - 0.5) * 0.3,
              dy: Math.random() * 1.0 + 0.5,
              wobble: Math.random() * Math.PI * 2,
              wobbleSpeed: Math.random() * 0.04 + 0.02
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.wobble += p.wobbleSpeed;
            p.x += p.dx + Math.sin(p.wobble) * 0.5;
            p.y += p.dy;
            if (p.y > engine.height + 10) {
              p.y = -10;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        }
      };

      // ============================================================
      // 10. SAKURA CHERRY BLOSSOM PETALS (Sakura Mode)
      // ============================================================
      this.effectRenderers.petals = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 16 : 34;
          engine.particles = [];
          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 3 + 2.5,
              dx: Math.random() * 1.2 + 0.4,
              dy: Math.random() * 0.8 + 0.4,
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.06
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          ctx.fillStyle = 'rgba(244, 114, 182, 0.70)';
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.rot += p.rotSpeed;
            if (p.y > engine.height + 15) { p.y = -15; p.x = Math.random() * engine.width; }
            if (p.x > engine.width + 15) { p.x = -15; p.y = Math.random() * engine.height; }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 11. VINTAGE NOSTALGIC FILM (Vintage Mode)
      // Warm antique dust, subtle film grain, & rare micro scratches
      // ============================================================
      this.effectRenderers.vintageFilm = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const dustCount = isMobile ? 16 : 30;
          engine.particles = [];

          for (let i = 0; i < dustCount; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 1.6 + 0.6,
              opacity: Math.random() * 0.4 + 0.15,
              dx: (Math.random() - 0.5) * 0.18,
              dy: (Math.random() - 0.5) * 0.18 - 0.04,
              pulseSpeed: Math.random() * 0.7 + 0.3,
              pulseOffset: Math.random() * Math.PI * 2
            });
          }

          engine.scratchX = -100;
          engine.nextScratchTime = performance.now() + 3000 + Math.random() * 5000;
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          // 1. Antique Sepia Dust Motes
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx;
            p.y += p.dy;

            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            if (p.y < -10) p.y = engine.height + 10;
            if (p.y > engine.height + 10) p.y = -10;

            const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed + p.pulseOffset));

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 120, ${currentOpacity})`;
            ctx.shadowBlur = 3;
            ctx.shadowColor = `rgba(212, 175, 120, ${currentOpacity * 0.6})`;
            ctx.fill();
            ctx.restore();
          }

          // 2. Rare Microscopic Film Scratch (flashes for 1 frame)
          if (performance.now() > engine.nextScratchTime) {
            engine.scratchX = Math.random() * engine.width;
            engine.nextScratchTime = performance.now() + 5000 + Math.random() * 7000;
            ctx.save();
            ctx.strokeStyle = 'rgba(212, 190, 168, 0.12)';
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(engine.scratchX, 0);
            ctx.lineTo(engine.scratchX + (Math.random() - 0.5) * 4, engine.height);
            ctx.stroke();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 12. MIDNIGHT SKY (Midnight Mode)
      // Moonlit starlight & celestial tranquil glow
      // ============================================================
      this.effectRenderers.midnightSky = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const count = isMobile ? 35 : 70;
          engine.particles = [];

          for (let i = 0; i < count; i++) {
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: Math.random() * 1.3 + 0.5,
              opacity: Math.random() * 0.4 + 0.2,
              twinkleSpeed: Math.random() * 1.4 + 0.5,
              twinkleOffset: Math.random() * Math.PI * 2
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed + p.twinkleOffset));

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(196, 181, 253, ${currentOpacity})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(167, 139, 250, ${currentOpacity * 0.5})`;
            ctx.fill();
            ctx.restore();
          }
        }
      };
    }
  }

  // ——— Engine Singleton Instance ———
  const engine = new AtmosphereEngine();

  // ——— Centralized Control Functions ———
  function applyWebsiteMode(modeId) {
    const mode = WEBSITE_MODES[modeId] ? modeId : DEFAULT_MODE;
    document.documentElement.dataset.websiteMode = mode;
    localStorage.setItem(STORAGE_KEY_MODE, mode);

    const effectName = ATMOSPHERE_EFFECTS[mode] || 'dust';
    engine.setEffect(effectName, mode);

    updateModeSelectorUI(mode);

    if (window.AmbientAudioManager) {
      window.AmbientAudioManager.setMode(mode);
      if (!window.AmbientAudioManager.isEnabled) {
        window.AmbientAudioManager.toggle(true);
      }
    }
  }

  function applyReadingTheme(themeId) {
    const theme = READING_THEMES[themeId] ? themeId : DEFAULT_THEME;
    const readingPage = document.getElementById('page-reading');
    if (readingPage) {
      readingPage.dataset.readingTheme = theme;
    }
    document.documentElement.dataset.readingTheme = theme;
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }

  function setAtmosphereEffect(effectName) {
    const mode = document.documentElement.dataset.websiteMode || DEFAULT_MODE;
    engine.setEffect(effectName, mode);
  }

  // ——— Mode Selector UI Helper ———
  function updateModeSelectorUI(activeMode) {
    const btn = document.getElementById('btnModeSelector');
    if (btn && WEBSITE_MODES[activeMode]) {
      const mode = WEBSITE_MODES[activeMode];
      const iconSpan = btn.querySelector('.mode-btn-icon');
      const labelSpan = btn.querySelector('.mode-btn-label');
      if (iconSpan) iconSpan.textContent = mode.icon;
      if (labelSpan) labelSpan.textContent = mode.name;
    }

    const options = document.querySelectorAll('.mode-opt-btn');
    options.forEach((opt) => {
      const isSelected = opt.dataset.mode === activeMode;
      opt.classList.toggle('active', isSelected);
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function initModeSelectorPopover() {
    const btn = document.getElementById('btnModeSelector');
    const popover = document.getElementById('modePopover');

    if (!btn || !popover) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close ambient popover if open
      const ambientPopover = document.getElementById('ambientPopover');
      if (ambientPopover) ambientPopover.hidden = true;

      const isHidden = popover.hidden;
      popover.hidden = !isHidden;
    });

    popover.addEventListener('click', (e) => {
      const optBtn = e.target.closest('.mode-opt-btn');
      if (optBtn) {
        const mode = optBtn.dataset.mode;
        applyWebsiteMode(mode);
        popover.hidden = true;
      }
    });

    document.addEventListener('click', (e) => {
      if (!popover.hidden && !popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        popover.hidden = true;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popover.hidden) {
        popover.hidden = true;
        btn.focus();
      }
    });
  }

  // ——— Initialization ———
  function initAtmosphereSystem() {
    engine.init('atmosphereCanvas', 'atmosphereElements');

    // 1. Restore Website Mode
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    const initialMode = savedMode && WEBSITE_MODES[savedMode] ? savedMode : DEFAULT_MODE;
    applyWebsiteMode(initialMode);

    // 2. Restore Reading Theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const initialTheme = savedTheme && READING_THEMES[savedTheme] ? savedTheme : DEFAULT_THEME;
    applyReadingTheme(initialTheme);

    // 3. Init UI Listeners
    initModeSelectorPopover();
  }

  // ——— Window Global Exports ———
  window.AtmosphereEngine = engine;
  window.WEBSITE_MODES = WEBSITE_MODES;
  window.READING_THEMES = READING_THEMES;
  window.applyWebsiteMode = applyWebsiteMode;
  window.applyReadingTheme = applyReadingTheme;
  window.setAtmosphereEffect = setAtmosphereEffect;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAtmosphereSystem);
  } else {
    initAtmosphereSystem();
  }
})();
