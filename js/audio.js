/* ============================================================
   PREMIUM AMBIENT AUDIO MANAGER — THE ARCHIVE
   Authentic, curated, seamless high-fidelity ambient recordings
   Smooth crossfading, zero humming, low CPU, offline-first with CDN fallback
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY_ENABLED = 'archive-ambient-enabled';
  const STORAGE_KEY_VOLUME = 'archive-ambient-volume';

  const DEFAULT_VOLUME = 0.40;
  const FADE_DURATION_MS = 1200; // Smooth 1.2s crossfade between mode audio tracks

  // ——— High-Quality Mode Ambient Audio Track Catalog ———
  // Licensed CC0 / Public Domain ambient audio recordings (curated from Moodist & open field libraries)
  const MODE_AUDIO_CATALOG = {
    dark: {
      name: 'Quiet Archive Room',
      desc: 'Warm room tone with quiet library atmosphere',
      localSrc: 'audio/dark.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/places/library.mp3',
      defaultGain: 0.65
    },
    magic: {
      name: 'Enchanted Chimes',
      desc: 'Dreamy atmospheric breeze with delicate crystal chime resonances',
      localSrc: 'audio/magic.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/things/wind-chimes.mp3',
      defaultGain: 0.42
    },
    forest: {
      name: 'Peaceful Woodland',
      desc: 'Gentle morning birdsong, peaceful woodland air & soft rustling',
      localSrc: 'audio/forest.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/animals/birds.mp3',
      defaultGain: 0.36
    },
    ocean: {
      name: 'Coastal Waves',
      desc: 'Natural rolling ocean surf and soft rhythmic shoreline ambience',
      localSrc: 'audio/ocean.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/nature/waves.mp3',
      defaultGain: 0.38
    },
    sunset: {
      name: 'Evening Hearth',
      desc: 'Warm crackling campfire and calm dusk breeze',
      localSrc: 'audio/sunset.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/nature/campfire.mp3',
      defaultGain: 0.35
    },
    cosmos: {
      name: 'Celestial Resonance',
      desc: 'Subtle ethereal cosmic vibration & deep meditative peace',
      localSrc: 'audio/cosmos.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/things/singing-bowl.mp3',
      defaultGain: 0.35
    },
    rain: {
      name: 'Gentle Rainfall',
      desc: 'Realistic soothing rainfall and soft environmental water droplets',
      localSrc: 'audio/rain.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/rain/light-rain.mp3',
      defaultGain: 0.40
    },
    autumn: {
      name: 'Golden Autumn',
      desc: 'Soft, peaceful piano instrumental — autumn warmth and golden hour tranquility (Kai Engel — September / Chapter Four Fall)',
      localSrc: 'audio/autumn.mp3',
      cdnSrc: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Kai_Engel_-_02_-_September.ogg',
      defaultGain: 1.0
    },
    winter: {
      name: 'Soft Winter Wind',
      desc: 'Gentle cold breeze and quiet snowy expanse',
      localSrc: 'audio/winter.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/nature/wind.mp3',
      defaultGain: 0.32
    },
    sakura: {
      name: 'Temple Garden',
      desc: 'Serene eastern breeze, distant temple bells & soothing tranquility',
      localSrc: 'audio/sakura.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/places/temple.mp3',
      defaultGain: 0.38
    },
    vintage: {
      name: 'Nostalgic Vinyl',
      desc: 'Warm vinyl crackle, subtle antique acoustic texture',
      localSrc: 'audio/vintage.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/things/vinyl-effect.mp3',
      defaultGain: 0.36
    },
    midnight: {
      name: 'Midnight Garden',
      desc: 'Nocturnal crickets under open starlight and distant night breeze',
      localSrc: 'audio/midnight.mp3',
      cdnSrc: 'https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/animals/crickets.mp3',
      defaultGain: 0.88
    }
  };

  // ——— Centralized AmbientAudioManager Class ———
  class AmbientAudioManager {
    constructor() {
      // Audio channels for dual-deck seamless crossfading
      this.channelA = new Audio();
      this.channelB = new Audio();
      this.activeChannel = 'A'; // 'A' or 'B'
      this.activeMode = 'dark';
      this.targetMode = 'dark';

      // Setup audio elements for seamless looping
      [this.channelA, this.channelB].forEach((audio) => {
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        audio.crossOrigin = 'anonymous';

        // Error handling with automatic fallback to CDN
        audio.addEventListener('error', () => {
          const track = MODE_AUDIO_CATALOG[this.activeMode];
          if (track && audio.src && !audio.src.includes('cdn.jsdelivr.net') && track.cdnSrc) {
            console.warn(`[AmbientAudio] Local audio load failed for ${this.activeMode}, falling back to CDN...`);
            audio.src = track.cdnSrc;
            if (this.isEnabled && !document.hidden) {
              audio.play().catch(() => {});
            }
          }
        });
      });

      this.isEnabled = false;
      this.masterVolume = DEFAULT_VOLUME;
      this.isTabVisible = true;
      this.isUnlocked = false;
      this.fadeIntervalId = null;
    }

    init() {
      // 1. Restore volume & enabled state from localStorage
      const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.masterVolume = parsed;
        }
      }

      const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
      this.isEnabled = savedEnabled === 'true';

      // 2. Read initial mode from document
      const currentMode = document.documentElement.dataset.websiteMode || 'dark';
      this.activeMode = currentMode;
      this.targetMode = currentMode;

      // 3. User interaction listener to handle browser autoplay policies
      const handleUserGesture = () => {
        this.isUnlocked = true;
        if (this.isEnabled) {
          const activeAudio = this.getActiveAudio();
          if (activeAudio && activeAudio.paused && activeAudio.src) {
            activeAudio.play().catch((err) => {
              console.log('[AmbientAudio] Autoplay unlock note:', err.message);
            });
          }
        }
      };

      ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((event) => {
        document.addEventListener(event, handleUserGesture, { passive: true });
      });

      // 4. Tab visibility listener (pause when hidden, resume when visible)
      document.addEventListener('visibilitychange', () => {
        this.isTabVisible = !document.hidden;
        const currentAudio = this.getActiveAudio();
        if (!currentAudio) return;

        if (this.isTabVisible) {
          if (this.isEnabled && currentAudio.paused && currentAudio.src) {
            currentAudio.play().catch(() => {});
          }
        } else {
          if (!currentAudio.paused) {
            currentAudio.pause();
          }
        }
      });

      // 5. Initialize UI Controls
      this.initUI();

      // If enabled, preload and start active mode
      if (this.isEnabled) {
        this.setMode(this.activeMode, true);
      }
    }

    getActiveAudio() {
      return this.activeChannel === 'A' ? this.channelA : this.channelB;
    }

    getInactiveAudio() {
      return this.activeChannel === 'A' ? this.channelB : this.channelA;
    }

    getTrack(modeId) {
      return MODE_AUDIO_CATALOG[modeId] || MODE_AUDIO_CATALOG.dark;
    }

    // ——— Smooth Crossfade Engine ———
    setMode(modeId, forcePlay = false) {
      const mode = MODE_AUDIO_CATALOG[modeId] ? modeId : 'dark';
      this.targetMode = mode;
      this.updateModeLabelUI();

      // If not enabled and not forced, only record target mode
      if (!this.isEnabled && !forcePlay) {
        this.activeMode = mode;
        return;
      }

      // If already playing the same mode and audio is active, don't restart
      const currentAudio = this.getActiveAudio();
      if (this.activeMode === mode && currentAudio.src && !currentAudio.paused && !forcePlay) {
        return;
      }

      this.activeMode = mode;
      const track = this.getTrack(mode);

      // Determine incoming and outgoing channels
      const outgoingAudio = this.getActiveAudio();
      this.activeChannel = this.activeChannel === 'A' ? 'B' : 'A';
      const incomingAudio = this.getActiveAudio();

      // Setup incoming audio track
      const trackSrc = track.localSrc;
      if (incomingAudio.src !== window.location.origin + '/' + trackSrc && !incomingAudio.src.endsWith(trackSrc)) {
        incomingAudio.src = trackSrc;
      }
      incomingAudio.loop = true;
      incomingAudio.currentTime = 0;

      const targetGain = (track.defaultGain || 0.70) * this.masterVolume;

      // If audio is disabled, keep volume at 0 and pause
      if (!this.isEnabled) {
        incomingAudio.volume = 0;
        outgoingAudio.pause();
        return;
      }

      // Start playing incoming audio at 0 volume
      incomingAudio.volume = 0.001;
      const playPromise = incomingAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked: will resume on next user gesture
        });
      }

      // Smooth Crossfade Animation using high-precision interpolation
      if (this.fadeIntervalId) {
        clearInterval(this.fadeIntervalId);
        this.fadeIntervalId = null;
      }

      const startTime = performance.now();
      const startOutVol = outgoingAudio.volume;

      this.fadeIntervalId = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / FADE_DURATION_MS);

        // Ease-in-out curve for natural acoustics
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        // Fade down outgoing audio
        if (outgoingAudio && !outgoingAudio.paused) {
          outgoingAudio.volume = Math.max(0, startOutVol * (1 - ease));
        }

        // Fade up incoming audio
        if (incomingAudio) {
          incomingAudio.volume = Math.max(0, Math.min(1, targetGain * ease));
        }

        if (progress >= 1) {
          clearInterval(this.fadeIntervalId);
          this.fadeIntervalId = null;
          if (outgoingAudio) {
            outgoingAudio.pause();
            outgoingAudio.volume = 0;
          }
          if (incomingAudio) {
            incomingAudio.volume = Math.max(0, Math.min(1, targetGain));
          }
        }
      }, 30);
    }

    // ——— Master Toggle Control ———
    toggle(forceState) {
      const newState = typeof forceState === 'boolean' ? forceState : !this.isEnabled;
      this.isEnabled = newState;
      localStorage.setItem(STORAGE_KEY_ENABLED, String(this.isEnabled));

      const activeAudio = this.getActiveAudio();
      const track = this.getTrack(this.activeMode);
      const targetGain = (track.defaultGain || 0.70) * this.masterVolume;

      if (this.isEnabled) {
        if (!activeAudio.src || activeAudio.src === '') {
          activeAudio.src = track.localSrc;
        }
        activeAudio.loop = true;
        activeAudio.volume = 0.001;
        activeAudio.play().catch(() => {});

        // Short fade in
        let progress = 0;
        const fadeIn = setInterval(() => {
          progress += 0.1;
          activeAudio.volume = Math.min(targetGain, targetGain * progress);
          if (progress >= 1) {
            activeAudio.volume = targetGain;
            clearInterval(fadeIn);
          }
        }, 30);
      } else {
        // Short fade out
        let vol = activeAudio.volume;
        const fadeOut = setInterval(() => {
          vol -= 0.1 * targetGain;
          if (vol <= 0.01) {
            activeAudio.pause();
            activeAudio.volume = 0;
            clearInterval(fadeOut);
          } else {
            activeAudio.volume = Math.max(0, vol);
          }
        }, 25);
      }

      this.updateUI();
    }

    // ——— Volume Control ———
    setVolume(val) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterVolume = clamped;
      localStorage.setItem(STORAGE_KEY_VOLUME, String(this.masterVolume));

      if (this.isEnabled) {
        const activeAudio = this.getActiveAudio();
        const track = this.getTrack(this.activeMode);
        const targetGain = (track.defaultGain || 0.70) * this.masterVolume;
        if (activeAudio) {
          activeAudio.volume = targetGain;
        }
      }

      this.updateVolumeUI();
    }

    // ——— UI Controller & Listeners ———
    initUI() {
      const toggleBtn = document.getElementById('ambientToggleBtn');
      const popover = document.getElementById('ambientPopover');
      const powerBtn = document.getElementById('ambientPowerBtn');
      const volumeSlider = document.getElementById('ambientVolume');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();

          // Close mode selector popover if open
          const modePopover = document.getElementById('modePopover');
          if (modePopover) modePopover.hidden = true;

          // Toggle ambient audio
          this.toggle();

          // If turning on, show popover for volume feedback
          if (popover) {
            popover.hidden = !this.isEnabled;
          }
        });

        if (popover) {
          document.addEventListener('click', (e) => {
            if (!popover.hidden && !popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
              popover.hidden = true;
            }
          });

          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !popover.hidden) {
              popover.hidden = true;
              toggleBtn.focus();
            }
          });
        }
      }

      if (powerBtn) {
        powerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
      }

      if (volumeSlider) {
        volumeSlider.value = this.masterVolume;
        volumeSlider.addEventListener('input', (e) => {
          this.setVolume(parseFloat(e.target.value));
        });
      }

      this.updateUI();
    }

    updateUI() {
      const toggleBtn = document.getElementById('ambientToggleBtn');
      const dot = document.getElementById('ambientStatusDot');
      const powerBtn = document.getElementById('ambientPowerBtn');

      if (toggleBtn) {
        toggleBtn.classList.toggle('playing', this.isEnabled);
        toggleBtn.setAttribute('aria-pressed', this.isEnabled ? 'true' : 'false');
      }
      if (dot) {
        dot.style.opacity = this.isEnabled ? '1' : '0';
      }
      if (powerBtn) {
        powerBtn.textContent = this.isEnabled ? 'ON' : 'OFF';
        powerBtn.classList.toggle('active', this.isEnabled);
      }

      this.updateModeLabelUI();
      this.updateVolumeUI();
    }

    updateModeLabelUI() {
      const label = document.getElementById('ambientCurrentModeLabel');
      const track = this.getTrack(this.targetMode);
      if (label && window.WEBSITE_MODES && window.WEBSITE_MODES[this.targetMode]) {
        const mode = window.WEBSITE_MODES[this.targetMode];
        label.textContent = `${mode.icon} ${track.name}`;
      } else if (label) {
        label.textContent = track ? track.name : this.targetMode;
      }
    }

    updateVolumeUI() {
      const volumeSlider = document.getElementById('ambientVolume');
      const volumeLabel = document.getElementById('ambientVolLabel');
      const pct = Math.round(this.masterVolume * 100);

      if (volumeSlider && Math.abs(parseFloat(volumeSlider.value) - this.masterVolume) > 0.01) {
        volumeSlider.value = this.masterVolume;
      }
      if (volumeLabel) {
        volumeLabel.textContent = `${pct}%`;
      }
    }
  }

  // ——— Create & Expose Singleton Instance ———
  const manager = new AmbientAudioManager();
  window.AmbientAudioManager = manager;
  window.MODE_AUDIO_CATALOG = MODE_AUDIO_CATALOG;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.init());
  } else {
    manager.init();
  }
})();
