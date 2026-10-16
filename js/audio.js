/**
 * PRODOMO FOCUS STUDIO - PROCEDURAL WEB AUDIO API ENGINE
 * Generates high quality ambient soundscapes, focus waves, and alerts
 * without relying on external mp3 files. Zero latency, 100% offline.
 */

class ProdomoAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeTracks = {};
    this.tickingInterval = null;
    this.tickingType = 'silent'; // 'silent', 'analog', 'wood'
    
    // Preset definitions
    this.presets = {
      rainy_day: { rain: 0.7, waves: 0.2, fire: 0, cafe: 0, forest: 0, gamma: 0, alpha: 0.3 },
      cafe_vibes: { rain: 0.2, waves: 0, fire: 0, cafe: 0.75, forest: 0, gamma: 0.2, alpha: 0 },
      deep_flow: { rain: 0.1, waves: 0.3, fire: 0, cafe: 0, forest: 0, gamma: 0.65, alpha: 0 },
      zen_forest: { rain: 0.15, waves: 0, fire: 0.2, cafe: 0, forest: 0.7, gamma: 0, alpha: 0.5 },
      warm_fire: { rain: 0.3, waves: 0, fire: 0.8, cafe: 0, forest: 0.2, gamma: 0, alpha: 0 }
    };
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Set master volume (0.0 to 1.0)
  setMasterVolume(val) {
    this.init();
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    return this.isMuted;
  }

  // --- WHITE/PINK/BROWN NOISE BUFFER GENERATOR ---
  createNoiseBuffer(type = 'white', duration = 5) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        left[i] = Math.random() * 2 - 1;
        right[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
      let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        b3L = 0.86650 * b3L + whiteL * 0.3104856;
        b4L = 0.55000 * b4L + whiteL * 0.5329522;
        b5L = -0.7616 * b5L - whiteL * 0.0168980;
        left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.11;
        b6L = whiteL * 0.115926;

        const whiteR = Math.random() * 2 - 1;
        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        b3R = 0.86650 * b3R + whiteR * 0.3104856;
        b4R = 0.55000 * b4R + whiteR * 0.5329522;
        b5R = -0.7616 * b5R - whiteR * 0.0168980;
        right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.11;
        b6R = whiteR * 0.115926;
      }
    } else if (type === 'brown') {
      let lastL = 0, lastR = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        left[i] = (lastL + (0.02 * whiteL)) / 1.02;
        lastL = left[i];
        left[i] *= 3.5;

        const whiteR = Math.random() * 2 - 1;
        right[i] = (lastR + (0.02 * whiteR)) / 1.02;
        lastR = right[i];
        right[i] *= 3.5;
      }
    }
    return buffer;
  }

  // --- AMBIENT SOUND GENERATORS ---

  // 1. Rain Soundscape
  startRain(volume = 0.5) {
    if (this.activeTracks.rain) return;
    this.init();

    const buffer = this.createNoiseBuffer('pink', 4);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter to simulate raindrops on glass/roof
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.45, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.activeTracks.rain = { source, gain, filter };
  }

  // 2. Ocean Waves
  startWaves(volume = 0.5) {
    if (this.activeTracks.waves) return;
    this.init();

    const buffer = this.createNoiseBuffer('brown', 5);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);

    // LFO for rhythmic tide movement
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.6, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    lfo.start();

    this.activeTracks.waves = { source, lfo, gain };
  }

  // 3. Campfire Crackle
  startFire(volume = 0.5) {
    if (this.activeTracks.fire) return;
    this.init();

    const buffer = this.createNoiseBuffer('brown', 3);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    // Random crackles interval
    const crackleInterval = setInterval(() => {
      if (!this.activeTracks.fire || this.isMuted) return;
      if (Math.random() > 0.4) {
        this.playCrackle(gain.gain.value);
      }
    }, 180);

    this.activeTracks.fire = { source, gain, crackleInterval };
  }

  playCrackle(vol) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + Math.random() * 1200, this.ctx.currentTime);
    g.gain.setValueAtTime(vol * (0.1 + Math.random() * 0.15), this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 4. Cozy Cafe Murmur
  startCafe(volume = 0.5) {
    if (this.activeTracks.cafe) return;
    this.init();

    const buffer = this.createNoiseBuffer('pink', 4);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.activeTracks.cafe = { source, gain };
  }

  // 5. Night Forest & Wind
  startForest(volume = 0.5) {
    if (this.activeTracks.forest) return;
    this.init();

    const buffer = this.createNoiseBuffer('white', 4);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Gentle wind filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.35, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.activeTracks.forest = { source, gain };
  }

  // 6. 40Hz Gamma Focus Waves (Binaural Beats)
  startGamma(volume = 0.5) {
    if (this.activeTracks.gamma) return;
    this.init();

    const merger = this.ctx.createChannelMerger(2);
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();

    // 200Hz base tone, 40Hz difference for Gamma focus
    oscL.frequency.setValueAtTime(196, this.ctx.currentTime);
    oscR.frequency.setValueAtTime(236, this.ctx.currentTime);

    oscL.type = 'sine';
    oscR.type = 'sine';

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);

    oscL.connect(merger, 0, 0); // Left channel
    oscR.connect(merger, 0, 1); // Right channel
    merger.connect(gain);
    gain.connect(this.masterGain);

    oscL.start();
    oscR.start();

    this.activeTracks.gamma = { oscL, oscR, gain };
  }

  // 7. 10Hz Alpha Waves (Calm state)
  startAlpha(volume = 0.5) {
    if (this.activeTracks.alpha) return;
    this.init();

    const merger = this.ctx.createChannelMerger(2);
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();

    // 210Hz & 220Hz (10Hz Alpha difference)
    oscL.frequency.setValueAtTime(210, this.ctx.currentTime);
    oscR.frequency.setValueAtTime(220, this.ctx.currentTime);

    oscL.type = 'sine';
    oscR.type = 'sine';

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.18, this.ctx.currentTime);

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(this.masterGain);

    oscL.start();
    oscR.start();

    this.activeTracks.alpha = { oscL, oscR, gain };
  }

  // Stop a specific track
  stopTrack(name) {
    const track = this.activeTracks[name];
    if (!track) return;

    if (track.source) {
      try { track.source.stop(); } catch(e) {}
    }
    if (track.lfo) {
      try { track.lfo.stop(); } catch(e) {}
    }
    if (track.oscL) {
      try { track.oscL.stop(); track.oscR.stop(); } catch(e) {}
    }
    if (track.crackleInterval) {
      clearInterval(track.crackleInterval);
    }
    delete this.activeTracks[name];
  }

  // Set individual track volume
  setTrackVolume(name, val) {
    const track = this.activeTracks[name];
    if (track && track.gain) {
      track.gain.gain.setValueAtTime(Math.max(0, val), this.ctx.currentTime);
    }
  }

  // Stop all ambient tracks
  stopAllTracks() {
    Object.keys(this.activeTracks).forEach(name => this.stopTrack(name));
  }

  // Apply a sound preset
  applyPreset(presetKey) {
    const preset = this.presets[presetKey];
    if (!preset) return;

    this.stopAllTracks();
    for (const [key, vol] of Object.entries(preset)) {
      if (vol > 0) {
        if (key === 'rain') this.startRain(vol);
        if (key === 'waves') this.startWaves(vol);
        if (key === 'fire') this.startFire(vol);
        if (key === 'cafe') this.startCafe(vol);
        if (key === 'forest') this.startForest(vol);
        if (key === 'gamma') this.startGamma(vol);
        if (key === 'alpha') this.startAlpha(vol);
      }
    }
  }

  // --- TICKING SOUND DURING TIMER ---
  setTicking(type) {
    this.tickingType = type;
  }

  playTick() {
    if (this.tickingType === 'silent' || this.isMuted) return;
    this.init();

    if (this.tickingType === 'analog') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } else if (this.tickingType === 'wood') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }
  }

  // --- COMPLETION CHIMES & ALERTS ---
  playAlarm(soundType = 'zen_gong') {
    this.init();
    const now = this.ctx.currentTime;

    if (soundType === 'zen_gong') {
      // Singing bowl harmonic simulation
      const freqs = [350, 700, 1050, 1400];
      const gains = [0.4, 0.2, 0.1, 0.05];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        g.gain.setValueAtTime(gains[idx], now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 3.5);
      });
    } else if (soundType === 'crystal_chime') {
      // Ascending major arpeggio: C6, E6, G6, C7
      const notes = [1046.5, 1318.5, 1567.98, 2093.0];
      notes.forEach((freq, i) => {
        const time = now + (i * 0.12);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        g.gain.setValueAtTime(0.25, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 1.2);
      });
    } else if (soundType === 'digital') {
      // Crisp sci-fi double beep
      [880, 1174.66].forEach((freq, i) => {
        const time = now + (i * 0.15);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        g.gain.setValueAtTime(0.15, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.1);
      });
    } else if (soundType === 'bell') {
      // Classic elevator bell ding
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.8);
    }
  }
}

// Global audio singleton
window.ProdomoAudio = new ProdomoAudioEngine();
