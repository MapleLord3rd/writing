/* ============================================================
   ATMOSPHERE & THEME ENGINE — THE ARCHIVE
   Clean, modular architecture for Website Modes & Reading Themes
   High-performance GPU-friendly Canvas & CSS Visual Effects
   Context-Aware Abstract Parameter Mood System
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

  // ============================================================
  // ABSTRACT PARAMETER MOOD SYSTEM
  // Math-driven modifiers interpolated smoothly over 1.2 - 1.8s
  // Strictly isolated: does NOT touch Theme Mode or Audio System
  // ============================================================
  const MOOD_PROFILES = {
    neutral: {
      movementSpeedMultiplier: 1.0,
      movementVariance: 1.0,
      activityLevel: 1.0,
      particleDensityMultiplier: 1.0,
      particleSpeedMultiplier: 1.0,
      particleOpacityMultiplier: 1.0,
      fadeIntensity: 1.0,
      pulseIntensity: 1.0,
      wanderFrequency: 1.0,
      glowBloomRadius: 1.0,
      ambientBloomR: 230,
      ambientBloomG: 197,
      ambientBloomB: 148,
      ambientBloomA: 0.0,
      vignetteR: 0,
      vignetteG: 0,
      vignetteB: 0,
      vignetteA: 0.0,
      horizonR: 230,
      horizonG: 197,
      horizonB: 148,
      horizonA: 0.0,
      specularR: 230,
      specularG: 225,
      specularB: 215,
      rippleColor: 'rgba(230, 197, 148, 0.7)'
    },
    sad: { // Melancholic / Solace: Uplifting warm golden glow blended with deep espresso shadows
      movementSpeedMultiplier: 0.4,
      movementVariance: 0.35,
      activityLevel: 0.45,
      particleDensityMultiplier: 0.85,
      particleSpeedMultiplier: 0.4,
      particleOpacityMultiplier: 0.9,
      fadeIntensity: 0.6,
      pulseIntensity: 1.2,
      wanderFrequency: 0.35,
      glowBloomRadius: 1.6,
      ambientBloomR: 255,
      ambientBloomG: 185,
      ambientBloomB: 60,
      ambientBloomA: 0.14,
      vignetteR: 35,
      vignetteG: 14,
      vignetteB: 6,
      vignetteA: 0.16,
      horizonR: 251,
      horizonG: 146,
      horizonB: 60,
      horizonA: 0.08,
      specularR: 255,
      specularG: 238,
      specularB: 160,
      rippleColor: 'rgba(255, 185, 60, 0.85)'
    },
    anxious: { // Restless / Grounding: Calming electric cyan crystal blended with oceanic midnight navy
      movementSpeedMultiplier: 0.65,
      movementVariance: 0.3,
      activityLevel: 0.5,
      particleDensityMultiplier: 0.95,
      particleSpeedMultiplier: 0.55,
      particleOpacityMultiplier: 0.95,
      fadeIntensity: 0.75,
      pulseIntensity: 1.4,
      wanderFrequency: 0.4,
      glowBloomRadius: 1.5,
      ambientBloomR: 14,
      ambientBloomG: 185,
      ambientBloomB: 245,
      ambientBloomA: 0.13,
      vignetteR: 4,
      vignetteG: 14,
      vignetteB: 32,
      vignetteA: 0.18,
      horizonR: 3,
      horizonG: 105,
      horizonB: 161,
      horizonA: 0.08,
      specularR: 180,
      specularG: 245,
      specularB: 255,
      rippleColor: 'rgba(14, 185, 245, 0.85)'
    },
    joyful: { // Joyful / Inspired: Radiant champagne gold blended with royal starlight amethyst
      movementSpeedMultiplier: 1.6,
      movementVariance: 1.4,
      activityLevel: 2.2,
      particleDensityMultiplier: 1.4,
      particleSpeedMultiplier: 1.5,
      particleOpacityMultiplier: 1.4,
      fadeIntensity: 1.3,
      pulseIntensity: 2.0,
      wanderFrequency: 1.5,
      glowBloomRadius: 1.8,
      ambientBloomR: 255,
      ambientBloomG: 205,
      ambientBloomB: 40,
      ambientBloomA: 0.15,
      vignetteR: 48,
      vignetteG: 12,
      vignetteB: 72,
      vignetteA: 0.16,
      horizonR: 168,
      horizonG: 85,
      horizonB: 247,
      horizonA: 0.09,
      specularR: 255,
      specularG: 255,
      specularB: 225,
      rippleColor: 'rgba(255, 205, 40, 0.9)'
    },
    nostalgic: { // Nostalgic / Longing: Tender terracotta-rose bloom blended with rich sepia shadows
      movementSpeedMultiplier: 0.45,
      movementVariance: 0.35,
      activityLevel: 0.6,
      particleDensityMultiplier: 0.85,
      particleSpeedMultiplier: 0.45,
      particleOpacityMultiplier: 0.85,
      fadeIntensity: 0.5,
      pulseIntensity: 0.9,
      wanderFrequency: 0.4,
      glowBloomRadius: 1.4,
      ambientBloomR: 248,
      ambientBloomG: 135,
      ambientBloomB: 105,
      ambientBloomA: 0.13,
      vignetteR: 42,
      vignetteG: 16,
      vignetteB: 10,
      vignetteA: 0.16,
      horizonR: 225,
      horizonG: 29,
      horizonB: 72,
      horizonA: 0.08,
      specularR: 255,
      specularG: 218,
      specularB: 185,
      rippleColor: 'rgba(248, 135, 105, 0.85)'
    },
    weary: { // Tired / Sanctuary: Luminous lavender-indigo moonlight blended with deep obsidian stillness
      movementSpeedMultiplier: 0.15,
      movementVariance: 0.1,
      activityLevel: 0.2,
      particleDensityMultiplier: 0.5,
      particleSpeedMultiplier: 0.15,
      particleOpacityMultiplier: 0.4,
      fadeIntensity: 0.2,
      pulseIntensity: 0.3,
      wanderFrequency: 0.1,
      glowBloomRadius: 1.1,
      ambientBloomR: 130,
      ambientBloomG: 140,
      ambientBloomB: 255,
      ambientBloomA: 0.12,
      vignetteR: 6,
      vignetteG: 6,
      vignetteB: 18,
      vignetteA: 0.20,
      horizonR: 79,
      horizonG: 70,
      horizonB: 229,
      horizonA: 0.08,
      specularR: 220,
      specularG: 230,
      specularB: 255,
      rippleColor: 'rgba(130, 140, 255, 0.75)'
    },
    peaceful: { // Serene / Equilibrium: Luminous jade-mint bloom blended with coniferous pine shadows
      movementSpeedMultiplier: 0.75,
      movementVariance: 0.25,
      activityLevel: 0.9,
      particleDensityMultiplier: 1.0,
      particleSpeedMultiplier: 0.7,
      particleOpacityMultiplier: 1.1,
      fadeIntensity: 0.9,
      pulseIntensity: 1.0,
      wanderFrequency: 0.6,
      glowBloomRadius: 1.3,
      ambientBloomR: 40,
      ambientBloomG: 225,
      ambientBloomB: 160,
      ambientBloomA: 0.13,
      vignetteR: 4,
      vignetteG: 28,
      vignetteB: 18,
      vignetteA: 0.16,
      horizonR: 16,
      horizonG: 185,
      horizonB: 129,
      horizonA: 0.08,
      specularR: 205,
      specularG: 255,
      specularB: 235,
      rippleColor: 'rgba(40, 225, 160, 0.85)'
    }
  };

  class MoodManager {
    constructor(engine = null) {
      this.engine = engine;
      this.currentMood = 'neutral';
      this.targetMood = 'neutral';
      this.current = { ...MOOD_PROFILES.neutral };
      this.target = { ...MOOD_PROFILES.neutral };
      this.transitionSpeed = 1.6; // ~1.2 to 1.8s exponential smoothing
    }

    setEngine(engine) {
      this.engine = engine;
    }

    activateMood(moodKey, instant = false) {
      const normalizedKey = (moodKey === 'serene' || moodKey === 'peaceful') ? 'peaceful' : moodKey;
      const profile = MOOD_PROFILES[normalizedKey] || MOOD_PROFILES.neutral;
      this.targetMood = normalizedKey;
      this.target = { ...profile };

      if (instant) {
        this.currentMood = normalizedKey;
        this.current = { ...profile };
      }

      if (this.engine && typeof this.engine.triggerMoodShiftAura === 'function') {
        this.engine.triggerMoodShiftAura(normalizedKey);
      }
    }

    update(dt) {
      const factor = Math.min(1, Math.max(0, 1 - Math.exp(-dt * this.transitionSpeed)));
      for (const key of Object.keys(this.target)) {
        if (typeof this.target[key] === 'number') {
          this.current[key] += (this.target[key] - this.current[key]) * factor;
        } else {
          this.current[key] = this.target[key];
        }
      }
    }

    getModifiers() {
      return this.current;
    }
  }

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
      this.ripples = [];
      this.sparkles = [];
      this.events = [];
      this.pointer = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, vx: 0, vy: 0, isDown: false, lastMove: 0 };
      this.isPaused = false;
      this.reducedMotion = false;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.lastTime = 0;
      this.eventTimer = 0;
      this.nextMeteorTime = 0;
      this.nextScratchTime = 0;

      // Mood Manager
      this.moodManager = new MoodManager(this);

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

      // Interactive Pointer / Touch Physics
      this.initPointerInteractions();

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
      this.events = [];

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

      // Update Mood continuous interpolation
      if (this.moodManager) {
        this.moodManager.update(dt);
      }

      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Render Full-Screen Dynamic Mood Lighting, Bloom & Vignette Pass
        this.drawMoodAtmosphere(this.ctx, dt);

        // 2. Render Active Theme World
        const renderer = this.effectRenderers[this.activeEffect];
        if (renderer && renderer.updateAndDraw) {
          renderer.updateAndDraw(this, dt);
        }

        // 3. Render interactive touch / pointer effects on top
        this.updateAndDrawPointerEffects(dt);
      }

      this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    activateMood(moodKey, instant = false) {
      if (this.moodManager) {
        this.moodManager.activateMood(moodKey, instant);
      }
    }

    drawMoodAtmosphere(ctx, dt) {
      if (!this.moodManager) return;
      const m = this.moodManager.getModifiers();

      // Pass 1: Upper-Right Contrasting Celestial Horizon Rim Light (Screen Blend)
      if (m.ambientBloomA > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const cx = this.width * 0.82;
        const cy = this.height * 0.12;
        const rMax = Math.min(this.width, this.height) * 0.62;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
        const r = Math.round(m.ambientBloomR);
        const g = Math.round(m.ambientBloomG);
        const b = Math.round(m.ambientBloomB);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(m.ambientBloomA * 0.85).toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${(m.ambientBloomA * 0.40).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rMax, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Pass 2: Lower-Left Ambient Rim Starlight Glow (Screen Blend)
      if (m.horizonA > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const cx = this.width * 0.14;
        const cy = this.height * 0.88;
        const rMax = Math.min(this.width, this.height) * 0.52;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
        const hr = Math.round(m.horizonR);
        const hg = Math.round(m.horizonG);
        const hb = Math.round(m.horizonB);
        grad.addColorStop(0, `rgba(${hr}, ${hg}, ${hb}, ${(m.horizonA * 0.80).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${hr}, ${hg}, ${hb}, ${(m.horizonA * 0.35).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${hr}, ${hg}, ${hb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rMax, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Pass 3: Extreme Outer Corner Grounding Vignette (Perimeter Only)
      if (m.vignetteA > 0.005) {
        ctx.save();
        const cx = this.width * 0.5;
        const cy = this.height * 0.5;
        const rMin = Math.hypot(this.width, this.height) * 0.48;
        const rMax = Math.hypot(this.width, this.height) * 0.74;
        const vGrad = ctx.createRadialGradient(cx, cy, rMin, cx, cy, rMax);
        const vr = Math.round(m.vignetteR);
        const vg = Math.round(m.vignetteG);
        const vb = Math.round(m.vignetteB);
        vGrad.addColorStop(0, `rgba(${vr}, ${vg}, ${vb}, 0)`);
        vGrad.addColorStop(1, `rgba(${vr}, ${vg}, ${vb}, ${(m.vignetteA * 0.5).toFixed(3)})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
      }

      // 4. Dynamic Page-wide CSS Atmosphere Variable Injection (throttled to ~20fps)
      const now = performance.now();
      if (!this.lastMoodCssUpdate || now - this.lastMoodCssUpdate > 50) {
        this.lastMoodCssUpdate = now;
        const r = Math.round(m.ambientBloomR);
        const g = Math.round(m.ambientBloomG);
        const b = Math.round(m.ambientBloomB);
        const a = m.ambientBloomA;
        const hr = Math.round(m.horizonR);
        const hg = Math.round(m.horizonG);
        const hb = Math.round(m.horizonB);
        const ha = m.horizonA;
        const vr = Math.round(m.vignetteR);
        const vg = Math.round(m.vignetteG);
        const vb = Math.round(m.vignetteB);
        const va = m.vignetteA;
        const sr = Math.round(m.specularR);
        const sg = Math.round(m.specularG);
        const sb = Math.round(m.specularB);

        const rootStyle = document.documentElement.style;
        rootStyle.setProperty('--mood-ambient-tint', `rgba(${r}, ${g}, ${b}, ${(a * 0.75).toFixed(3)})`);
        rootStyle.setProperty('--mood-ambient-glow', `rgba(${hr}, ${hg}, ${hb}, ${(ha * 0.75).toFixed(3)})`);
        rootStyle.setProperty('--mood-shadow-tint', `rgba(${vr}, ${vg}, ${vb}, ${(va * 0.5).toFixed(3)})`);
        rootStyle.setProperty('--mood-specular', `rgb(${sr}, ${sg}, ${sb})`);
        rootStyle.setProperty('--mood-border-glow', `rgba(${sr}, ${sg}, ${sb}, ${(a * 0.5).toFixed(3)})`);
        rootStyle.setProperty('--mood-glow-radius', `${(m.glowBloomRadius * 12).toFixed(1)}px`);
        rootStyle.setProperty('--mood-pulse-speed', `${(1 / Math.max(0.2, m.pulseIntensity)).toFixed(2)}s`);
      }
    }

    triggerMoodShiftAura(moodKey) {
      if (this.reducedMotion) return;
      const cx = this.width * 0.5;
      const cy = this.height * 0.45;
      const normalizedKey = (moodKey === 'serene' || moodKey === 'peaceful') ? 'peaceful' : moodKey;
      const profile = MOOD_PROFILES[normalizedKey] || MOOD_PROFILES.neutral;
      const color = profile.rippleColor || 'rgba(230, 197, 148, 0.8)';

      for (let i = 0; i < 3; i++) {
        this.ripples.push({
          x: cx,
          y: cy,
          radius: 8 + i * 22,
          maxRadius: Math.max(this.width, this.height) * 0.65,
          alpha: 0.85 - i * 0.2,
          speed: (4.5 + i * 1.6),
          color: color
        });
      }

      // Burst of shimmering stardust from center
      const burstCount = 18;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 4.5 + 2.0;
        this.sparkles.push({
          x: cx,
          y: cy,
          r: Math.random() * 3.2 + 1.5,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          alpha: 1.0,
          decay: Math.random() * 0.018 + 0.012,
          color: color
        });
      }
    }

    // ——— Interactive Pointer & Touch Physics ———
    initPointerInteractions() {
      const handlePointerMove = (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const prevX = this.pointer.x === -1000 ? x : this.pointer.x;
        const prevY = this.pointer.y === -1000 ? y : this.pointer.y;
        this.pointer.vx = (x - prevX) * 0.35;
        this.pointer.vy = (y - prevY) * 0.35;
        this.pointer.prevX = prevX;
        this.pointer.prevY = prevY;
        this.pointer.x = x;
        this.pointer.y = y;
        this.pointer.lastMove = performance.now();

        // Spawn mode-specific interactive sparkles / ripples on movement
        if (!this.reducedMotion && this.sparkles.length < 50) {
          const speed = Math.hypot(this.pointer.vx, this.pointer.vy);
          if (speed > 1.5) {
            const mode = this.currentMode;
            let color = 'rgba(230, 197, 148, 0.7)';
            if (mode === 'magic') color = 'rgba(192, 132, 252, 0.85)';
            else if (mode === 'ocean') color = 'rgba(56, 189, 248, 0.85)';
            else if (mode === 'sakura') color = 'rgba(244, 114, 182, 0.85)';
            else if (mode === 'forest') color = 'rgba(74, 222, 128, 0.75)';
            else if (mode === 'cosmos' || mode === 'midnight') color = 'rgba(167, 139, 250, 0.8)';
            else if (mode === 'autumn' || mode === 'sunset') color = 'rgba(251, 146, 60, 0.8)';

            this.sparkles.push({
              x: x + (Math.random() - 0.5) * 12,
              y: y + (Math.random() - 0.5) * 12,
              r: Math.random() * 2.2 + 1.0,
              dx: this.pointer.vx * 0.2 + (Math.random() - 0.5) * 0.8,
              dy: this.pointer.vy * 0.2 + (Math.random() - 0.5) * 0.8 - 0.3,
              alpha: 0.9,
              decay: Math.random() * 0.02 + 0.015,
              color: color
            });
          }
        }
      };

      const handlePointerDown = (e) => {
        this.pointer.isDown = true;
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;

        // Spawn concentric ripple / shockwave on click or touch
        if (!this.reducedMotion) {
          const mode = this.currentMode;
          let rippleColor = 'rgba(230, 197, 148, 0.6)';
          if (mode === 'ocean') rippleColor = 'rgba(56, 189, 248, 0.75)';
          else if (mode === 'magic') rippleColor = 'rgba(192, 132, 252, 0.75)';
          else if (mode === 'rain') rippleColor = 'rgba(147, 197, 253, 0.75)';
          else if (mode === 'sakura') rippleColor = 'rgba(244, 114, 182, 0.7)';
          else if (mode === 'cosmos' || mode === 'midnight') rippleColor = 'rgba(196, 181, 253, 0.75)';

          this.ripples.push({
            x: e.clientX,
            y: e.clientY,
            radius: 4,
            maxRadius: Math.min(this.width, this.height) * 0.18 + 40,
            alpha: 0.8,
            speed: 2.8,
            color: rippleColor
          });

          // Burst of particles
          const burstCount = 6;
          for (let i = 0; i < burstCount; i++) {
            const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 2.5 + 1.2;
            this.sparkles.push({
              x: e.clientX,
              y: e.clientY,
              r: Math.random() * 2.5 + 1.2,
              dx: Math.cos(angle) * speed,
              dy: Math.sin(angle) * speed,
              alpha: 1.0,
              decay: Math.random() * 0.025 + 0.02,
              color: rippleColor
            });
          }
        }
      };

      const handlePointerUp = () => {
        this.pointer.isDown = false;
      };

      const handlePointerLeave = () => {
        this.pointer.x = -1000;
        this.pointer.y = -1000;
        this.pointer.isDown = false;
      };

      // Register Pointer & Touch event listeners
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
      window.addEventListener('pointerup', handlePointerUp, { passive: true });
      window.addEventListener('pointercancel', handlePointerLeave, { passive: true });
      document.addEventListener('mouseleave', handlePointerLeave, { passive: true });
    }

    updateAndDrawPointerEffects(dt) {
      if (this.reducedMotion) return;
      const ctx = this.ctx;

      // 1. Update and Draw Expanding Touch Ripples
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += r.speed * (dt * 60);
        r.alpha -= 0.015 * (dt * 60);

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          this.ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color.replace(/[\d\.]+\)$/, `${Math.max(0, r.alpha)})`);
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Inner soft echo ring
        if (r.radius > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = r.color.replace(/[\d\.]+\)$/, `${Math.max(0, r.alpha * 0.4)})`);
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Update and Draw Trailing Sparkles
      for (let i = this.sparkles.length - 1; i >= 0; i--) {
        const s = this.sparkles[i];
        s.x += s.dx * (dt * 60);
        s.y += s.dy * (dt * 60);
        s.alpha -= s.decay * (dt * 60);

        if (s.alpha <= 0) {
          this.sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color.replace(/[\d\.]+\)$/, `${Math.max(0, s.alpha)})`);
        ctx.shadowBlur = 4;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.restore();
      }

      // 3. Natural friction decay for pointer velocity
      this.pointer.vx *= 0.88;
      this.pointer.vy *= 0.88;
    }

    // Trigger an ambient luminous shockwave / ripple programmatically
    triggerRipple(x, y) {
      if (this.reducedMotion) return;
      const posX = typeof x === 'number' ? x : this.width / 2;
      const posY = typeof y === 'number' ? y : this.height / 2;
      const mode = this.currentMode;

      let rippleColor = 'rgba(230, 197, 148, 0.75)';
      if (mode === 'ocean') rippleColor = 'rgba(56, 189, 248, 0.85)';
      else if (mode === 'magic') rippleColor = 'rgba(192, 132, 252, 0.85)';
      else if (mode === 'rain') rippleColor = 'rgba(147, 197, 253, 0.85)';
      else if (mode === 'sakura') rippleColor = 'rgba(244, 114, 182, 0.8)';
      else if (mode === 'cosmos' || mode === 'midnight') rippleColor = 'rgba(196, 181, 253, 0.85)';
      else if (mode === 'sunset' || mode === 'autumn') rippleColor = 'rgba(245, 158, 11, 0.85)';

      this.ripples.push({
        x: posX,
        y: posY,
        radius: 8,
        maxRadius: Math.min(this.width, this.height) * 0.35 + 80,
        alpha: 0.9,
        speed: 4.5,
        color: rippleColor
      });

      // Ambient sparkling particle burst
      const burstCount = 14;
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.6;
        const speed = Math.random() * 3.6 + 1.8;
        this.sparkles.push({
          x: posX,
          y: posY,
          r: Math.random() * 2.8 + 1.4,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          alpha: 1.0,
          decay: Math.random() * 0.02 + 0.015,
          color: rippleColor
        });
      }
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx * mood.particleSpeedMultiplier * (1 + (mood.movementVariance - 1) * 0.3);
            p.y += p.dy * mood.particleSpeedMultiplier;

            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            if (p.y < -10) p.y = engine.height + 10;
            if (p.y > engine.height + 10) p.y = -10;

            const currentOpacity = p.baseOpacity * mood.particleOpacityMultiplier * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed * mood.pulseIntensity + p.pulseOffset));

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${Math.max(0, currentOpacity)})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `rgba(${color}, ${Math.max(0, currentOpacity * 0.5)})`;
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          // 1. Soft Atmospheric Magic Glow
          const cx = engine.width * 0.5;
          const cy = engine.height * 0.4;
          const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(engine.width, engine.height) * 0.65);
          glowGrad.addColorStop(0, `rgba(192, 132, 252, ${0.06 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(0.35, `rgba(236, 72, 153, ${0.03 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(0.7, `rgba(56, 189, 248, ${0.015 * mood.particleOpacityMultiplier})`);
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
            p.y += p.dy * mood.particleSpeedMultiplier;
            p.x += (p.dx * mood.particleSpeedMultiplier) + Math.sin(time * p.swayFreq * mood.wanderFrequency + i) * 0.35 * mood.movementVariance;

            // Loop smoothly around boundaries
            if (p.y < -15) {
              p.y = engine.height + 15;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -15) p.x = engine.width + 15;
            if (p.x > engine.width + 15) p.x = -15;

            const pulse = 0.65 + 0.35 * Math.sin(time * p.pulseSpeed * mood.pulseIntensity + p.pulseOffset);
            const currentOpacity = p.baseOpacity * mood.particleOpacityMultiplier * pulse;

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, currentOpacity)})`;
            ctx.shadowBlur = 8 * mood.pulseIntensity;
            ctx.shadowColor = `rgba(${p.color}, ${Math.max(0, currentOpacity * 0.8)})`;
            ctx.fill();

            // Specular core on larger mana sparks
            if (p.r > 1.8) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, currentOpacity * 0.9)})`;
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
            const duration = (6000 + Math.random() * 5000) / Math.max(0.5, mood.movementSpeedMultiplier);

            // Next event scaled by mood activity level
            const nextDelay = (3000 + Math.random() * 2500) / Math.max(0.3, mood.activityLevel);
            engine.eventTimer = performance.now() + nextDelay;

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
            const opacity = fadeInFactor * fadeOutFactor * 0.88 * mood.particleOpacityMultiplier;

            if (opacity <= 0.01 || ev.progress >= 1) {
              engine.events.splice(e, 1);
              continue;
            }

            ctx.save();
            ctx.translate(ev.x, ev.y);
            ctx.globalAlpha = opacity;

            if (ev.type === 'circle') {
              // Detailed Arcane Magic Circle with rotating rings & runes
              ctx.rotate(ev.rotate + time * 0.15 * mood.movementSpeedMultiplier);
              ctx.strokeStyle = ev.col.stroke;
              ctx.fillStyle = ev.col.fill;
              ctx.shadowBlur = 14 * mood.pulseIntensity;
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
                const angle = (i / points) * Math.PI * 2 + time * 0.1 * mood.movementSpeedMultiplier;
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
              ctx.rotate(ev.rotate + Math.sin(time * 0.5 * mood.wanderFrequency) * 0.1 * mood.movementVariance);
              ctx.strokeStyle = ev.col.stroke;
              ctx.fillStyle = ev.col.fill;
              ctx.lineWidth = 2.0;
              ctx.shadowBlur = 16 * mood.pulseIntensity;
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
              const angle = ev.rotate;
              const sweepLen = ev.size * 1.5;
              const curX = Math.cos(angle) * (trailProgress * sweepLen - sweepLen * 0.5);
              const curY = Math.sin(angle) * (trailProgress * sweepLen - sweepLen * 0.5);

              const cometGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, ev.size * 0.4);
              cometGrad.addColorStop(0, '#ffffff');
              cometGrad.addColorStop(0.3, ev.col.stroke);
              cometGrad.addColorStop(1, 'rgba(0,0,0,0)');

              ctx.fillStyle = cometGrad;
              ctx.beginPath();
              ctx.arc(curX, curY, ev.size * 0.35, 0, Math.PI * 2);
              ctx.fill();

            } else if (ev.type === 'fireflies') {
              // Cluster of dancing magical motes
              const swarmCount = 7;
              for (let f = 0; f < swarmCount; f++) {
                const fa = (f / swarmCount) * Math.PI * 2 + time * 0.8 * mood.movementSpeedMultiplier;
                const fx = Math.cos(fa) * (ev.size * 0.35) + Math.sin(time * 1.5 + f) * 8 * mood.movementVariance;
                const fy = Math.sin(fa) * (ev.size * 0.25) + Math.cos(time * 1.3 + f) * 8 * mood.movementVariance;

                ctx.beginPath();
                ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10 * mood.pulseIntensity;
                ctx.shadowColor = ev.col.glow;
                ctx.fill();
              }

            } else if (ev.type === 'ripple') {
              // Expanding Magical Glyphic Shockwave
              const r = ev.size * 0.5 * ev.progress;
              ctx.strokeStyle = ev.col.stroke;
              ctx.lineWidth = 1.8;
              ctx.shadowBlur = 12 * mood.pulseIntensity;
              ctx.shadowColor = ev.col.glow;
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.stroke();

            } else if (ev.type === 'burst') {
              // Concentric Starlight Burst
              const rays = 12;
              const fr = ev.size * 0.45 * Math.sin(ev.progress * Math.PI);
              ctx.fillStyle = ev.col.stroke;
              ctx.shadowBlur = 14 * mood.pulseIntensity;
              ctx.shadowColor = ev.col.glow;

              for (let p = 0; p < rays; p++) {
                const angle = (p / rays) * Math.PI * 2 + time * 0.2 * mood.movementSpeedMultiplier;
                const px = Math.cos(angle) * fr;
                const py = Math.sin(angle) * fr;

                ctx.beginPath();
                ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }

            } else if (ev.type === 'orb') {
              // Luminous Wandering Mana Orb with Satellites
              const ox = Math.sin(time * 0.7 * mood.wanderFrequency) * (ev.size * 0.4 * mood.movementVariance);
              const oy = Math.cos(time * 0.5 * mood.wanderFrequency) * (ev.size * 0.25 * mood.movementVariance);

              ctx.beginPath();
              ctx.arc(ox, oy, 7, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 20 * mood.pulseIntensity;
              ctx.shadowColor = ev.col.glow;
              ctx.fill();

              // Outer halo
              ctx.beginPath();
              ctx.arc(ox, oy, 14, 0, Math.PI * 2);
              ctx.fillStyle = ev.col.fill;
              ctx.fill();

              // Orbiting tiny sparks
              for (let s = 0; s < 3; s++) {
                const sAngle = time * 2.5 * mood.movementSpeedMultiplier + (s / 3) * Math.PI * 2;
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

      // ============================================================
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += (p.dx * mood.particleSpeedMultiplier) + Math.sin(time * p.swayFreq * mood.wanderFrequency + p.swayOffset) * p.swayAmp * mood.movementVariance;
            p.y += p.dy * mood.particleSpeedMultiplier;
            p.rot += p.rotSpeed * mood.movementVariance;

            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x > engine.width + 20) p.x = -20;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = mood.particleOpacityMultiplier;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            if (mood.ambientBloomA > 0.02) {
              const sr = Math.round(mood.specularR);
              const sg = Math.round(mood.specularG);
              const sb = Math.round(mood.specularB);
              ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${(mood.ambientBloomA * 0.75).toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
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
              r: Math.random() * 3.5 + 1.5,
              opacity: Math.random() * 0.45 + 0.2,
              dy: -(Math.random() * 0.7 + 0.35),
              wobbleSpeed: Math.random() * 1.2 + 0.6,
              wobbleAmp: Math.random() * 0.8 + 0.3,
              wobbleOffset: Math.random() * Math.PI * 2
            });
          }
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.y += p.dy * mood.particleSpeedMultiplier;
            p.x += Math.sin(time * p.wobbleSpeed * mood.wanderFrequency + p.wobbleOffset) * (p.wobbleAmp * mood.movementVariance);

            if (p.y < -20) {
              p.y = engine.height + 20;
              p.x = Math.random() * engine.width;
            }

            const currentAlpha = p.opacity * mood.particleOpacityMultiplier * (0.8 + 0.2 * Math.sin(time * 1.5 * mood.pulseIntensity + p.wobbleOffset));

            ctx.save();
            ctx.translate(p.x, p.y);

            // Bubble body
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${Math.max(0, currentAlpha * 0.15)})`;
            ctx.fill();

            // Bubble rim highlight
            ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, currentAlpha * 0.75)})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Specular reflection glint
            ctx.beginPath();
            ctx.arc(-p.r * 0.32, -p.r * 0.32, Math.max(0.6, p.r * 0.24), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, currentAlpha * 0.85)})`;
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          // 1. Soft radial golden sunlight wash originating from the TOP RIGHT
          const cx = engine.width * 0.92;
          const cy = -20;
          const maxDist = Math.hypot(engine.width, engine.height) * 0.95;

          const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
          glowGrad.addColorStop(0, `rgba(251, 146, 60, ${0.14 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(0.25, `rgba(245, 158, 11, ${0.09 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(0.55, `rgba(244, 63, 94, ${0.04 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(0.85, `rgba(147, 51, 234, ${0.015 * mood.particleOpacityMultiplier})`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.save();
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.rect(0, 0, engine.width, engine.height);
          ctx.fill();
          ctx.restore();

          // 2. Angled Volumetric Golden Light Rays from Top-Right down-left
          const swayX = Math.sin(time * 0.35 * mood.wanderFrequency) * 30 * mood.movementVariance;
          const rayOriginX = cx + swayX;
          const rayOriginY = cy;

          ctx.save();
          // Primary broad golden beam
          const beamGrad = ctx.createLinearGradient(rayOriginX, rayOriginY, engine.width * 0.3, engine.height * 0.85);
          beamGrad.addColorStop(0, `rgba(251, 146, 60, ${0.12 * mood.pulseIntensity})`);
          beamGrad.addColorStop(0.4, `rgba(245, 158, 11, ${0.07 * mood.pulseIntensity})`);
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
          beamGrad2.addColorStop(0, `rgba(254, 215, 170, ${0.09 * mood.pulseIntensity})`);
          beamGrad2.addColorStop(0.5, `rgba(249, 115, 22, ${0.04 * mood.pulseIntensity})`);
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
            p.x += (p.dx * mood.movementSpeedMultiplier) + Math.sin(time * p.swayFreq * mood.wanderFrequency + i) * 0.35 * mood.movementVariance;
            p.y += (p.dy * mood.movementSpeedMultiplier) + Math.sin(time * 0.5 + i * 0.7) * 0.2;

            if (p.x < -15) { p.x = engine.width + 15; p.y = Math.random() * engine.height; }
            if (p.y > engine.height + 15) { p.y = -15; p.x = Math.random() * engine.width; }

            const opacity = Math.max(0.05, p.baseOpacity * mood.particleOpacityMultiplier * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed * mood.pulseIntensity + p.pulseOffset)));
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
            ctx.shadowBlur = 6 * mood.pulseIntensity;
            ctx.shadowColor = `rgba(${p.color}, ${opacity * 0.8})`;
            ctx.fill();
            ctx.restore();
          }
        }
      };

      // ============================================================
      // 6. DEEP COSMOS STARFIELD & ORBITING ASTEROIDS (Cosmos Mode)
      // Realistic multi-tier star parallax, craters, starlight & shooting stars
      // ============================================================
      this.effectRenderers.cosmosSpace = {
        init: (engine) => {
          const isMobile = engine.width <= 768;
          const starCount = isMobile ? 55 : 120;
          engine.particles = [];
          engine.meteors = [];
          engine.bursts = [];
          engine.asteroids = [];

          // 1. Generate Deep Parallax Stars
          for (let i = 0; i < starCount; i++) {
            const depth = Math.random(); // 0 = far, 1 = near
            engine.particles.push({
              x: Math.random() * engine.width,
              y: Math.random() * engine.height,
              r: depth * 1.5 + 0.4,
              opacity: depth * 0.5 + 0.35,
              twinkleSpeed: Math.random() * 2.0 + 0.8,
              twinkleOffset: Math.random() * Math.PI * 2,
              hasFlare: depth > 0.85 && Math.random() > 0.4,
              color: depth > 0.75 ? (Math.random() > 0.5 ? '216, 180, 254' : '186, 230, 253') : '255, 255, 255'
            });
          }

          // 2. Generate Realistic Procedural Asteroids
          const asteroidCount = isMobile ? 1 : 2;
          for (let a = 0; a < asteroidCount; a++) {
            const baseRadius = a === 0 ? (isMobile ? 22 : 36) : (isMobile ? 14 : 20);
            const vertices = [];
            const numVerts = 14;

            for (let v = 0; v < numVerts; v++) {
              const angle = (v / numVerts) * Math.PI * 2;
              const distNoise = baseRadius * (0.75 + Math.random() * 0.5);
              vertices.push({
                x: Math.cos(angle) * distNoise,
                y: Math.sin(angle) * distNoise
              });
            }

            const craters = [];
            const craterCount = a === 0 ? 4 : 2;
            for (let c = 0; c < craterCount; c++) {
              const cAngle = Math.random() * Math.PI * 2;
              const cDist = Math.random() * (baseRadius * 0.55);
              craters.push({
                cx: Math.cos(cAngle) * cDist,
                cy: Math.sin(cAngle) * cDist,
                cr: Math.random() * (baseRadius * 0.22) + 2.5
              });
            }

            const ridges = [];
            for (let r = 0; r < 3; r++) {
              ridges.push({
                x1: (Math.random() - 0.5) * baseRadius * 0.9,
                y1: (Math.random() - 0.5) * baseRadius * 0.9,
                x2: (Math.random() - 0.5) * baseRadius * 0.9,
                y2: (Math.random() - 0.5) * baseRadius * 0.9
              });
            }

            engine.asteroids.push({
              anchorXRatio: a === 0 ? 0.82 : 0.16,
              anchorYRatio: a === 0 ? 0.24 : 0.72,
              orbitRx: a === 0 ? 28 : 18,
              orbitRy: a === 0 ? 18 : 12,
              orbitSpeed: (a === 0 ? 0.15 : 0.22) * 0.7,
              orbitPhase: a * 2.2,
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (a === 0 ? 0.0018 : -0.0025),
              baseRadius,
              vertices,
              craters,
              ridges,
              isLarge: a === 0
            });
          }

          engine.nextMeteorTime = performance.now() + 2000;
        },
        updateAndDraw: (engine, dt) => {
          const ctx = engine.ctx;
          const time = engine.lastTime * 0.001;
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          // 1. Render Stars
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            const twinkle = 0.5 + 0.5 * Math.sin(time * p.twinkleSpeed * mood.pulseIntensity + p.twinkleOffset);
            const currentOpacity = p.opacity * mood.particleOpacityMultiplier * twinkle;

            ctx.save();
            ctx.fillStyle = `rgba(${p.color}, ${Math.max(0, currentOpacity)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            // 4-point glint on bright prominent stars
            if (p.hasFlare && twinkle > 0.65) {
              ctx.strokeStyle = `rgba(167, 139, 250, ${Math.max(0, twinkle * 0.75 * mood.pulseIntensity)})`;
              ctx.lineWidth = 0.8;
              const len = p.r * 2.8;
              ctx.beginPath();
              ctx.moveTo(p.x - len, p.y);
              ctx.lineTo(p.x + len, p.y);
              ctx.moveTo(p.x, p.y - len);
              ctx.lineTo(p.x, p.y + len);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 2. Render Large Realistic Asteroids with Pseudo-Fixed Orbital Motion
          for (let a = 0; a < engine.asteroids.length; a++) {
            const ast = engine.asteroids[a];

            const anchorX = engine.width * ast.anchorXRatio;
            const anchorY = engine.height * ast.anchorYRatio;
            const posX = anchorX + Math.cos(time * ast.orbitSpeed * mood.movementSpeedMultiplier + ast.orbitPhase) * ast.orbitRx;
            const posY = anchorY + Math.sin(time * ast.orbitSpeed * 0.7 * mood.movementSpeedMultiplier + ast.orbitPhase) * ast.orbitRy;
            ast.rot += ast.rotSpeed * mood.movementSpeedMultiplier;

            ctx.save();
            ctx.translate(posX, posY);
            ctx.rotate(ast.rot);

            ctx.shadowBlur = ast.isLarge ? 18 : 8;
            ctx.shadowColor = 'rgba(196, 181, 253, 0.45)';

            const grad = ctx.createRadialGradient(
              -ast.baseRadius * 0.35, -ast.baseRadius * 0.35, ast.baseRadius * 0.1,
              0, 0, ast.baseRadius * 1.15
            );
            grad.addColorStop(0, '#94a3b8');
            grad.addColorStop(0.35, '#475569');
            grad.addColorStop(0.70, '#1e1b4b');
            grad.addColorStop(1, '#090d16');

            ctx.fillStyle = grad;
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
            ctx.lineWidth = ast.isLarge ? 1.5 : 1.0;

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
                ctx.save();
                ctx.beginPath();
                ctx.arc(cr.cx, cr.cy, cr.cr, 0, Math.PI * 2);
                ctx.fillStyle = '#090d16';
                ctx.fill();

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

          // 3. Majestic Full-Sky Shooting Stars (Traversing across the entire viewport)
          if (performance.now() > engine.nextMeteorTime && engine.meteors.length < 2) {
            const meteorDelay = (3800 + Math.random() * 2800) / Math.max(0.3, mood.activityLevel);
            engine.nextMeteorTime = performance.now() + meteorDelay;

            const trajectoryType = Math.floor(Math.random() * 4);
            let startX, startY, angle;

            if (trajectoryType === 0) {
              // Diagonal Top-Left to Bottom-Right across screen
              const fromTop = Math.random() > 0.4;
              startX = fromTop ? Math.random() * (engine.width * 0.5) : -50;
              startY = fromTop ? -50 : Math.random() * (engine.height * 0.4);
              angle = Math.PI * 0.19 + (Math.random() - 0.5) * 0.12;
            } else if (trajectoryType === 1) {
              // Diagonal Top-Right to Bottom-Left across screen
              const fromTop = Math.random() > 0.4;
              startX = fromTop ? Math.random() * (engine.width * 0.5) + engine.width * 0.5 : engine.width + 50;
              startY = fromTop ? -50 : Math.random() * (engine.height * 0.4);
              angle = Math.PI * 0.81 + (Math.random() - 0.5) * 0.12;
            } else if (trajectoryType === 2) {
              // High-Altitude Horizontal Crosser (Left to Right)
              startX = -60;
              startY = Math.random() * (engine.height * 0.35) + 15;
              angle = Math.PI * 0.08 + (Math.random() - 0.5) * 0.06;
            } else {
              // High-Altitude Horizontal Crosser (Right to Left)
              startX = engine.width + 60;
              startY = Math.random() * (engine.height * 0.35) + 15;
              angle = Math.PI * 0.92 + (Math.random() - 0.5) * 0.06;
            }

            const speed = (Math.random() * 6 + 13) * mood.movementSpeedMultiplier;
            const length = Math.random() * 120 + 160;
            const palettes = [
              { trail: '192, 132, 252', glow: '#c084fc' }, // Starlight Violet
              { trail: '56, 189, 248', glow: '#38bdf8' },  // Celestial Cyan
              { trail: '251, 191, 36', glow: '#fbbf24' },  // Solar Gold
              { trail: '244, 114, 182', glow: '#f472b6' }, // Rose Nebula
              { trail: '226, 232, 240', glow: '#ffffff' }  // Pure Stardust White
            ];
            const palette = palettes[Math.floor(Math.random() * palettes.length)];

            engine.meteors.push({
              x: startX,
              y: startY,
              startX,
              startY,
              distTraveled: 0,
              angle,
              speed,
              length,
              palette
            });
          }

          for (let m = engine.meteors.length - 1; m >= 0; m--) {
            const met = engine.meteors[m];
            const stepX = Math.cos(met.angle) * met.speed * (dt * 60);
            const stepY = Math.sin(met.angle) * met.speed * (dt * 60);
            met.x += stepX;
            met.y += stepY;
            met.distTraveled += Math.hypot(stepX, stepY);

            const tailX = met.x - Math.cos(met.angle) * met.length;
            const tailY = met.y - Math.sin(met.angle) * met.length;

            // Fade in gently as it enters the sky, stay 100% luminous across the sky
            const fadeIn = Math.min(1.0, met.distTraveled / 140);
            const alpha = fadeIn * mood.particleOpacityMultiplier;

            // Emit sparkling stardust trail as it traverses across the visible sky
            const inSky = met.x >= -40 && met.x <= engine.width + 40 && met.y >= -40 && met.y <= engine.height + 40;
            if (inSky && Math.random() > 0.22 && engine.sparkles.length < 80) {
              const sparkOffset = Math.random() * met.length * 0.75;
              engine.sparkles.push({
                x: met.x - Math.cos(met.angle) * sparkOffset + (Math.random() - 0.5) * 4,
                y: met.y - Math.sin(met.angle) * sparkOffset + (Math.random() - 0.5) * 4,
                dx: (Math.random() - 0.5) * 0.9 - Math.cos(met.angle) * 0.35,
                dy: (Math.random() - 0.5) * 0.9 - Math.sin(met.angle) * 0.35,
                alpha: alpha * 0.9,
                decay: Math.random() * 0.022 + 0.015,
                r: Math.random() * 2.0 + 0.8,
                color: `rgba(${met.palette.trail}, 0.85)`
              });
            }

            // Remove only when BOTH the meteor head and tail have completely exited the viewport
            const isHeadOff = (met.x < -100 || met.x > engine.width + 100 || met.y < -100 || met.y > engine.height + 100);
            const isTailOff = (tailX < -100 || tailX > engine.width + 100 || tailY < -100 || tailY > engine.height + 100);

            if (met.distTraveled > 200 && isHeadOff && isTailOff) {
              engine.meteors.splice(m, 1);
              continue;
            }

            ctx.save();

            // Pass 1: Wide diffuse bloom trail
            const bloomGrad = ctx.createLinearGradient(tailX, tailY, met.x, met.y);
            bloomGrad.addColorStop(0, `rgba(${met.palette.trail}, 0)`);
            bloomGrad.addColorStop(0.4, `rgba(${met.palette.trail}, ${alpha * 0.35})`);
            bloomGrad.addColorStop(1, `rgba(${met.palette.trail}, ${alpha * 0.75})`);
            ctx.strokeStyle = bloomGrad;
            ctx.lineWidth = 8.5;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Pass 2: Bright luminous beam
            const grad = ctx.createLinearGradient(tailX, tailY, met.x, met.y);
            grad.addColorStop(0, `rgba(${met.palette.trail}, 0)`);
            grad.addColorStop(0.6, `rgba(${met.palette.trail}, ${alpha * 0.85})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.98})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Pass 3: Pure white intense inner core
            const coreStartX = tailX + (met.x - tailX) * 0.35;
            const coreStartY = tailY + (met.y - tailY) * 0.35;
            const coreGrad = ctx.createLinearGradient(coreStartX, coreStartY, met.x, met.y);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            coreGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
            ctx.strokeStyle = coreGrad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(coreStartX, coreStartY);
            ctx.lineTo(met.x, met.y);
            ctx.stroke();

            // Glowing meteor head with intense bloom
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 24 * mood.pulseIntensity;
            ctx.shadowColor = met.palette.glow;
            ctx.beginPath();
            ctx.arc(met.x, met.y, 3.6, 0, Math.PI * 2);
            ctx.fill();

            // Outer head corona
            ctx.fillStyle = `rgba(${met.palette.trail}, ${alpha * 0.75})`;
            ctx.beginPath();
            ctx.arc(met.x, met.y, 7.0, 0, Math.PI * 2);
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.45 * mood.particleOpacityMultiplier)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.y += p.speed * mood.particleSpeedMultiplier;
            p.x -= 1.8 * mood.movementVariance;
            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -20) p.x = engine.width + 20;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2.5 * mood.movementVariance, p.y + p.len);
          }
          ctx.stroke();
        }
      };

      // ============================================================
      // 8. AUTUMN LEAVES (Autumn Mode)
      // Pure organic aerodynamic motion without pointer wind deflection
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
          const time = engine.lastTime * 0.001;
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += (p.dx * mood.particleSpeedMultiplier) + Math.sin(time * 1.2 * mood.wanderFrequency + i) * 0.4 * mood.movementVariance;
            p.y += p.dy * mood.particleSpeedMultiplier;
            p.rot += p.rotSpeed * mood.movementVariance;

            if (p.y > engine.height + 20) {
              p.y = -20;
              p.x = Math.random() * engine.width;
            }
            if (p.x > engine.width + 20) p.x = -20;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = mood.particleOpacityMultiplier;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            if (mood.ambientBloomA > 0.02) {
              const sr = Math.round(mood.specularR);
              const sg = Math.round(mood.specularG);
              const sb = Math.round(mood.specularB);
              ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${(mood.ambientBloomA * 0.75).toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.wobble += p.wobbleSpeed * mood.wanderFrequency;
            p.x += (p.dx * mood.particleSpeedMultiplier) + Math.sin(p.wobble) * 0.5 * mood.movementVariance;
            p.y += p.dy * mood.particleSpeedMultiplier;
            if (p.y > engine.height + 10) {
              p.y = -10;
              p.x = Math.random() * engine.width;
            }
            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            ctx.globalAlpha = Math.max(0, p.opacity * mood.particleOpacityMultiplier);
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
          const time = engine.lastTime * 0.001;
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += (p.dx * mood.particleSpeedMultiplier) + Math.sin(time * 1.4 * mood.wanderFrequency + i) * 0.4 * mood.movementVariance;
            p.y += p.dy * mood.particleSpeedMultiplier;
            p.rot += p.rotSpeed * mood.movementVariance;

            if (p.y > engine.height + 15) { p.y = -15; p.x = Math.random() * engine.width; }
            if (p.x > engine.width + 15) { p.x = -15; p.y = Math.random() * engine.height; }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = mood.particleOpacityMultiplier;
            ctx.fillStyle = 'rgba(244, 114, 182, 0.70)';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();

            // Subtle contrasting mood glint/specular rim on petal edge
            if (mood.ambientBloomA > 0.02) {
              const sr = Math.round(mood.specularR);
              const sg = Math.round(mood.specularG);
              const sb = Math.round(mood.specularB);
              ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${(mood.ambientBloomA * 0.85).toFixed(3)})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          // 1. Antique Sepia Dust Motes
          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            p.x += p.dx * mood.movementSpeedMultiplier;
            p.y += p.dy * mood.movementSpeedMultiplier;

            if (p.x < -10) p.x = engine.width + 10;
            if (p.x > engine.width + 10) p.x = -10;
            if (p.y < -10) p.y = engine.height + 10;
            if (p.y > engine.height + 10) p.y = -10;

            const currentOpacity = p.opacity * mood.particleOpacityMultiplier * (0.7 + 0.3 * Math.sin(time * p.pulseSpeed * mood.pulseIntensity + p.pulseOffset));

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 120, ${Math.max(0, currentOpacity)})`;
            ctx.shadowBlur = 3 * mood.pulseIntensity;
            ctx.shadowColor = `rgba(212, 175, 120, ${Math.max(0, currentOpacity * 0.6)})`;
            ctx.fill();
            ctx.restore();
          }

          // 2. Rare Microscopic Film Scratch
          if (performance.now() > engine.nextScratchTime) {
            engine.scratchX = Math.random() * engine.width;
            engine.nextScratchTime = performance.now() + (5000 + Math.random() * 7000) / Math.max(0.3, mood.activityLevel);
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
          const mood = engine.moodManager ? engine.moodManager.getModifiers() : MOOD_PROFILES.neutral;

          for (let i = 0; i < engine.particles.length; i++) {
            const p = engine.particles[i];
            const currentOpacity = p.opacity * mood.particleOpacityMultiplier * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed * mood.pulseIntensity + p.twinkleOffset));
            p.x += Math.sin(time * 0.3 * mood.wanderFrequency + i) * 0.1 * mood.movementSpeedMultiplier;

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(196, 181, 253, ${Math.max(0, currentOpacity)})`;
            ctx.shadowBlur = 4 * mood.pulseIntensity;
            ctx.shadowColor = `rgba(167, 139, 250, ${Math.max(0, currentOpacity * 0.5)})`;
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

    // 4. Restore active decoupled Mood if previously chosen
    const savedMood = localStorage.getItem('archive-user-mood');
    if (savedMood && engine.moodManager) {
      engine.moodManager.activateMood(savedMood, true);
    }
  }

  // ——— Window Global Exports ———
  window.AtmosphereEngine = engine;
  window.MoodManager = engine.moodManager;
  window.WEBSITE_MODES = WEBSITE_MODES;
  window.READING_THEMES = READING_THEMES;
  window.applyWebsiteMode = applyWebsiteMode;
  window.applyReadingTheme = applyReadingTheme;
  window.setAtmosphereEffect = setAtmosphereEffect;
  window.triggerAtmosphereRipple = (x, y) => engine.triggerRipple(x, y);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAtmosphereSystem);
  } else {
    initAtmosphereSystem();
  }
})();
